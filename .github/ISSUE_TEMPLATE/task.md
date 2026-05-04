---
name: Task
about: A unit of work for a coding agent (or a human) to pick up
title: ''
labels: ''
assignees: ''
---

## Goal
<!-- What outcome does this task produce? One or two sentences. -->

## Scope
<!-- Files / modules expected to change. Be specific so two agents don't double-claim. -->
- `src/...`

## Acceptance criteria
- [ ] ...
- [ ] `npm test` passes (vitest)
- [ ] `npm run lint` clean
- [ ] `npm run build` clean
- [ ] Relevant smoke test exercised (`npm run test:smoke` / `test:profiles` / `test:scroll`)
- [ ] CHANGELOG `[Unreleased]` updated if user-visible

## Out of scope
<!-- Things deliberately left for a follow-up. Prevents scope creep. -->

## Claim
<!-- Whichever agent picks this up: apply 'agent:claude' or 'agent:codex' label, then start. -->
