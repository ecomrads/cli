import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { codeChallengeS256, generateCodeVerifier, randomToken, verifyState } from "./pkce.js";

const execFileAsync = promisify(execFile);

export const DEFAULT_MCP_URL = "https://mcp.ecomrads.com";

export interface LoginResult {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface LoginOptions {
  mcpUrl?: string;
  openBrowser?: boolean;
  timeoutMs?: number;
}

function trimSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

async function openUrl(url: string): Promise<void> {
  const platform = process.platform;
  if (platform === "darwin") {
    await execFileAsync("open", [url]);
    return;
  }
  if (platform === "win32") {
    await execFileAsync("cmd", ["/c", "start", "", url]);
    return;
  }
  await execFileAsync("xdg-open", [url]);
}

async function registerClient(
  issuer: string,
  redirectUri: string,
): Promise<{ client_id: string }> {
  const res = await fetch(`${issuer}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      client_name: "ecomrads-cli",
      redirect_uris: [redirectUri],
      token_endpoint_auth_method: "none",
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`OAuth client registration failed: ${raw}`);
  }
  const data = JSON.parse(raw) as { client_id?: string };
  if (!data.client_id) {
    throw new Error("OAuth client registration missing client_id");
  }
  return { client_id: data.client_id };
}

async function exchangeCode(
  issuer: string,
  input: {
    code: string;
    redirectUri: string;
    clientId: string;
    codeVerifier: string;
  },
): Promise<LoginResult> {
  const res = await fetch(`${issuer}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code: input.code,
      redirect_uri: input.redirectUri,
      client_id: input.clientId,
      code_verifier: input.codeVerifier,
    }),
    signal: AbortSignal.timeout(30_000),
  });
  const raw = await res.text();
  if (!res.ok) {
    throw new Error(`OAuth token exchange failed: ${raw}`);
  }
  const data = JSON.parse(raw) as LoginResult;
  if (!data.access_token) {
    throw new Error("OAuth token exchange missing access_token");
  }
  return data;
}

function listenForCallback(
  port: number,
  state: string,
  timeoutMs: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer((req: IncomingMessage, res: ServerResponse) => {
      const url = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);
      if (url.pathname !== "/callback") {
        res.writeHead(404);
        res.end("Not found");
        return;
      }

      const err = url.searchParams.get("error_description") ?? url.searchParams.get("error");
      if (err) {
        res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<h1>Sign-in failed</h1><p>You can close this tab and return to the terminal.</p>");
        server.close();
        reject(new Error(String(err)));
        return;
      }

      const code = url.searchParams.get("code");
      const returnedState = url.searchParams.get("state") ?? "";
      if (!code || !verifyState(returnedState, state)) {
        res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<h1>Invalid callback</h1><p>Missing code or state mismatch.</p>");
        server.close();
        reject(new Error("invalid OAuth callback"));
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(
        "<h1>Signed in</h1><p>Return to your terminal — you can close this tab.</p>",
      );
      server.close();
      resolve(code);
    });

    server.on("error", reject);
    server.listen(port, "127.0.0.1", () => {
      /* ready */
    });

    setTimeout(() => {
      server.close();
      reject(new Error("sign-in timed out — run ecomrads auth login again"));
    }, timeoutMs);
  });
}

export async function loginWithBrowser(
  options: LoginOptions = {},
): Promise<LoginResult> {
  const issuer = trimSlash(
    options.mcpUrl?.trim() || process.env.ECOMRADS_MCP_URL?.trim() || DEFAULT_MCP_URL,
  );
  const timeoutMs = options.timeoutMs ?? 5 * 60_000;
  const openBrowser = options.openBrowser ?? true;

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = codeChallengeS256(codeVerifier);
  const state = randomToken(16);
  const port = 38473 + Math.floor(Math.random() * 1000);
  const redirectUri = `http://127.0.0.1:${port}/callback`;

  const callbackPromise = listenForCallback(port, state, timeoutMs);
  const { client_id } = await registerClient(issuer, redirectUri);

  const authorize = new URL(`${issuer}/oauth/authorize`);
  authorize.searchParams.set("response_type", "code");
  authorize.searchParams.set("client_id", client_id);
  authorize.searchParams.set("redirect_uri", redirectUri);
  authorize.searchParams.set("state", state);
  authorize.searchParams.set("code_challenge", codeChallenge);
  authorize.searchParams.set("code_challenge_method", "S256");

  console.log(`Opening browser to sign in…`);
  console.log(`If it does not open, visit:\n${authorize.toString()}\n`);

  if (openBrowser) {
    try {
      await openUrl(authorize.toString());
    } catch {
      console.log("Could not open browser automatically — use the URL above.");
    }
  }

  const code = await callbackPromise;
  return exchangeCode(issuer, {
    code,
    redirectUri,
    clientId: client_id,
    codeVerifier,
  });
}
