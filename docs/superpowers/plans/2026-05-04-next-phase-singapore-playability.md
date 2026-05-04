# Next Phase Singapore Playability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the highest-impact next-phase slice from the Singaporean-lens review: buyer profiles, first-home missions, clearer HDB rental legality, and a rules glossary.

**Architecture:** Keep rule logic in engine/data modules and keep pages as display surfaces. Existing saves hydrate through defaults, so new profile fields remain optional in the schema and normalized in the store.

**Tech Stack:** React 19, TypeScript, Zustand, Vite, Vitest, Playwright smoke tests.

---

### Task 1: Buyer Profile And Rules

**Files:**
- Modify: `src/game/types.ts`
- Modify: `src/game/useGameStore.ts`
- Modify: `src/data/saveSchema.ts`
- Modify: `src/engine/stampDuty.ts`
- Modify: `src/engine/purchase.ts`
- Modify: `src/engine/eligibility.ts`
- Test: `src/engine/__tests__/eligibility.test.ts`
- Test: `src/engine/__tests__/actions.test.ts`

- [x] Write failing tests for SPR ABSD through purchase validation and foreigner/HDB buyer-profile blockers.
- [x] Add buyer profile types and defaults.
- [x] Hydrate old saves with the default Singapore citizen family profile.
- [x] Thread buyer profile into ABSD and property eligibility.
- [x] Update New Game to collect the profile.

### Task 2: First-Home Mission Rail

**Files:**
- Create: `src/engine/firstHomeMissions.ts`
- Test: `src/engine/__tests__/firstHomeMissions.test.ts`
- Modify: `src/pages/Dashboard.tsx`

- [x] Write failing tests for initial, purchase-ready, and post-purchase mission states.
- [x] Implement mission derivation from player state.
- [x] Render a dashboard mission rail with next action routing.

### Task 3: HDB Owner-Occupancy Clarity

**Files:**
- Modify: `src/game/types.ts`
- Modify: `src/data/saveSchema.ts`
- Modify: `src/engine/actions.ts`
- Modify: `src/engine/propertyOperations.ts`
- Modify: `src/pages/PropertyDetail.tsx`
- Test: `src/engine/__tests__/propertyOperations.test.ts`

- [x] Write failing tests that room rental remains owner-occupied during MOP and whole-flat rental unlocks after MOP.
- [x] Add an `owner-occupied` occupancy state.
- [x] Update rental status copy and tenant-plan labels.

### Task 4: Rules Glossary

**Files:**
- Create: `src/data/ruleGlossary.ts`
- Create: `src/components/RuleGlossaryPanel.tsx`
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/PropertyDetail.tsx`

- [x] Add concise glossary entries for ABSD, BSD, CPF OA, MSR, TDSR, MOP, EC ceiling, and reserve cash.
- [x] Render glossary panels in dashboard and property detail without blocking core actions.

### Task 5: Verification And Merge

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `README.md`

- [x] Run `npm.cmd test`.
- [x] Run `npm.cmd run lint`.
- [x] Run `npm.cmd run build`.
- [x] Run `npm.cmd run test:smoke`.
- [x] Run a focused Playwright profile pass for SC, SPR, and foreigner profiles.
- [ ] Merge branch to `main`, push, and confirm `main` equals `origin/main`.
