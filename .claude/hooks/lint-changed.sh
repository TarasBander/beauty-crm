#!/usr/bin/env bash
# PostToolUse (Edit|Write): run oxlint on the edited TS file inside its
# workspace and feed any errors back to Claude (exit 2).
f=$(jq -r '.tool_response.filePath // .tool_input.file_path // empty')
case "$f" in *.ts|*.tsx) ;; *) exit 0 ;; esac

root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}"
case "$f" in
  "$root"/backend/*) ws="$root/backend" ;;
  "$root"/frontend/*) ws="$root/frontend" ;;
  *) exit 0 ;;
esac

out=$(cd "$ws" && npx --no-install oxlint --deny-warnings "$f" 2>&1)
if [ $? -ne 0 ]; then
  echo "oxlint found problems in $f:" >&2
  echo "$out" >&2
  exit 2
fi
exit 0
