import type { Command } from "commander";
import { ApiClient } from "../api/client.js";
import type { GlobalOptions } from "../globals.js";
import { parseDuration } from "../globals.js";
import { printJob, printJson } from "../utils/output.js";

export async function finishJob(
  client: ApiClient,
  jobId: string,
  opts: GlobalOptions,
): Promise<void> {
  if (!opts.wait) {
    if (opts.json) {
      printJson({ job_id: jobId });
    } else {
      console.log(`job started: ${jobId}`);
      console.log(`Run: ecomrads job wait ${jobId}`);
    }
    return;
  }

  const job = await client.waitJob(
    jobId,
    opts.waitIntervalMs,
    opts.waitTimeoutMs,
  );
  if (job.status.toLowerCase() === "failed") {
    throw new Error(`job failed: ${job.error ?? "unknown error"}`);
  }
  if (job.status.toLowerCase() === "cancelled") {
    throw new Error("job cancelled");
  }
  printJob(job, opts);
}

export async function postCreative(
  path: string,
  body: Record<string, unknown>,
  opts: GlobalOptions,
): Promise<void> {
  const { requireAuth } = await import("../config.js");
  const cfg = await requireAuth();
  const client = new ApiClient(cfg.api_base_url, cfg.access_token);
  const data = await client.post(path, body);

  if (opts.json && !opts.wait) {
    printJson(data);
    return;
  }

  const { extractJobId } = await import("../api/client.js");
  try {
    const jobId = extractJobId(data);
    await finishJob(client, jobId, opts);
  } catch {
    if (opts.json) printJson(data);
    else console.log(typeof data === "string" ? data : JSON.stringify(data));
  }
}

function mergeWait(cmd: Command, globals: GlobalOptions): GlobalOptions {
  const o = cmd.opts<{
    wait?: boolean;
    waitTimeout?: string;
    waitInterval?: string;
  }>();
  return {
    ...globals,
    wait: globals.wait || Boolean(o.wait),
    waitTimeoutMs: o.waitTimeout
      ? parseDuration(o.waitTimeout)
      : globals.waitTimeoutMs,
    waitIntervalMs: o.waitInterval
      ? parseDuration(o.waitInterval)
      : globals.waitIntervalMs,
  };
}

export function registerCreativeCommands(
  program: Command,
  globals: GlobalOptions,
): void {
  program
    .command("photoshoot")
    .description("Product photoshoot / image edit (POST /post/edit)")
    .requiredOption("--image <url>", "Product image URL (from upload)")
    .requiredOption("--prompt <text>", "Creative prompt")
    .option("--aspect-ratio <ratio>", "Aspect ratio", "1:1")
    .option("--resolution <res>", "Resolution", "2K")
    .option("--wait", "Wait for job completion")
    .option("--wait-timeout <duration>", "Max wait", "10m")
    .option("--wait-interval <duration>", "Poll interval", "30s")
    .action(async function (this: Command) {
      const o = this.opts<{
        image: string;
        prompt: string;
        aspectRatio: string;
        resolution: string;
      }>();
      await postCreative(
        "/post/edit",
        {
          image_urls: [o.image],
          prompt: o.prompt,
          aspect_ratio: o.aspectRatio,
          resolution: o.resolution,
        },
        mergeWait(this, globals),
      );
    });

  program
    .command("storyboard")
    .description("9-angle product storyboard (POST /post/multi-angles)")
    .requiredOption("--image <url>", "Product image URL")
    .option("--prompt <text>", "Optional prompt")
    .option("--aspect-ratio <ratio>", "Aspect ratio", "4:5")
    .option("--resolution <res>", "Resolution", "2K")
    .option("--wait", "Wait for job completion")
    .option("--wait-timeout <duration>", "Max wait", "10m")
    .option("--wait-interval <duration>", "Poll interval", "30s")
    .action(async function (this: Command) {
      const o = this.opts<{
        image: string;
        prompt?: string;
        aspectRatio: string;
        resolution: string;
      }>();
      const body: Record<string, unknown> = {
        image_urls: [o.image],
        aspect_ratio: o.aspectRatio,
        resolution: o.resolution,
      };
      if (o.prompt) body.prompt = o.prompt;
      await postCreative("/post/multi-angles", body, mergeWait(this, globals));
    });

  program
    .command("video")
    .description("Animate a product still (POST /post/animate)")
    .requiredOption("--frame <url>", "Product image URL (maps to image_url)")
    .requiredOption("--prompt <text>", "Motion prompt")
    .option("--aspect-ratio <ratio>", "Aspect ratio", "9:16")
    .option("--duration <seconds>", "Duration in seconds", "10")
    .option("--resolution <res>", "Resolution", "std")
    .option("--video-model <model>", "Video model", "kling-3.0")
    .option("--wait", "Wait for job completion")
    .option("--wait-timeout <duration>", "Max wait", "10m")
    .option("--wait-interval <duration>", "Poll interval", "45s")
    .action(async function (this: Command) {
      const o = this.opts<{
        frame: string;
        prompt: string;
        aspectRatio: string;
        duration: string;
        resolution: string;
        videoModel: string;
      }>();
      await postCreative(
        "/post/animate",
        {
          image_url: o.frame,
          prompt: o.prompt,
          aspect_ratio: o.aspectRatio,
          duration: parseInt(o.duration, 10),
          resolution: o.resolution,
          video_model: o.videoModel,
        },
        mergeWait(this, globals),
      );
    });

  program
    .command("ugc")
    .description("UGC-style creator video (POST /post/ugc)")
    .requiredOption("--script <text>", "Spoken script")
    .requiredOption("--image <url>", "Product image URL")
    .option("--actor-image <url>", "Presenter image URL")
    .option("--style <style>", "video_style", "testimonial")
    .option("--direction <dir>", "direction", "authentic")
    .option("--aspect-ratio <ratio>", "Aspect ratio", "9:16")
    .option("--duration <seconds>", "Duration in seconds", "5")
    .option("--wait", "Wait for job completion")
    .option("--wait-timeout <duration>", "Max wait", "10m")
    .option("--wait-interval <duration>", "Poll interval", "45s")
    .action(async function (this: Command) {
      const o = this.opts<{
        script: string;
        image: string;
        actorImage?: string;
        style: string;
        direction: string;
        aspectRatio: string;
        duration: string;
      }>();
      const body: Record<string, unknown> = {
        script: o.script,
        image_urls: [o.image],
        video_style: o.style,
        direction: o.direction,
        aspect_ratio: o.aspectRatio,
        duration: parseInt(o.duration, 10),
      };
      if (o.actorImage) body.actor_image_url = o.actorImage;
      await postCreative("/post/ugc", body, mergeWait(this, globals));
    });

  program
    .command("ad")
    .description("Static / carousel ad (POST /post/static)")
    .requiredOption("--product-image <url>", "Product image URL")
    .option("--instructions <text>", "Creative brief")
    .option("--format <ratio>", "Ad format", "4:5")
    .option("--slides <n>", "Number of slides", "1")
    .option("--resolution <res>", "Resolution", "2K")
    .option("--wait", "Wait for job completion")
    .option("--wait-timeout <duration>", "Max wait", "10m")
    .option("--wait-interval <duration>", "Poll interval", "30s")
    .action(async function (this: Command) {
      const o = this.opts<{
        productImage: string;
        instructions?: string;
        format: string;
        slides: string;
        resolution: string;
      }>();
      const body: Record<string, unknown> = {
        product_image_url: o.productImage,
        ad_format: o.format,
        num_slides: parseInt(o.slides, 10),
        resolution: o.resolution,
      };
      if (o.instructions) body.instructions = o.instructions;
      await postCreative("/post/static", body, mergeWait(this, globals));
    });

  program
    .command("recreate")
    .description("Recreate a competitor-style ad (POST /post/genanalysis)")
    .requiredOption("--product-image <url>", "Your product URL")
    .requiredOption("--ad-media <url>", "Reference ad URL")
    .option("--media-type <type>", "image or video", "image")
    .option("--wait", "Wait for job completion")
    .option("--wait-timeout <duration>", "Max wait", "10m")
    .option("--wait-interval <duration>", "Poll interval", "30s")
    .action(async function (this: Command) {
      const o = this.opts<{
        productImage: string;
        adMedia: string;
        mediaType: string;
      }>();
      await postCreative(
        "/post/genanalysis",
        {
          product_image_url: o.productImage,
          ad_media_url: o.adMedia,
          media_type: o.mediaType,
        },
        mergeWait(this, globals),
      );
    });

  program
    .command("analyze")
    .description("Virality Analysis (POST /post/ad-score)")
    .requiredOption("--media <url>", "Ad creative URL")
    .option("--media-type <type>", "image or video", "image")
    .option("--context <text>", "Audience/platform context")
    .option("--wait", "Wait for job completion")
    .option("--wait-timeout <duration>", "Max wait", "10m")
    .option("--wait-interval <duration>", "Poll interval", "30s")
    .action(async function (this: Command) {
      const o = this.opts<{
        media: string;
        mediaType: string;
        context?: string;
      }>();
      const body: Record<string, unknown> = {
        media_url: o.media,
        media_type: o.mediaType,
      };
      if (o.context) body.context = o.context;
      await postCreative("/post/ad-score", body, mergeWait(this, globals));
    });

  program
    .command("spy")
    .description("Meta Ads Library research (POST /spy/)")
    .requiredOption("--query <text>", "Brand or search term")
    .option("--country <code>", "Country code")
    .action(async function (this: Command) {
      const o = this.opts<{ query: string; country?: string }>();
      const body: Record<string, unknown> = { query: o.query };
      if (o.country) body.country = o.country;
      const { requireAuth } = await import("../config.js");
      const cfg = await requireAuth();
      const client = new ApiClient(cfg.api_base_url, cfg.access_token);
      const data = await client.post("/spy/", body);
      if (globals.json) printJson(data);
      else console.log(JSON.stringify(data, null, 2));
    });
}
