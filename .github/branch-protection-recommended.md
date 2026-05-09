# Branch Protection And Rulesets

GitHub branch protection and rulesets cannot be fully enabled from a normal code PR. They must be applied in **Settings -> Branches** or **Settings -> Rules -> Rulesets**, or by a repository admin using the GitHub API. This file documents the intended enforcement so any human or agent can re-apply it.

## Recommended `main` Gate

Apply to branch pattern `main`:

- Require a pull request before merging.
- Require status checks to pass before merging.
- Require branches to be up to date before merging.
- Required checks:
  - `build`
  - `smoke`
- Require conversation resolution before merging.
- Dismiss stale PR approvals when new commits are pushed.
- Require linear history if you want squash/rebase-only history.
- Do not allow force pushes.
- Do not allow deletions.

When a trusted human reviewer or bot account exists, also require CODEOWNERS review. Until then, CODEOWNERS still documents ownership and can request review automatically.

## Prefer Rulesets When Available

GitHub rulesets are easier to reason about for multi-agent work because multiple rulesets can apply at the same time and contributors can see active rules without admin access. Use a ruleset for:

- `main` protection.
- optional branch naming policy (`codex/*`, `claude/*`, `human/*`, `dependabot/*`, `chore/*`).
- optional tag protection for release tags such as `v*`.

## Apply Via GitHub UI

Settings -> Branches -> Branch protection rules -> Add rule:

1. Branch name pattern: `main`
2. Enable `Require a pull request before merging`.
3. Enable `Require status checks to pass before merging`.
4. Enable `Require branches to be up to date before merging`.
5. Select required checks: `build`, `smoke`.
6. Enable `Require conversation resolution before merging`.
7. Disable force pushes and deletions.

## Apply Via `gh` CLI

```bash
gh api -X PUT "repos/jonathanwxh-cell/singapore-property-simulator/branches/main/protection" \
  --input - <<'EOF'
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["build", "smoke"]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": {
    "required_approving_review_count": 0,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false,
  "required_conversation_resolution": true
}
EOF
```

> `required_approving_review_count: 0` keeps solo-agent workflows unblocked while still requiring PR + green CI. Increase to `1` and set `require_code_owner_reviews: true` once a reviewer/bot owner can approve.

## What This Enforces

- Agents cannot push directly to `main`.
- Red CI cannot merge.
- A stale branch must rebase or update before merge.
- Unresolved review threads block merge.
- Force pushes to `main` are blocked.
- History of `main` remains auditable.
