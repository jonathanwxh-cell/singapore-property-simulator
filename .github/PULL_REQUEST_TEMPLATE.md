## Summary
<!-- 1-3 bullets on what changes and why -->

## Linked issue
<!-- e.g. Closes #12 -->

## Agent
<!-- Which agent authored the bulk of this PR? Helps with attribution and coordination per AGENTS.md. -->
- [ ] `agent:claude`
- [ ] `agent:codex`
- [ ] human

## Scope confirmation
<!-- Per AGENTS.md, the agent that opens a PR owns its files until merge. -->
- [ ] No open PR is currently touching the same files (checked `gh pr list`)
- [ ] If this PR modifies `package-lock.json`, the `deps:locked` label is applied and no other lockfile-touching PR is open

## Test plan
- [ ] `npm test` passes (vitest)
- [ ] `npm run lint` clean
- [ ] `npm run build` clean
- [ ] If gameplay changed: at least one of `npm run test:smoke`, `npm run test:profiles`, `npm run test:scroll` exercised
- [ ] Manual smoke test (start a game, buy a property, advance a turn) where applicable

## Changelog
<!-- Add an entry under [Unreleased] in CHANGELOG.md if user-visible. Refactors and test-only changes can skip. -->
