export interface GlobalOptions {
  json: boolean;
  noColor: boolean;
  wait: boolean;
  waitTimeoutMs: number;
  waitIntervalMs: number;
}

export const defaultGlobals: GlobalOptions = {
  json: false,
  noColor: false,
  wait: false,
  waitTimeoutMs: 10 * 60 * 1000,
  waitIntervalMs: 30 * 1000,
};

/** Parse durations like 30s, 10m, 1h */
export function parseDuration(input: string): number {
  const m = input.trim().match(/^(\d+(?:\.\d+)?)(ms|s|m|h)?$/i);
  if (!m) throw new Error(`invalid duration: ${input}`);
  const n = parseFloat(m[1]);
  switch ((m[2] ?? "s").toLowerCase()) {
    case "ms":
      return n;
    case "s":
      return n * 1000;
    case "m":
      return n * 60_000;
    case "h":
      return n * 3_600_000;
    default:
      return n * 1000;
  }
}

export function addWaitOptions(cmd: import("commander").Command): void {
  cmd
    .option("--wait", "Wait for job completion")
    .option(
      "--wait-timeout <duration>",
      "Max wait duration (e.g. 10m)",
      "10m",
    )
    .option(
      "--wait-interval <duration>",
      "Poll interval (e.g. 30s)",
      "30s",
    );
}

export function waitOptionsFromCommand(
  cmd: import("commander").Command,
  globals: GlobalOptions,
): GlobalOptions {
  const opts = cmd.opts<{ wait?: boolean; waitTimeout?: string; waitInterval?: string }>();
  return {
    ...globals,
    wait: globals.wait || Boolean(opts.wait),
    waitTimeoutMs: opts.waitTimeout
      ? parseDuration(opts.waitTimeout)
      : globals.waitTimeoutMs,
    waitIntervalMs: opts.waitInterval
      ? parseDuration(opts.waitInterval)
      : globals.waitIntervalMs,
  };
}
