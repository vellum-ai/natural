# Natural

Stage 1 Vellum plugin for Natural's hosted Model Context Protocol (MCP) server.

## Scope

This plugin is intentionally thin. It contributes:

- A standard HTTP MCP connection to `https://mcp.natural.com`
- A payment-operation skill with confirmation and safety playbooks

The plugin does not contain a REST client, local tools, hooks, routes, apps, API keys, or personal identifiers.

## Authentication

Authenticate through the Vellum host's MCP authentication flow or credential vault, according to the Natural account and deployment environment. Credentials must remain host-managed and must not be added to `mcp.json`, source files, or documentation.

## Payment safety

Read the bundled `skills/natural/SKILL.md` before using payment-related tools. Treat transfers, withdrawals, deposits, fulfillment, and other state-changing operations as consequential actions requiring explicit confirmation immediately before execution.
