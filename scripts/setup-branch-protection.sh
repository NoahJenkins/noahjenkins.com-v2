#!/bin/bash
# Setup branch protection rules for CI/CD workflow

SCRIPT_DIR="$(dirname "$0")"
CONFIG_FILE="$SCRIPT_DIR/branch-protection.json"

echo "Setting up branch protection rules for main branch..."

# Check if config file exists
if [ ! -f "$CONFIG_FILE" ]; then
  echo "❌ Error: branch-protection.json not found at $CONFIG_FILE"
  exit 1
fi

# Apply branch protection using JSON config file
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --input "$CONFIG_FILE"

echo "✅ Branch protection rules configured successfully!"
echo ""
echo "Rules applied from $CONFIG_FILE:"
echo "- Require pull request reviews (1 reviewer)"
echo "- Require status checks: jest-tests, playwright-tests, lint-and-typecheck, build-check"
echo "- Require branches to be up to date before merging"
echo "- Dismiss stale reviews when new commits are pushed"
echo "- Prevent force pushes and branch deletion"
echo "- Apply rules to administrators"