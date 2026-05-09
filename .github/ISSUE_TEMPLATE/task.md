---
name: Agent task
about: A scoped unit of work for Codex, Claude, another agent, or a human
title: ''
labels: ''
assignees: ''
---

## Goal
<!-- What outcome does this task produce? One or two sentences. -->

## Owner / Claim
<!-- Apply exactly one label when claimed: agent:codex, agent:claude, agent:either, or human. -->
- Claimed by:
- Branch:
- Worktree:

## Scope
<!-- Be specific so two agents do not double-claim the same files. -->
- Expected files/modules:
  - `src/...`
- Hot zones touched:
  - [ ] `package-lock.json`
  - [ ] `CHANGELOG.md`
  - [ ] `src/data/saveSchema.ts`
  - [ ] `src/game/types.ts`
  - [ ] `src/engine/constants.ts`
  - [ ] `.github/**` / `AGENTS.md`

## Research
<!-- Required for current facts, external APIs, security, finance rules, Singapore policy, or platform behavior. -->
- Required: yes / no
- Primary sources to check:
- Last checked:
- Exact vs simplified/game-balanced:

## Acceptance Criteria
- [ ] Implementation or docs change is complete.
- [ ] `npm test` passes (vitest), unless docs-only and not needed.
- [ ] `npm run lint` clean, unless docs-only and not needed.
- [ ] `npm run build` clean, unless docs-only and not needed.
- [ ] Relevant smoke test exercised (`npm run test:smoke` / `test:profiles` / `test:scroll`) when gameplay/UI changed.
- [ ] Browser route(s) tested when UI changed.
- [ ] CHANGELOG `[Unreleased]` updated if user-visible.
- [ ] PR links this issue with `Closes #`.

## Out Of Scope
<!-- Things deliberately left for a follow-up. Prevents scope creep. -->

## Handoff Notes
<!-- Fill this if pausing or transferring work. -->
- Current branch:
- Dirty files:
- Tests last run:
- Next step:
