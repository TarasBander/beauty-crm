#!/usr/bin/env bash
# PreToolUse (Edit|Write|Bash): never let Claude write real .env files —
# they hold local secrets and are gitignored. .env.example stays editable.
input=$(cat)
tool=$(echo "$input" | jq -r '.tool_name // empty')

block() {
  echo "Blocked: $1 holds local secrets. Edit .env.example instead and tell the user what to change in their .env." >&2
  exit 2
}

if [ "$tool" = "Bash" ]; then
  cmd=$(echo "$input" | jq -r '.tool_input.command // empty')
  # Writes to .env via redirection, tee, sed -i, cp/mv/rm/truncate.
  target=$(echo "$cmd" | grep -Eo '(>>?|tee( -a)?|sed -i[^ ]*( [^ ]+)*|cp [^ ]+|mv [^ ]+|rm( -[a-z]+)?|truncate[^ ]*( [^ ]+)*)[[:space:]]+[^[:space:];&|]*\.env(\.[^[:space:];&|]*)?' \
    | grep -Eo '[^[:space:]]*\.env(\.[^[:space:];&|]*)?$' | grep -Ev '\.env\.example$' | head -1)
  [ -n "$target" ] && block "$target"
  exit 0
fi

f=$(echo "$input" | jq -r '.tool_input.file_path // empty')
case "$(basename "$f")" in
  .env.example) exit 0 ;;
  .env|.env.*) block "$f" ;;
esac
exit 0
