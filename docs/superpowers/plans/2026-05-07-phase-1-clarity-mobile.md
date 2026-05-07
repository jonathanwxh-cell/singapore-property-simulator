# Phase 1 Clarity And Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the first 10 minutes easier to understand by sharpening guided entry points, clarifying spendable versus reserved resources, adding page-level beginner guidance, and reducing mobile action friction.

**Architecture:** Reuse the existing guided-mode, glossary, command-center, and practice-purchase systems instead of inventing a second tutorial layer. Add a small reusable guidance surface plus targeted wording and layout improvements in the highest-friction screens: Title/New Game, Dashboard, Buy, Own, and the mobile shell.

**Tech Stack:** React 19, Vite, TypeScript, Zustand, Vitest, Playwright smoke scripts.

---

### Task 1: Shared Guidance Surface

**Files:**
- Create: `src/components/GuidedFocusPanel.tsx`
- Modify: `src/components/GlossaryTerm.tsx`

- [ ] **Step 1: Add a reusable guided focus panel**

Create a small card component with:
- eyebrow
- title
- one-sentence summary
- up to three checklist bullets
- optional glossary chips
- optional primary and secondary actions

Use it for page-level "read this page in order" guidance without duplicating card styling across screens.

- [ ] **Step 2: Improve glossary accessibility on mobile**

Update `GlossaryTerm` so the tooltip remains readable on small screens, stays anchored within the viewport, and uses slightly stronger close affordance and spacing.

- [ ] **Step 3: Verify shared surface compiles**

Run: `npm.cmd test -- src/data/__tests__/ruleGlossary.test.ts`

Expected: existing glossary tests still pass.

### Task 2: Guided Entry And Dashboard Clarity

**Files:**
- Modify: `src/pages/TitleScreen.tsx`
- Modify: `src/pages/NewGame.tsx`
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/dashboard/panels/BeginnerPrimerPanel.tsx`
- Modify: `src/components/CommandCenterHero.tsx`
- Modify: `src/engine/__tests__/commandCenter.test.ts`

- [ ] **Step 1: Make the start experience explain itself faster**

Refine Title Screen and New Game copy so a casual player immediately understands:
- this is a Singapore property sim with built-in guidance
- the recommended first run
- that property jargon will be explained in play

Keep the current guided-run shortcut, but make the beginner route feel more intentional than generic.

- [ ] **Step 2: Add a clearer "read this page first" primer on Dashboard**

Update the beginner primer so it explains the dashboard flow in plain order:
1. read the objective
2. choose the month plan
3. use Buy/Life/Own only when needed

Also call out the difference between spendable cash and reserved cash.

- [ ] **Step 3: Make command-center vitals read more plainly**

Tune `CommandCenterHero` wording so the vital strip and advance guidance are more obvious, especially for early turns.

- [ ] **Step 4: Add a narrow regression test for command-center wording**

Extend `commandCenter.test.ts` to assert that the vital metric ids and the starter objective still stay stable after the copy-oriented refactor.

### Task 3: Buy / Own / Deal Clarity

**Files:**
- Modify: `src/pages/Properties.tsx`
- Modify: `src/pages/Portfolio.tsx`
- Modify: `src/components/PropertyDetail/PurchasePanel.tsx`
- Modify: `src/components/PropertyDetail/PropertySummary.tsx`
- Modify: `src/pages/property/__tests__/purchaseReadiness.test.ts`

- [ ] **Step 1: Add beginner reading guidance to Buy and Own**

Use `GuidedFocusPanel` on:
- `Properties.tsx` to explain how to read a listing: price, cash needed, worst case
- `Portfolio.tsx` to explain how to read an owned holding: status, rent, repairs, reserve

Show these only when guided mode is on or the run is still early.

- [ ] **Step 2: Make reserve and spendable cash more explicit on deal pages**

In `PurchasePanel`, reword the cash section so the player can distinguish:
- wallet cash
- reserved cash
- spendable now
- cash required after CPF

The rules should stay the same; the presentation should stop feeling ambiguous.

- [ ] **Step 3: Surface live tenant / rent state more clearly**

In `PropertySummary` and `Portfolio`, tighten tenant wording so players can tell at a glance whether a property is owner-occupied, room-rented, whole-unit leased, vacant, or blocked by MOP.

- [ ] **Step 4: Keep purchase readiness tests green**

Run: `npm.cmd test -- src/pages/property/__tests__/purchaseReadiness.test.ts`

Expected: purchase-readiness behavior stays unchanged after copy and presentation updates.

### Task 4: Mobile Shell And CTA Friction

**Files:**
- Modify: `src/components/GameLayout.tsx`
- Modify: `src/components/NextMonthCTA.tsx`
- Modify: `scripts/playtest-smoke.mjs`
- Modify: `scripts/playtest-scroll-reset.mjs`

- [ ] **Step 1: Make bottom navigation safer and easier to tap**

Adjust mobile shell spacing so the main content, bottom nav, and floating panels account for `env(safe-area-inset-bottom)` and larger touch comfort.

- [ ] **Step 2: Reposition floating advance CTA**

Update `NextMonthCTA` floating positioning so it clears the bottom nav and sits higher on small screens without crowding content.

- [ ] **Step 3: Expand smoke coverage for mobile layout**

Keep or extend existing Playwright checks for:
- no CTA overlap with bottom nav
- no stat overlap on mobile
- route navigation scroll reset

- [ ] **Step 4: Run targeted verification**

Run:
- `npm.cmd run test:scroll`
- `npm.cmd run test:smoke`

Expected: both pass with the updated layout.

### Task 5: Full Verification And Commit

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Update changelog**

Add a concise unreleased note for the clarity/mobile pass.

- [ ] **Step 2: Run full verification**

Run:
- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd test`
- `npm.cmd run test:scroll`
- `npm.cmd run test:smoke`

- [ ] **Step 3: Browser playtest**

Manual checks:
- fresh guided run
- dashboard first read
- buy-page guidance
- property-detail purchase clarity
- portfolio tenant visibility
- mobile layout behavior on a narrow viewport

- [ ] **Step 4: Commit**

Commit message: `feat: improve beginner clarity and mobile ux`
