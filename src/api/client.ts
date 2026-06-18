export interface JobResponse {
  job_id: string;
  id?: string;
  status: string;
  result?: unknown;
  error?: string;
  detail?: unknown;
}

export class ApiClient {
  constructor(
    private baseURL: string,
    private token: string,
  ) {
    this.baseURL = baseURL.replace(/\/+$/, "");
  }

  async post(path: string, body: unknown): Promise<unknown> {
    const url = `${this.baseURL}${path.startsWith("/") ? path : `/${path}`}`;
    const res = await fetch(url, {
      method: "POST",
      headers: this.headers({ "Content-Type": "application/json" }),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(120_000),
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`API POST ${path}: ${trimBody(text)}`);
    }
    return text ? JSON.parse(text) : null;
  }

  async getJob(jobId: string): Promise<JobResponse> {
    const safeId = jobId.replace(/\//g, "%2F");
    const url = `${this.baseURL}/jobs/${safeId}`;
    const res = await fetch(url, {
      method: "GET",
      headers: this.headers(),
      signal: AbortSignal.timeout(120_000),
    });
    const text = await res.text();
    if (!res.ok) {
      throw new Error(`GET /jobs/${jobId}: ${trimBody(text)}`);
    }
    const job = JSON.parse(text) as JobResponse;
    if (!job.job_id) job.job_id = job.id ?? jobId;
    return job;
  }

  async waitJob(
    jobId: string,
    intervalMs: number,
    timeoutMs: number,
  ): Promise<JobResponse> {
    const deadline = Date.now() + timeoutMs;
    await sleep(15_000);

    for (;;) {
      const job = await this.getJob(jobId);
      const status = job.status.toLowerCase();
      if (status === "completed" || status === "failed" || status === "cancelled") {
        return job;
      }
      if (Date.now() > deadline) {
        throw new Error(
          `timed out waiting for job ${jobId} (last status: ${job.status})`,
        );
      }
      await sleep(intervalMs);
    }
  }

  private headers(extra: Record<string, string> = {}): Record<string, string> {
    const h: Record<string, string> = {
      Accept: "application/json",
      ...extra,
    };
    if (this.token) h.Authorization = `Bearer ${this.token}`;
    return h;
  }
}

export function extractJobId(data: unknown): string {
  if (!data || typeof data !== "object") {
    throw new Error("no job_id in response");
  }
  const obj = data as Record<string, unknown>;
  for (const key of ["job_id", "id"]) {
    const val = obj[key];
    if (typeof val === "string" && val) return val;
  }
  throw new Error(`no job_id in response: ${trimBody(JSON.stringify(data))}`);
}

function trimBody(s: string): string {
  const t = s.trim();
  return t.length > 500 ? t.slice(0, 500) + "..." : t;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
