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

The setup flow is browser-first and executable. When Natural is unauthenticated, the assistant must call the `host_natural_setup` tool with `action=start`. That runs the supported command:

```sh
assistant browser tabs new --url https://www.natural.com/ --json
```

A new browser tab opens at [natural.com](https://www.natural.com/). In that tab:

1. Sign in or sign up for Natural and complete onboarding.
2. Create an agent for this assistant, or select an existing agent.
3. Issue an **agent key** for that agent. Do not use OAuth or a regular party API key.
4. Keep the agent key private and return to Vellum.

Only after the user confirms they have returned with the agent key ready may the assistant call `host_natural_setup` with `action=prompt` and `onboarding_complete=true`. That runs the supported secure prompt command using the existing storage identity:

```sh
assistant credentials prompt --service natural --field api_key ...
```

Never paste the key into chat, tool input, source control, `mcp.json`, or a normal message. The key is used as a bearer token against `https://mcp.natural.com` and is stored only in the encrypted credential vault.

The Vellum host injects the agent key securely. Keep the secret in host-managed credential storage. Never add it to `mcp.json`, source files, README examples, logs, or committed configuration.

## Payment safety

Read the bundled `skills/natural/SKILL.md` before using payment-related tools. Treat transfers, withdrawals, deposits, fulfillment, and other state-changing operations as consequential actions requiring explicit confirmation immediately before execution.
