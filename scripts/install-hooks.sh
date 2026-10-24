#!/usr/bin/env bash
# Run once after cloning.
cd "$(git rev-parse --show-toplevel)"
cp scripts/check-lanes.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit scripts/*.sh
echo "Lane check installed. Commits outside their folder will be blocked."
