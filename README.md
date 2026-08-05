# Natural

Stage 1 Vellum plugin for Natural's hosted Model Context Protocol (MCP) server.

## Scope

This plugin is intentionally thin. It contributes:

- A standard HTTP MCP connection to `https://mcp.natural.com`
- A payment-operation skill with confirmation and safety playbooks

The plugin does not contain a REST client, local tools, hooks, routes, apps, API keys, or personal identifiers.

## Authentication

Use a Natural **agent key** for this connector. Agent keys attribute actions to the configured Vellum agent instead of attributing them only to the user account. Do not use OAuth or a regular Natural API key for this integration.

The Vellum host must inject the agent key as bearer authentication for `https://mcp.natural.com`. Keep the secret in host-managed credential storage. Never add it to `mcp.json`, source files, README examples, logs, or committed configuration.

## Payment safety

Read the bundled `skills/natural/SKILL.md` before using payment-related tools. Treat transfers, withdrawals, deposits, fulfillment, and other state-changing operations as consequential actions requiring explicit confirmation immediately before execution.
