# Natural

Vellum plugin for Natural's hosted Model Context Protocol (MCP) server.

## Getting Started

```bash
assistant plugins install natural
```

This is the install command, resolving the plugin by name from the Vellum marketplace catalog. It works once the plugin has been published there, which is a reviewed step.

Then authorize the Natural MCP server through your client's connection settings.

### Installing from this repository

```bash
assistant plugins install https://github.com/vellum-ai/natural
```

Installing by URL is for QA: it is how a version gets exercised on a real assistant before it is published for review. It clones this tree verbatim and bypasses the catalog, so the source is untrusted and the CLI prints a warning naming it. Point it at a branch or a fork to test a change that is not on `main` yet.

Use the name, not the URL, once the plugin is published.

## Authentication

Use a Natural **agent key** for this connector. Agent keys bind actions to one Natural agent, so Natural attributes activity to that agent instead of only to the user account. Do not use OAuth or a regular party API key for this integration.

### Setup steps

Setup is driven by the skill script `skills/natural/scripts/natural_setup.ts`, run with Bun, not by a host tool. When Natural is unauthenticated, the assistant runs:

```sh
bun skills/natural/scripts/natural_setup.ts start
```

That prints the onboarding steps and makes a best-effort attempt to open [natural.com](https://www.natural.com/) using whatever URL opener the machine provides (`$BROWSER`, `xdg-open`, `open`, `wslview`). It assumes no particular browser tooling: if nothing can open a URL, it says so and the assistant or the user opens the link instead. At natural.com:

1. Sign in or sign up for Natural and complete onboarding.
2. Create an agent for this assistant, or select an existing agent.
3. Issue an **agent key** for that agent. Do not use OAuth or a regular party API key.
4. Keep the agent key private and return to the assistant.

Only after the user confirms they have returned with the agent key ready may the assistant run:

```sh
bun skills/natural/scripts/natural_setup.ts prompt --onboarding-complete
```

The script refuses to reach this phase before `start` has run, and refuses without the explicit `--onboarding-complete` confirmation. It then opens the host's secure credential prompt for service `natural`, field `api_key`. Where the host offers no such prompt, the script stores nothing and explains that the user must save the key in host credential storage under that same identity.

Never paste the key into chat, script arguments, source control, `mcp.json`, or a normal message. The key is used as a bearer token against `https://mcp.natural.com` and is stored only in host-managed credential storage.

The Vellum host injects the agent key securely. Keep the secret in host-managed credential storage. Never add it to `mcp.json`, source files, README examples, logs, or committed configuration.

## Payment safety

Read the bundled `skills/natural/SKILL.md` before using payment-related tools. Treat transfers, withdrawals, deposits, fulfillment, and other state-changing operations as consequential actions requiring explicit confirmation immediately before execution.
