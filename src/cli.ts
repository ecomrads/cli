#!/usr/bin/env node
import { Command } from "commander";
import { registerCreativeCommands } from "./commands/creative.js";
import {
  registerAuthCommands,
  registerJobCommands,
  registerUploadCommand,
  registerVersionCommand,
} from "./commands/core.js";
import { defaultGlobals, parseDuration } from "./globals.js";

import { VERSION } from "./version.js";

export function buildProgram(): Command {
  const globals = { ...defaultGlobals };

  const program = new Command()
    .name("ecomrads")
    .description("eComrads — product creatives from the terminal")
    .version(VERSION)
    .option("--json", "JSON output")
    .option("--no-color", "Disable color output")
    .option("--wait", "Wait for job completion on creative commands")
    .option("--wait-timeout <duration>", "Max wait duration", "10m")
    .option("--wait-interval <duration>", "Poll interval", "30s")
    .hook("preAction", (thisCommand) => {
      const o = thisCommand.opts<{
        json?: boolean;
        noColor?: boolean;
        wait?: boolean;
        waitTimeout?: string;
        waitInterval?: string;
      }>();
      globals.json = Boolean(o.json);
      globals.noColor = Boolean(o.noColor);
      globals.wait = Boolean(o.wait);
      if (o.waitTimeout) globals.waitTimeoutMs = parseDuration(o.waitTimeout);
      if (o.waitInterval) globals.waitIntervalMs = parseDuration(o.waitInterval);
    });

  registerAuthCommands(program, globals);
  registerUploadCommand(program, globals);
  registerCreativeCommands(program, globals);
  registerJobCommands(program, globals);
  registerVersionCommand(program, globals);

  return program;
}

export async function run(argv: string[] = process.argv): Promise<void> {
  const program = buildProgram();
  await program.parseAsync(argv);
}
