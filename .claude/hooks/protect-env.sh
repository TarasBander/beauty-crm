#!/usr/bin/env bash
# PreToolUse (Edit|Write): never let Claude write real .env files — they hold
# local secrets and are gitignored. .env.example stays editable.
f=$(jq -r '.tool_input.file_path // empty')
case "$(basename "$f")" in
  .env.example) exit 0 ;;
  .env|.env.*)
    echo "Blocked: $f holds local secrets. Edit .env.example instead and tell the user what to change in their .env." >&2
    exit 2 ;;
esac
exit 0
