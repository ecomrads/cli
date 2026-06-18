/** Production FastAPI origin (same as ecomrads-mcp). */
export const DEFAULT_API_BASE = "https://backend-ecomrads-production.up.railway.app";

export interface Config {
  api_base_url: string;
  access_token: string;
  imgbb_api_key?: string;
}

export function configDir(): string {
  const home = process.env.HOME ?? process.env.USERPROFILE;
  if (!home) throw new Error("Cannot determine home directory");
  return `${home}/.ecomrads`;
}

export function configPath(): string {
  return `${configDir()}/config.json`;
}

export async function loadConfig(): Promise<Config> {
  const cfg: Config = {
    api_base_url: DEFAULT_API_BASE,
    access_token: "",
  };

  const envBase = process.env.ECOMRADS_API_BASE_URL?.trim();
  if (envBase) cfg.api_base_url = envBase.replace(/\/+$/, "");

  const envToken = process.env.ECOMRADS_ACCESS_TOKEN?.trim();
  if (envToken) cfg.access_token = envToken;

  const envImgbb = process.env.IMGBB_API_KEY?.trim();
  if (envImgbb) cfg.imgbb_api_key = envImgbb;

  try {
    const { readFile } = await import("node:fs/promises");
    const raw = await readFile(configPath(), "utf8");
    const fileCfg = JSON.parse(raw) as Partial<Config>;
    if (fileCfg.api_base_url) cfg.api_base_url = fileCfg.api_base_url.replace(/\/+$/, "");
    if (fileCfg.access_token) cfg.access_token = fileCfg.access_token;
    if (fileCfg.imgbb_api_key) cfg.imgbb_api_key = fileCfg.imgbb_api_key;
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== "ENOENT") throw err;
  }

  return cfg;
}

export async function saveConfig(cfg: Config): Promise<void> {
  const { mkdir, writeFile } = await import("node:fs/promises");
  const dir = configDir();
  await mkdir(dir, { recursive: true, mode: 0o700 });
  if (!cfg.api_base_url) cfg.api_base_url = DEFAULT_API_BASE;
  cfg.api_base_url = cfg.api_base_url.replace(/\/+$/, "");
  await writeFile(configPath(), JSON.stringify(cfg, null, 2) + "\n", {
    mode: 0o600,
  });
}

export function isAuthenticated(cfg: Config): boolean {
  return cfg.access_token.length > 0;
}

export function isUploadConfigured(cfg: Config): boolean {
  return Boolean(cfg.imgbb_api_key?.trim());
}

export async function requireAuth(): Promise<Config> {
  const cfg = await loadConfig();
  if (!isAuthenticated(cfg)) {
    throw new Error("not authenticated — run: ecomrads auth token <access-token>");
  }
  return cfg;
}
