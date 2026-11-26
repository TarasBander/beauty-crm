#!/usr/bin/env bash
# PreToolUse (Bash): before Claude runs `git commit` or `git push`:
#   1. refuses if a real .env file would be committed/pushed;
#   2. runs lint + unit tests for every workspace (backend/frontend) the
#      commit or push touches. Any failure blocks the command (exit 2) and
#      the output is shown to Claude so it can fix the problem first.
set -uo pipefail

cmd=$(jq -r '.tool_input.command // empty')

git_sub='(^|[;&|(]|&&|\|\|)[[:space:]]*git([[:space:]]+-C[[:space:]]+[^[:space:]]+)?[[:space:]]+'
if echo "$cmd" | grep -Eq "${git_sub}commit([[:space:]]|$)"; then
  mode=commit
elif echo "$cmd" | grep -Eq "${git_sub}push([[:space:]]|$)"; then
  mode=push
else
  exit 0
fi

root="${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel)}"
cd "$root" || exit 0

is_env() { grep -E '(^|/)\.env(\.[^/]*)?$' | grep -Ev '\.env\.example$'; }

if [ "$mode" = commit ]; then
  # The hook runs before the command, so `git add … && git commit` hasn't
  # staged anything yet: look at everything that could end up committed.
  files=$( { git diff --cached --name-only; git diff --name-only; git ls-files --others --exclude-standard; } | sort -u)
  # .env is gitignored, so it only gets in via an explicit `git add -f .env`.
  forced=$(echo "$cmd" | grep -Eo '[^[:space:]]*\.env(\.[^[:space:]]*)?' | grep -Ev '\.env\.example$' || true)
  bad=$( { echo "$files" | is_env; echo "$cmd" | grep -Eq 'add[^;&|]*(-f|--force)' && echo "$forced"; } | sed '/^$/d' || true)
else
  upstream=$(git rev-parse --abbrev-ref --symbolic-full-name '@{u}' 2>/dev/null || echo origin/main)
  files=$(git diff --name-only "$upstream"...HEAD 2>/dev/null)
  bad=$(echo "$files" | is_env || true)
fi

if [ -n "$bad" ]; then
  echo "Blocked git $mode: these files hold local secrets and must never be committed:" >&2
  echo "$bad" >&2
  echo "Unstage them (git restore --staged <file>) and change .env.example instead." >&2
  exit 2
fi

failed=0
report=""
run() { # <workspace> <label> <npm args...>
  local ws=$1 label=$2; shift 2
  local out
  if ! out=$(cd "$root/$ws" && "$@" 2>&1); then
    failed=1
    report+=$'\n'"✗ $ws: $label"$'\n'"$(echo "$out" | tail -40)"$'\n'
  fi
}

for ws in backend frontend; do
  if echo "$files" | grep -q "^$ws/"; then
    run "$ws" "lint" npm run lint --silent
    run "$ws" "tests" npm test --silent
  fi
done

if [ "$failed" -ne 0 ]; then
  echo "Blocked git $mode: checks failed. Fix these first, then retry.$report" >&2
  exit 2
fi
exit 0
