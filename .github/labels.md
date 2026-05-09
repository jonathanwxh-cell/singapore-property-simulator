# Recommended Labels

GitHub labels are not stored as code by default, so this file documents the labels used by the multi-agent workflow.

## Ownership

- `agent:codex` - claimed by Codex
- `agent:claude` - claimed by Claude
- `agent:either` - unclaimed, suitable for any agent
- `human` - human-owned

## Coordination

- `hot-zone` - touches shared/high-conflict files
- `deps:locked` - touches `package.json` or `package-lock.json`
- `needs-research` - requires external/current source verification
- `needs-browser-qa` - requires rendered browser validation
- `needs-review` - ready for review but not merge
- `blocked` - waiting on decision, dependency, or conflict

## Type

- `bug`
- `enhancement`
- `documentation`
- `meta`
- `release`

## Create Missing Labels

```bash
gh label create "agent:codex" --color "1D76DB" --description "Claimed by Codex" --force
gh label create "agent:claude" --color "5319E7" --description "Claimed by Claude" --force
gh label create "agent:either" --color "C5DEF5" --description "Available to any agent" --force
gh label create "human" --color "0E8A16" --description "Human-owned task" --force
gh label create "hot-zone" --color "B60205" --description "Touches shared/high-conflict files" --force
gh label create "deps:locked" --color "D93F0B" --description "Dependency or lockfile work; one at a time" --force
gh label create "needs-research" --color "FBCA04" --description "Requires external/current source verification" --force
gh label create "needs-browser-qa" --color "F9D0C4" --description "Requires rendered browser validation" --force
gh label create "needs-review" --color "0E8A16" --description "Ready for review" --force
gh label create "blocked" --color "B60205" --description "Blocked by decision/dependency/conflict" --force
gh label create "documentation" --color "0075CA" --description "Documentation change" --force
gh label create "meta" --color "5319E7" --description "Repo process / coordination" --force
gh label create "release" --color "0052CC" --description "Release management" --force
```
