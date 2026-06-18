export const IMGBB_ENDPOINT = "https://api.imgbb.com/1/upload";
export const EXPIRATION_DEFAULT = 86400;
export const EXPIRATION_MIN = 60;
export const EXPIRATION_MAX = 86400;
export const MAX_BYTES = 32 * 1024 * 1024;
export const URL_HEADER =
  "=== ECOMRADS_UPLOAD_URL (copy exactly into downstream tools) ===";

const DATA_URL_PREFIX = /^data:[^;]+;base64,(.+)$/i;

export interface UploadResult {
  url: string;
  display_url?: string;
  delete_url?: string;
  expiration_seconds?: number;
  size_bytes?: number;
  width?: number;
  height?: number;
}

export async function uploadImage(
  apiKey: string,
  target: string,
  expiration = EXPIRATION_DEFAULT,
): Promise<UploadResult> {
  if (!apiKey.trim()) {
    throw new Error(
      "IMGBB_API_KEY is required for upload — set env or ~/.ecomrads/config.json",
    );
  }

  const { image, name } = await resolveInput(target);
  const exp = clampExpiration(expiration);
  const endpoint = new URL(IMGBB_ENDPOINT);
  endpoint.searchParams.set("key", apiKey);
  endpoint.searchParams.set("expiration", String(exp));

  const form = new URLSearchParams();
  form.set("image", image);
  if (name) form.set("name", name);

  const res = await fetch(endpoint.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
    signal: AbortSignal.timeout(120_000),
  });
  const raw = await res.text();
  if (!res.ok) throw new Error(`ImgBB upload failed: ${raw}`);

  const parsed = JSON.parse(raw) as {
    data?: {
      url?: string;
      display_url?: string;
      delete_url?: string;
      expiration?: number;
      size?: number;
      width?: number;
      height?: number;
      image?: { url?: string };
    };
  };

  const d = parsed.data ?? {};
  const publicURL = d.url || d.display_url || d.image?.url;
  if (!publicURL) throw new Error("ImgBB response missing url");

  return {
    url: publicURL,
    display_url: d.display_url,
    delete_url: d.delete_url,
    expiration_seconds: d.expiration,
    size_bytes: d.size,
    width: d.width,
    height: d.height,
  };
}

export function formatUploadHuman(r: UploadResult): string {
  const detail = JSON.stringify(r, null, 2);
  return `${URL_HEADER}\n${r.url}\n\nUse as product_image_url, media_url, or image_urls[] entry.\n\n${detail}`;
}

async function resolveInput(
  target: string,
): Promise<{ image: string; name: string }> {
  target = target.trim();
  if (!target) {
    throw new Error("please provide an image URL (https://) or file path");
  }

  if (target.startsWith("http://") || target.startsWith("https://")) {
    return { image: target, name: "" };
  }

  const { stat, readFile } = await import("node:fs/promises");
  try {
    const info = await stat(target);
    if (info.isDirectory()) {
      throw new Error(`${target} is a directory, not an image file`);
    }
    if (info.size > MAX_BYTES) {
      throw new Error("image larger than 32 MB limit");
    }
    const data = await readFile(target);
    const name = target.split(/[/\\]/).pop() ?? "";
    return { image: data.toString("base64"), name };
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "ENOENT" || code === "ENOTDIR") {
      if (target.startsWith("data:") || target.length > 256) {
        const cleaned = stripDataUrlPrefix(target);
        checkBase64Size(cleaned);
        return { image: cleaned, name: "" };
      }
      throw new Error(
        `file not found: ${target} (use https:// URL or a valid path)`,
      );
    }
    throw err;
  }
}

function stripDataUrlPrefix(value: string): string {
  const m = value.trim().match(DATA_URL_PREFIX);
  if (m) return m[1].replace(/\s/g, "");
  return value.trim().replace(/\s/g, "");
}

function checkBase64Size(b64: string): void {
  if (!b64) throw new Error("image data is empty");
  let padding = 0;
  if (b64.endsWith("==")) padding = 2;
  else if (b64.endsWith("=")) padding = 1;
  const bytes = Math.floor((b64.length * 3) / 4) - padding;
  if (bytes > MAX_BYTES) throw new Error("image larger than 32 MB limit");
}

function clampExpiration(raw: number): number {
  if (raw <= 0) return EXPIRATION_DEFAULT;
  if (raw < EXPIRATION_MIN) return EXPIRATION_MIN;
  if (raw > EXPIRATION_MAX) return EXPIRATION_MAX;
  return raw;
}
