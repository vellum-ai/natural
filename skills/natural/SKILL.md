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

Use Natural's hosted MCP tools for wallet and payment operations through a host-managed Natural agent key. The agent key must identify the configured Vellum agent. Do not switch to OAuth or a regular party API key.

## Browser-first setup before asking for the key

When Natural is not authenticated, use the executable `host_natural_setup` tool before using any Natural MCP tool. It enforces a two-phase flow and never opens a credential prompt first.

1. Call `host_natural_setup` with `action=start`. It executes the supported command `assistant browser tabs new --url https://www.natural.com/ --json` and opens a new browser tab at `https://www.natural.com/`.
2. Tell the user to sign in or sign up in that tab and complete onboarding.
3. Tell the user to create an agent for this assistant, or select an existing agent.
4. Tell the user to issue an **agent key** for that agent. Do not use OAuth or a regular party API key.
5. Tell the user to keep the agent key private and return here.
6. Only after the user confirms they are back and the agent key is ready, call `host_natural_setup` with `action=prompt` and `onboarding_complete=true`. It executes the supported secure command `assistant credentials prompt --service natural --field api_key ...`.

The credential identity must remain `natural/api_key` even though the value is a Natural agent key. Never request or accept the secret in chat or tool input. After setup, verify authentication with `get_identity` and confirm that the response identifies an agent before attempting any payment operation.

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

## Strict guardrails

1. Never execute a transfer, withdrawal, deposit, fulfillment, dispute action, delegation, or other mutation without explicit user confirmation for the exact operation and amount.
2. Never treat a vague instruction such as “pay them,” “send it,” or “withdraw the balance” as sufficient authorization. Resolve the recipient, wallet, amount, currency, and purpose first.
3. Never create or simulate unsupported operations through REST calls, raw HTTP, or undocumented tools. Stage 1 is MCP-only.
4. Never place, reveal, log, or repeat API keys, OAuth tokens, wallet identifiers, party identifiers, agent identifiers, or other private credentials or personal IDs.
5. Never guess balances, fees, exchange rates, transaction status, identity, or authorization. If the tool is unavailable, times out, or returns an ambiguous result, report the uncertainty and reconcile before retrying.
6. Do not retry an unknown payment mutation automatically. A timeout may have succeeded; inspect transactions or payment status first.
7. Do not claim a payment is complete until Natural confirms the resulting status. Distinguish requested, pending, completed, failed, rejected, and unknown.
8. Human identity, KYB, account recovery, and authentication decisions remain with Natural's user-facing flow. Do not attempt to bypass them.
9. Keep confirmations narrowly scoped. A confirmation for one payment does not authorize later payments, changed amounts, or a different recipient.
10. When a request conflicts with these guardrails, refuse the unsafe step and offer a read-only status or verification action instead.
