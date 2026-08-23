---
name: natural
description: Use Natural's hosted MCP tools for payment and wallet operations with explicit confirmation and conservative handling of financial actions.
compatibility: Designed for Vellum personal assistants
metadata:
  emoji: "💳"
  vellum:
    category: "finance"
    display-name: "Natural Payments"
---

# Natural payment playbooks

Use Natural's hosted MCP tools for wallet and payment operations. The plugin declares the server in root `mcp.json`. After install, the assistant connects to `https://mcp.natural.com` and the tools land in the catalog as `mcp__natural__<tool>` (or the names the catalog actually shows). Prefer those tools. Do not add a second workspace MCP entry for the same server, and do not call Natural over REST, raw HTTP, or undocumented tools.

## Authorization

Prefer connecting to Natural using the plugin's MCP settings, which enables the user to authorize the Natural MCP server with hosted OAuth. The browser opens Natural's authorization page.

After authorization, verify with `get_identity` and confirm that the response identifies an agent before any payment operation.

If the tools are missing from the catalog, or every call fails at the transport level, the client owns that. Point the user at connection settings first. Reload the host's MCP tools after they finish signing in.

### Agent-key fallback

Use the skill script only when the host has no MCP OAuth path for this server. The value is a Natural **agent key**, stored under the credential identity `natural/api_key`. Do not use a regular party API key.

1. Run `bun scripts/natural_setup.ts start`. It prints the onboarding steps and makes a best-effort attempt to open `https://www.natural.com/` with whatever URL opener the machine has.
2. If the script reports that it could not open the URL, open `https://www.natural.com/` with whatever browser capability you have, or ask the user to open it. Do not assume any particular browser tool exists.
3. Tell the user to sign in or sign up at Natural and complete onboarding.
4. Tell the user to create an agent for this assistant, or select an existing agent.
5. Tell the user to issue an **agent key** for that agent. Do not use a regular party API key.
6. Tell the user to keep the agent key private and return here.
7. Only after the user confirms they are back and the agent key is ready, run `bun scripts/natural_setup.ts prompt --onboarding-complete`. It opens the host's secure credential prompt for service `natural`, field `api_key`. If no such prompt exists on this host, the script says so and explains where the user must store the key instead; relay that and stop rather than collecting the key yourself.

Never request or accept the secret in chat, in a file, or as a script argument.

Prefer inspection before mutation, state exactly what will happen, and verify the result from the tool response.

## Read-only playbooks

- **Wallet status:** list wallets, then retrieve the requested wallet balance. Report currency, available amount, and any pending or unavailable amount separately.
- **Transaction lookup:** list transactions with the narrowest useful filters. Do not infer settlement, reversal, recipient identity, or completion from a missing or partial result.
- **Payment context:** inspect the relevant payment or request before acting. Confirm amount, currency, sender, recipient, status, memo, and expiry when available.

## State-changing playbooks

- **Fulfill a payment request:** locate the exact request, restate its amount, currency, recipient, and purpose, then obtain explicit user confirmation immediately before calling the fulfillment tool.
- **Transfer between wallets:** verify source wallet, destination wallet, amount, and currency. Ask for any missing or conflicting detail. Obtain explicit confirmation immediately before the transfer.
- **Deposit or withdrawal:** treat as consequential and potentially irreversible. Confirm the exact amount, currency, destination or source, fees if shown, and the user's intent before execution.
- **Other payment mutations:** apply the same inspect, summarize, confirm, execute, and verify sequence. Do not broaden a request beyond the stated operation.

MCP payment tools use a decimal amount and a required three-letter currency code (for example `"10.50"` and `"USD"`). If an amount cannot be represented exactly, ask which exact amount to send instead of rounding.

## Strict guardrails

1. Never execute a transfer, withdrawal, deposit, fulfillment, dispute action, delegation, or other mutation without explicit user confirmation for the exact operation and amount.
2. Never treat a vague instruction such as “pay them,” “send it,” or “withdraw the balance” as sufficient authorization. Resolve the recipient, wallet, amount, currency, and purpose first.
3. Never create or simulate unsupported operations through REST calls, raw HTTP, or undocumented tools. Use the plugin-declared MCP tools only.
4. Never place, reveal, log, or repeat API keys, OAuth tokens, wallet identifiers, party identifiers, agent identifiers, or other private credentials or personal IDs.
5. Never guess balances, fees, exchange rates, transaction status, identity, or authorization. If the tool is unavailable, times out, or returns an ambiguous result, report the uncertainty and reconcile before retrying.
6. Do not retry an unknown payment mutation automatically. A timeout may have succeeded; inspect transactions or payment status first.
7. Do not claim a payment is complete until Natural confirms the resulting status. Distinguish requested, pending, completed, failed, rejected, and unknown.
8. Human identity, KYB, account recovery, and authentication decisions remain with Natural's user-facing flow. Do not attempt to bypass them.
9. Keep confirmations narrowly scoped. A confirmation for one payment does not authorize later payments, changed amounts, or a different recipient.
10. When a request conflicts with these guardrails, refuse the unsafe step and offer a read-only status or verification action instead.
