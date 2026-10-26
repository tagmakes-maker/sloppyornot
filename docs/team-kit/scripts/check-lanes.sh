#!/usr/bin/env bash
# Pre-commit lane check. Blocks files that land outside their folder.
# Install once: bash scripts/install-hooks.sh

# CUSTOMIZE: your top-level folders, separated by |
LANES="site|worker|agent|shared|seed|docs|agent-log|tests|scripts|.github"
CONTRACT="shared/contract.schema.json"

fail=0
files=$(git diff --cached --name-only --diff-filter=ACMR)

for f in $files; do
  top="${f%%/*}"
  case "$f" in
    README.md|CONTRIBUTING.md|CLAUDE.md|AGENTS.md|.gitignore|.env.example|LICENSE|package.json|package-lock.json) continue ;;
  esac
  if ! echo "$top" | grep -qxE "$LANES"; then
    echo "BLOCKED: $f is outside every lane. Read CONTRIBUTING.md and pick a folder."
    fail=1
    continue
  fi
  if [ "$f" = "$CONTRACT" ]; then
    echo "NOTICE: you are changing the contract. Everyone must agree. Continuing."
  elif [ "$top" = "shared" ]; then
    echo "BLOCKED: $f. shared/ holds only the contract."; fail=1
  fi
  case "$f" in
    .env.example) ;;
    *.env|*.env.*|*secret*|*credentials*) echo "BLOCKED: $f looks like a secret."; fail=1 ;;
  esac
done

modified=$(git diff --cached --name-only --diff-filter=M | grep '^agent-log/' || true)
if [ -n "$modified" ]; then
  echo "BLOCKED: agent-log/ is append only. Add a new entry instead of editing:"
  echo "$modified"
  fail=1
fi

exit $fail
