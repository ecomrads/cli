import { ApiClient } from "../api/client.js";
import type { UploadResult } from "./imgbb.js";
import { MAX_BYTES } from "./imgbb.js";

export async function uploadViaBackend(
  apiBaseUrl: string,
  accessToken: string,
  target: string,
): Promise<UploadResult> {
  target = target.trim();
  if (!target) {
    throw new Error("please provide an image URL (https://) or file path");
  }

  if (target.startsWith("http://") || target.startsWith("https://")) {
    return { url: target };
  }

  const { stat, readFile } = await import("node:fs/promises");
  const info = await stat(target);
  if (info.isDirectory()) {
    throw new Error(`${target} is a directory, not an image file`);
  }
  if (info.size > MAX_BYTES) {
    throw new Error("image larger than 32 MB limit");
  }

  const filename = target.split(/[/\\]/).pop() ?? "upload.bin";
  const fileBytes = await readFile(target);
  const client = new ApiClient(apiBaseUrl, accessToken);
  const data = (await client.post("/uploads/", {
    filename,
    file_base64: fileBytes.toString("base64"),
  })) as { url?: string; upload_id?: string; filename?: string; size_mb?: number };

  if (!data.url) {
    throw new Error("upload response missing url");
  }

  return {
    url: data.url,
    size_bytes: data.size_mb !== undefined ? Math.round(data.size_mb * 1024 * 1024) : info.size,
  };
}
