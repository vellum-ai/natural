#!/usr/bin/env bash
# Natural agent-key setup helper.
#
#   natural_setup.sh start
#   natural_setup.sh prompt --onboarding-complete
#
# start   Prints the Natural onboarding steps and best-effort opens natural.com
#         with whatever URL opener this machine happens to have. No specific
#         browser or assistant CLI is required; when nothing can open a URL the
#         script says so and the user opens it themselves.
# prompt  Requests the agent key through the host's secure credential prompt if
#         one is available, otherwise explains how to store it out of band. The
#         key is never read from arguments, stdin, or chat.

set -euo pipefail

NATURAL_URL="https://www.natural.com/"
STATE_DIR="${NATURAL_SETUP_STATE_DIR:-${XDG_STATE_HOME:-$HOME/.local/state}/natural-plugin}"
STARTED_MARKER="$STATE_DIR/setup-started"

usage() {
  cat <<'EOF'
Usage:
  natural_setup.sh start
  natural_setup.sh prompt --onboarding-complete

Run start first. Run prompt only after the user confirms they have issued a
Natural agent key and returned.
EOF
}

# Best-effort URL open. Prints the opener that worked, or nothing if none did.
open_url() {
  local url="$1" opener browser="${BROWSER:-}"

  # $BROWSER may carry arguments; only its first word is the command.
  browser="${browser%% *}"
  if [ -n "$browser" ] && command -v "$browser" >/dev/null 2>&1; then
    if "$browser" "$url" >/dev/null 2>&1; then
      printf '%s' "$browser"
      return 0
    fi
  fi

  for opener in xdg-open open wslview; do
    if command -v "$opener" >/dev/null 2>&1; then
      if "$opener" "$url" >/dev/null 2>&1; then
        printf '%s' "$opener"
        return 0
      fi
    fi
  done

  return 1
}

cmd_start() {
  mkdir -p "$STATE_DIR"
  : >"$STARTED_MARKER"

  local opener=""
  if opener="$(open_url "$NATURAL_URL")"; then
    echo "Opened $NATURAL_URL with $opener."
  else
    echo "No URL opener was available on this machine."
    echo "Open $NATURAL_URL yourself, or ask the user to open it."
  fi

  cat <<EOF

At $NATURAL_URL:
1. Sign in or sign up for Natural and complete onboarding.
2. Create an agent for this assistant, or select an existing agent.
3. Issue an agent key for that agent. Do not use OAuth or a regular party API key.
4. Keep the agent key private and return here.

After the user confirms they are back with the agent key ready, run:
  natural_setup.sh prompt --onboarding-complete

Never ask for the key in chat and never pass it to this script.
EOF
}

cmd_prompt() {
  local onboarding_complete=0

  while [ "$#" -gt 0 ]; do
    case "$1" in
      --onboarding-complete) onboarding_complete=1 ;;
      *)
        echo "Unknown option for prompt: $1" >&2
        usage >&2
        exit 2
        ;;
    esac
    shift
  done

  if [ ! -e "$STARTED_MARKER" ]; then
    echo "Natural setup has not started here. Run 'natural_setup.sh start' first;" >&2
    echo "no credential prompt is opened before the onboarding step." >&2
    exit 1
  fi

  if [ "$onboarding_complete" -ne 1 ]; then
    echo "Refusing to open the credential prompt until the user confirms that Natural" >&2
    echo "onboarding is complete and the agent key has been issued. Re-run with" >&2
    echo "--onboarding-complete only then." >&2
    exit 1
  fi

  if command -v assistant >/dev/null 2>&1 &&
    assistant credentials prompt \
      --service natural \
      --field api_key \
      --label "Natural agent key" \
      --description "Enter the agent key issued for the selected Natural agent." \
      --placeholder "Paste your Natural agent key" \
      --usage-description "Authenticate Natural hosted MCP as the selected agent." \
      --allowed-domains "natural.com,mcp.natural.com"; then
    cat <<'EOF'
The Natural agent key was stored in the host credential vault under service
natural and field api_key. The MCP configuration remains endpoint-only.
Verify with get_identity before any payment operation.
EOF
    return 0
  fi

  cat <<'EOF'
No secure credential prompt is available here, so nothing was stored.

Ask the user to save the agent key in this host's credential storage under
service "natural" and field "api_key". Do not accept the key in chat, in a
file, in mcp.json, or as an argument to this script.

Once it is stored, verify with get_identity before any payment operation.
EOF
}

main() {
  if [ "$#" -eq 0 ]; then
    usage >&2
    exit 2
  fi

  local action="$1"
  shift

  case "$action" in
    start)
      if [ "$#" -gt 0 ]; then
        echo "start takes no options." >&2
        exit 2
      fi
      cmd_start
      ;;
    prompt) cmd_prompt "$@" ;;
    -h | --help | help) usage ;;
    *)
      echo "Unknown action: $action" >&2
      usage >&2
      exit 2
      ;;
  esac
}

main "$@"
