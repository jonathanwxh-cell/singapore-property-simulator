## Summary
<!-- 1-3 bullets on what changed and why. -->

## Linked Issue
<!-- Use a closing keyword, e.g. Closes #12. -->

## Agent / Author
<!-- Mark the main author. Helps coordination per AGENTS.md. -->
- [ ] `agent:claude`
- [ ] `agent:codex`
- [ ] human

## Coordination
<!-- The PR owner owns touched files until merge. -->
- [ ] I checked open PRs for file overlap: `gh pr list --state open --json number,title,headRefName,files`
- [ ] I declared/confirmed scope in the linked issue.
- [ ] No other open PR currently owns these files, or coordination is documented in comments.
- [ ] If this PR modifies `package-lock.json`, the `deps:locked` label is applied and no other lockfile PR is open.

## Research
<!-- Required for current facts, external APIs, security, finance rules, Singapore policy, or platform behavior. -->
- Required: yes / no
- Sources:
- Last checked:
- Simplification or game-balance notes:

## Test Plan
- [ ] `npm test` passes (vitest)
- [ ] `npm run lint` clean
- [ ] `npm run build` clean
- [ ] If gameplay changed: at least one of `npm run test:smoke`, `npm run test:profiles`, `npm run test:scroll` exercised
- [ ] If UI changed: browser route(s) tested and listed below
- [ ] If UI routes or labels changed: compact `/`, `/new`, `/play`, `/end` smoke scripts were updated; no stale `/dashboard`-style selectors remain

Browser routes tested:
-

## Changelog
<!-- Add an entry under [Unreleased] in CHANGELOG.md if user-visible. Refactors and test-only changes can skip. -->
- [ ] CHANGELOG updated
- [ ] Not user-visible / not needed

## Handoff / Follow-ups
<!-- Anything the next agent or reviewer should know. -->
- Follow-up issues:
- Known risks:
- Cleanup needed after merge:
