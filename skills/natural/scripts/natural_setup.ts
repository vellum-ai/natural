#!/usr/bin/env bun
// Natural agent-key setup helper.
//
//   bun natural_setup.ts start
//   bun natural_setup.ts prompt --onboarding-complete
//
// start   Prints the Natural onboarding steps and best-effort opens natural.com
//         with whatever URL opener this machine happens to have. No specific
//         browser or assistant CLI is required; when nothing can open a URL the
//         script says so and the user opens it themselves.
// prompt  Requests the agent key through the host's secure credential prompt if
//         one is available, otherwise explains how to store it out of band. The
//         key is never read from arguments, stdin, or chat.

import { mkdir } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const NATURAL_URL = "https://www.natural.com/";

// A URL opener that is still running after this long is treated as a browser
// that stayed in the foreground, not as a failure.
const OPEN_SETTLE_MS = 2_000;
const CREDENTIAL_PROMPT_TIMEOUT_MS = 10 * 60 * 1000;

const stateDir =
  process.env.NATURAL_SETUP_STATE_DIR ??
  join(
    process.env.XDG_STATE_HOME ?? join(homedir(), ".local", "state"),
    "natural-plugin",
  );
const startedMarker = join(stateDir, "setup-started");

const USAGE = `Usage:
  bun natural_setup.ts start
  bun natural_setup.ts prompt --onboarding-complete

Run start first. Run prompt only after the user confirms they have issued a
Natural agent key and returned.`;

/** Best-effort URL open. Returns the opener that worked, or null if none did. */
async function openUrl(url: string): Promise<string | null> {
  const candidates: string[] = [];

  // $BROWSER may carry arguments; only its first word is the command.
  const browser = process.env.BROWSER?.trim().split(/\s+/)[0];
  if (browser) candidates.push(browser);
  candidates.push("xdg-open", "open", "wslview");

  for (const candidate of candidates) {
    if (!Bun.which(candidate)) continue;

    const proc = Bun.spawn([candidate, url], {
      stdout: "ignore",
      stderr: "ignore",
      stdin: "ignore",
    });

    const settled = await Promise.race([
      proc.exited,
      Bun.sleep(OPEN_SETTLE_MS).then(() => "running" as const),
    ]);

    // Still running: a foreground browser we should not wait on or kill.
    if (settled === "running") {
      proc.unref();
      return candidate;
    }
    if (settled === 0) return candidate;
  }

  return null;
}

async function cmdStart(args: string[]): Promise<number> {
  if (args.length > 0) {
    console.error("start takes no options.");
    return 2;
  }

  await mkdir(stateDir, { recursive: true });
  await Bun.write(startedMarker, "");

  const opener = await openUrl(NATURAL_URL);
  if (opener) {
    console.log(`Opened ${NATURAL_URL} with ${opener}.`);
  } else {
    console.log("No URL opener was available on this machine.");
    console.log(`Open ${NATURAL_URL} yourself, or ask the user to open it.`);
  }

  console.log(`
At ${NATURAL_URL}:
1. Sign in or sign up for Natural and complete onboarding.
2. Create an agent for this assistant, or select an existing agent.
3. Issue an agent key for that agent. Do not use OAuth or a regular party API key.
4. Keep the agent key private and return here.

After the user confirms they are back with the agent key ready, run:
  bun natural_setup.ts prompt --onboarding-complete

Never ask for the key in chat and never pass it to this script.`);

  return 0;
}

/** Runs the host's secure credential prompt. Returns false if it is unusable. */
async function runCredentialPrompt(): Promise<boolean> {
  if (!Bun.which("assistant")) return false;

  const proc = Bun.spawn(
    [
      "assistant",
      "credentials",
      "prompt",
      "--service",
      "natural",
      "--field",
      "api_key",
      "--label",
      "Natural agent key",
      "--description",
      "Enter the agent key issued for the selected Natural agent.",
      "--placeholder",
      "Paste your Natural agent key",
      "--usage-description",
      "Authenticate Natural hosted MCP as the selected agent.",
      "--allowed-domains",
      "natural.com,mcp.natural.com",
    ],
    { stdin: "inherit", stdout: "inherit", stderr: "inherit" },
  );

  const timeout = setTimeout(() => proc.kill(), CREDENTIAL_PROMPT_TIMEOUT_MS);
  try {
    return (await proc.exited) === 0;
  } finally {
    clearTimeout(timeout);
  }
}

async function cmdPrompt(args: string[]): Promise<number> {
  let onboardingComplete = false;

  for (const arg of args) {
    if (arg === "--onboarding-complete") {
      onboardingComplete = true;
      continue;
    }
    console.error(`Unknown option for prompt: ${arg}`);
    console.error(USAGE);
    return 2;
  }

  if (!(await Bun.file(startedMarker).exists())) {
    console.error(
      "Natural setup has not started here. Run 'bun natural_setup.ts start' first;",
    );
    console.error("no credential prompt is opened before the onboarding step.");
    return 1;
  }

  if (!onboardingComplete) {
    console.error(
      "Refusing to open the credential prompt until the user confirms that Natural",
    );
    console.error(
      "onboarding is complete and the agent key has been issued. Re-run with",
    );
    console.error("--onboarding-complete only then.");
    return 1;
  }

  if (await runCredentialPrompt()) {
    console.log(`The Natural agent key was stored in the host credential vault under service
natural and field api_key. The MCP configuration remains endpoint-only.
Verify with get_identity before any payment operation.`);
    return 0;
  }

  console.log(`No secure credential prompt is available here, so nothing was stored.

Ask the user to save the agent key in this host's credential storage under
service "natural" and field "api_key". Do not accept the key in chat, in a
file, in mcp.json, or as an argument to this script.

Once it is stored, verify with get_identity before any payment operation.`);
  return 0;
}

async function main(argv: string[]): Promise<number> {
  const [action, ...rest] = argv;

  switch (action) {
    case "start":
      return cmdStart(rest);
    case "prompt":
      return cmdPrompt(rest);
    case "-h":
    case "--help":
    case "help":
      console.log(USAGE);
      return 0;
    case undefined:
      console.error(USAGE);
      return 2;
    default:
      console.error(`Unknown action: ${action}`);
      console.error(USAGE);
      return 2;
  }
}

process.exitCode = await main(process.argv.slice(2));
