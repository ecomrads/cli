import type { Command } from "commander";
import { ApiClient } from "../api/client.js";
import { loadConfig, requireAuth, saveConfig, isAuthenticated, isUploadConfigured } from "../config.js";
import type { GlobalOptions } from "../globals.js";
import { parseDuration } from "../globals.js";
import { printJson } from "../utils/output.js";
import { VERSION } from "../version.js";

export function registerAuthCommands(program: Command, globals: GlobalOptions): void {
  const auth = program.command("auth").description("Authenticate with eComrads");

  auth
    .command("login")
    .description("Sign in via browser (OAuth)")
    .option("--no-open", "Print sign-in URL instead of opening the browser")
    .action(async (opts: { open?: boolean }) => {
      const { loginWithBrowser } = await import("../auth/login.js");
      const session = await loginWithBrowser({ openBrowser: opts.open !== false });
      const cfg = await loadConfig();
      cfg.access_token = session.access_token;
      if (session.refresh_token) cfg.refresh_token = session.refresh_token;
      await saveConfig(cfg);
      if (globals.json) {
        printJson({ status: "authenticated", expires_in: session.expires_in });
      } else {
        console.log("Signed in. Token saved to ~/.ecomrads/config.json");
      }
    });

  auth
    .command("token")
    .description("Save a Supabase access token manually (advanced)")
    .argument("<access-token>", "Supabase access token")
    .action(async (token: string) => {
      const cfg = await loadConfig();
      cfg.access_token = token;
      await saveConfig(cfg);
      if (globals.json) printJson({ status: "authenticated" });
      else console.log("Token saved to ~/.ecomrads/config.json");
    });

  auth
    .command("imgbb-key")
    .description("Save ImgBB API key (optional fallback for upload without login)")
    .argument("<api-key>", "ImgBB API key")
    .action(async (key: string) => {
      const cfg = await loadConfig();
      cfg.imgbb_api_key = key;
      await saveConfig(cfg);
      if (globals.json) printJson({ status: "imgbb_configured" });
      else console.log("ImgBB key saved to ~/.ecomrads/config.json");
    });

  auth
    .command("status")
    .description("Show authentication status")
    .action(async () => {
      const cfg = await loadConfig();
      if (globals.json) {
        printJson({
          authenticated: isAuthenticated(cfg),
          upload_via: isAuthenticated(cfg)
            ? "backend"
            : isUploadConfigured(cfg)
              ? "imgbb"
              : "none",
          api_base_url: cfg.api_base_url,
        });
        return;
      }
      console.log(`API: ${cfg.api_base_url}`);
      console.log(
        isAuthenticated(cfg)
          ? "Auth: authenticated (Bearer JWT)"
          : "Auth: not authenticated — run: ecomrads auth login",
      );
      if (isAuthenticated(cfg)) {
        console.log("Upload: via eComrads backend (no ImgBB key needed)");
      } else if (isUploadConfigured(cfg)) {
        console.log("Upload: IMGBB_API_KEY configured (fallback)");
      } else {
        console.log("Upload: run ecomrads auth login first");
      }
    });

  auth
    .command("logout")
    .description("Clear stored credentials")
    .action(async () => {
      const cfg = await loadConfig();
      cfg.access_token = "";
      cfg.refresh_token = "";
      await saveConfig(cfg);
      if (globals.json) printJson({ status: "logged_out" });
      else console.log("Logged out.");
    });
}

export function registerUploadCommand(program: Command, globals: GlobalOptions): void {
  program
    .command("upload")
    .description("Upload an image and get a public URL")
    .argument("<file-or-url>", "Local file path or https URL")
    .option(
      "--expiration <seconds>",
      "ImgBB auto-delete seconds (60-86400, default 24h)",
      String(86400),
    )
    .action(async (target: string, opts: { expiration: string }) => {
      const cfg = await loadConfig();
      let result;

      if (isAuthenticated(cfg)) {
        const { uploadViaBackend } = await import("../upload/backend.js");
        result = await uploadViaBackend(cfg.api_base_url, cfg.access_token, target);
      } else if (isUploadConfigured(cfg)) {
        const { uploadImage } = await import("../upload/imgbb.js");
        result = await uploadImage(
          cfg.imgbb_api_key!,
          target,
          parseInt(opts.expiration, 10),
        );
      } else {
        throw new Error(
          "not authenticated — run: ecomrads auth login\n(or set IMGBB_API_KEY for ImgBB-only upload)",
        );
      }

      const { formatUploadHuman } = await import("../upload/imgbb.js");
      if (globals.json) printJson(result);
      else console.log(formatUploadHuman(result));
    });
}

export function registerJobCommands(program: Command, globals: GlobalOptions): void {
  const job = program.command("job").description("Inspect and wait on generation jobs");

  job
    .command("get")
    .description("Get job status")
    .argument("<job_id>", "Job ID")
    .action(async (jobId: string) => {
      const cfg = await requireAuth();
      const client = new ApiClient(cfg.api_base_url, cfg.access_token);
      const { printJob } = await import("../utils/output.js");
      const j = await client.getJob(jobId);
      printJob(j, globals);
    });

  job
    .command("wait")
    .description("Wait until job reaches a terminal state")
    .argument("<job_id>", "Job ID")
    .option("--wait-timeout <duration>", "Max wait", "10m")
    .option("--wait-interval <duration>", "Poll interval", "30s")
    .action(async (jobId: string, opts: { waitTimeout: string; waitInterval: string }) => {
      const cfg = await requireAuth();
      const client = new ApiClient(cfg.api_base_url, cfg.access_token);
      const { printJob } = await import("../utils/output.js");
      const j = await client.waitJob(
        jobId,
        parseDuration(opts.waitInterval),
        parseDuration(opts.waitTimeout),
      );
      if (j.status.toLowerCase() === "failed") {
        throw new Error(`job failed: ${j.error ?? "unknown error"}`);
      }
      if (j.status.toLowerCase() === "cancelled") {
        throw new Error("job cancelled");
      }
      printJob(j, globals);
    });
}

export function registerVersionCommand(program: Command, globals: GlobalOptions): void {
  const COMMIT = process.env.ECOMRADS_CLI_COMMIT ?? "npm";

  program
    .command("version")
    .description("Print version information")
    .action(() => {
      if (globals.json) {
        printJson({
          version: VERSION,
          commit: COMMIT,
          node: process.version,
          platform: process.platform,
          arch: process.arch,
        });
      } else {
        console.log(
          `ecomrads ${VERSION} (${COMMIT}) ${process.platform}/${process.arch}`,
        );
      }
    });
}
