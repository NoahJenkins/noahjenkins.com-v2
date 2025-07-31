#!/bin/bash
# Setup branch protection rules for CI/CD workflow

echo "Setting up branch protection rules for main branch..."

# Enable branch protection with required status checks
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["jest-tests","playwright-tests"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews='{"required_approving_review_count":1,"dismiss_stale_reviews":true,"require_code_owner_reviews":false,"require_last_push_approval":false}' \
  --field restrictions=null \
  --field allow_force_pushes=false \
  --field allow_deletions=false

echo "✅ Branch protection rules configured successfully!"
echo ""
echo "Rules applied:"
echo "- Require pull request reviews (1 reviewer)"
echo "- Require status checks: jest-tests, playwright-tests"
echo "- Require branches to be up to date before merging"
echo "- Dismiss stale reviews when new commits are pushed"
echo "- Prevent force pushes and branch deletion"
echo "- Apply rules to administrators"