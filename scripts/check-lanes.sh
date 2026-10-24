#!/usr/bin/env bash
# Pre-commit lane check. Blocks files that land outside their folder.
# Install once: bash scripts/install-hooks.sh

set -e
fail=0
files=$(git diff --cached --name-only --diff-filter=ACMR)

for f in $files; do
  top="${f%%/*}"
  case "$f" in
    README.md|CONTRIBUTING.md|CLAUDE.md|AGENTS.md|.gitignore|LICENSE|package.json|package-lock.json) continue ;;
  esac
  case "$top" in
    site|worker|shared|seed|docs|agent-log|scripts|.github) ;;
    *)
      echo "BLOCKED: $f is outside every lane. Read CONTRIBUTING.md and pick a folder."
      fail=1
      continue ;;
  esac
  case "$f" in
    site/*.js|site/*.html|site/*.css|site/*.svg|site/*.png|site/*.jpg|site/*.webp|site/*.ico|site/*.json|site/*.woff2|site/*.txt) ;;
    site/*) echo "BLOCKED: $f. site/ holds static assets only (html, css, js, images, fonts)."; fail=1 ;;
  esac
  case "$f" in
    seed/*.json) ;;
    seed/*) echo "BLOCKED: $f. seed/ holds JSON products only."; fail=1 ;;
  esac
  case "$f" in
    shared/profile.schema.json) echo "NOTICE: you are changing the Product Profile contract. All three of us must agree. Continuing." ;;
    shared/*) echo "BLOCKED: $f. shared/ holds only profile.schema.json."; fail=1 ;;
  esac
  case "$f" in
    *.env|*.env.*|*secret*|*credentials*) echo "BLOCKED: $f looks like a secret. Use wrangler secret put."; fail=1 ;;
  esac
done

# agent-log is append only: modifications to existing entries are blocked
modified=$(git diff --cached --name-only --diff-filter=M | grep '^agent-log/' || true)
if [ -n "$modified" ]; then
  echo "BLOCKED: agent-log/ is append only. Add a new entry instead of editing:"
  echo "$modified"
  fail=1
fi

exit $fail
