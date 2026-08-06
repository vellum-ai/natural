import { execFile } from "node:child_process";
import type { ToolContext, ToolExecutionResult } from "@vellumai/plugin-api";

const NATURAL_URL = "https://www.natural.com/";
const startedConversations = new Set<string>();

function runAssistant(args: string[], ctx: ToolContext, timeout: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      "assistant",
      args,
      { timeout, maxBuffer: 1024 * 1024 },
      (error) => (error ? reject(error) : resolve()),
    );
    ctx.signal?.addEventListener("abort", () => child.kill(), { once: true });
  });
}

export default {
  name: "host_natural_setup",
  description:
    "Run Natural's browser-first authentication setup. With action=start, first execute the supported " +
    "assistant browser command to open a new tab at https://www.natural.com/, then tell the user to sign " +
    "in or sign up, create or select an agent, issue an agent key, and return. With action=prompt, only " +
    "after the user confirms onboarding_complete=true, execute the supported secure assistant credentials " +
    "prompt for service natural and field api_key. Never ask for the secret in chat or use OAuth.",
  category: "finance",
  defaultRiskLevel: "low" as const,
  executionTarget: "host" as const,
  input_schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      action: {
        type: "string",
        enum: ["start", "prompt"],
        description:
          "Use start to open Natural first. Use prompt only after the user confirms sign-in/sign-up, " +
          "agent creation or selection, and agent-key issuance are complete.",
      },
      onboarding_complete: {
        type: "boolean",
        description:
          "Must be true for prompt, after the user returns from Natural with an agent key ready. " +
          "Never include the key itself in tool input.",
      },
    },
    required: ["action"],
  },
  async execute(
    input: Record<string, unknown>,
    ctx: ToolContext,
  ): Promise<ToolExecutionResult> {
    const action = String(input.action ?? "").trim();

    if (action === "start") {
      try {
        await runAssistant(
          ["browser", "tabs", "new", "--url", NATURAL_URL, "--json"],
          ctx,
          30_000,
        );
      } catch {
        return {
          content:
            "I could not open the Natural browser tab, so I will not open a credential prompt. " +
            "Make the assistant browser available and try Natural setup again.",
          isError: true,
        };
      }

      startedConversations.add(ctx.conversationId);
      return {
        content:
          "A new browser tab is open at https://www.natural.com/. In that tab:\n" +
          "1. Sign in or sign up for Natural and complete onboarding.\n" +
          "2. Create an agent for this assistant, or select an existing agent.\n" +
          "3. Issue an agent key for that agent. Do not use OAuth or a regular party API key.\n" +
          "4. Keep the agent key private and return here.\n\n" +
          "After you confirm you are back with the agent key ready, run this setup tool with " +
          "action=prompt and onboarding_complete=true. Do not put the key in chat or tool input.",
        isError: false,
        yieldToUser: true,
      };
    }

    if (action === "prompt") {
      if (!startedConversations.has(ctx.conversationId)) {
        return {
          content:
            "Natural setup has not started in this conversation. Use action=start first; no credential " +
            "prompt will be opened before the browser-first onboarding step.",
          isError: true,
        };
      }
      if (input.onboarding_complete !== true) {
        return {
          content:
            "I will not open the credential prompt until you confirm that Natural onboarding is complete " +
            "and the agent key has been issued. Use onboarding_complete=true only then.",
          isError: true,
        };
      }

      try {
        await runAssistant(
          [
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
          ctx,
          10 * 60 * 1000,
        );
      } catch {
        return {
          content:
            "The secure Natural agent-key prompt did not complete. The key was not requested in chat; " +
            "try the setup again when you are ready.",
          isError: true,
        };
      }

      return {
        content:
          "The Natural agent key was stored in the encrypted credential vault under service natural and " +
          "field api_key. The MCP configuration remains endpoint-only. Verify with get_identity before " +
          "any payment operation.",
        isError: false,
      };
    }

    return {
      content: "Unknown Natural setup action. Use action=start or action=prompt.",
      isError: true,
    };
  },
};
