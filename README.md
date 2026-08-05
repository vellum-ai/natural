# Natural

Stage 1 Vellum plugin for Natural's hosted Model Context Protocol (MCP) server.

## Scope

This plugin is intentionally thin. It contributes:

- A standard HTTP MCP connection to `https://mcp.natural.com`
- A payment-operation skill with confirmation and safety playbooks

The plugin does not contain a REST client, local tools, hooks, routes, apps, API keys, or personal identifiers.

## Authentication

Use a Natural **agent key** for this connector. Agent keys bind actions to one Natural agent, so Natural attributes activity to that agent instead of only to the user account. Do not use OAuth or a regular party API key for this integration.

### Setup steps

1. Create or sign in to a Natural account at [natural.com](https://www.natural.com/), then complete onboarding.
2. In the Natural dashboard, create an agent for this assistant, or select an existing agent.
3. Issue an **agent key** for that agent. Do not use a regular party API key. Natural's team should be the source of truth for the exact dashboard action and credential scope.
4. Copy the agent key when Natural shows it. Keep the full secret private.
5. Return to Vellum and paste the key into the secure **Natural agent key** prompt. Never paste it into chat, source control, `mcp.json`, or a normal message.

Use Natural's dashboard or partner-provided documentation for the exact agent-creation and key-issuance screens. The key is used as a bearer token against `https://mcp.natural.com`.

The Vellum host injects the agent key securely. Keep the secret in host-managed credential storage. Never add it to `mcp.json`, source files, README examples, logs, or committed configuration.

## Payment safety

Read the bundled `skills/natural/SKILL.md` before using payment-related tools. Treat transfers, withdrawals, deposits, fulfillment, and other state-changing operations as consequential actions requiring explicit confirmation immediately before execution.
