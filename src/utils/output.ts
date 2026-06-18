import type { JobResponse } from "../api/client.js";
import type { GlobalOptions } from "../globals.js";

export function printJson(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

export function printJob(job: JobResponse, opts: GlobalOptions): void {
  if (opts.json) {
    printJson(job);
    return;
  }
  console.log(`job: ${job.job_id}`);
  console.log(`status: ${job.status}`);
  if (job.result != null && job.result !== "null") {
    console.log(`result: ${JSON.stringify(job.result)}`);
  }
  if (job.error) console.log(`error: ${job.error}`);
}
