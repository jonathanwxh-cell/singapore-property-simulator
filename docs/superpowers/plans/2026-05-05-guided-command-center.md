# Guided Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the simulator easier to understand on first read by adding a command-center objective, persistent Next Month CTA, grouped navigation, and collapsed advanced detail without removing existing systems.

**Architecture:** Add a small `commandCenter` engine helper that converts the existing player/scenario state into objective, advance, and vital metric view models. Reuse that helper from shared React components so Dashboard, Sidebar, and mobile shell all speak the same guidance language.

**Tech Stack:** React 19, Vite, TypeScript, Vitest, Playwright smoke scripts, Zustand store.

---

### Task 1: Command-Center State

**Files:**
- Create: `src/engine/commandCenter.ts`
- Create: `src/engine/__tests__/commandCenter.test.ts`

- [ ] **Step 1: Write failing tests**

Cover these behaviors:
- Active scenario returns `Resolve First`, route `/scenarios`, and critical objective.
- Default new-player state returns `Next Month` plus a first-home/buying objective.
- Urgent maintenance outranks route-milestone guidance.
- Vital metrics include available cash, monthly surplus, and readiness.

- [ ] **Step 2: Run targeted test to verify RED**

Run: `npm.cmd test -- src/engine/__tests__/commandCenter.test.ts`

Expected: fail because `src/engine/commandCenter.ts` does not exist.

- [ ] **Step 3: Implement minimal helper**

Create `getCommandCenterState(player, currentScenario)` with `CommandCenterObjective`, `AdvanceMonthState`, and `VitalMetric` return types. Use existing `getNextBestMoves`, selectors, and scenario data.

- [ ] **Step 4: Run targeted test to verify GREEN**

Run: `npm.cmd test -- src/engine/__tests__/commandCenter.test.ts`

Expected: pass.

### Task 2: Shared UX Components

**Files:**
- Create: `src/components/NextMonthCTA.tsx`
- Create: `src/components/ProgressivePanel.tsx`
- Create: `src/components/CommandCenterHero.tsx`
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/components/GameLayout.tsx`

- [ ] **Step 1: Add CTA component**

`NextMonthCTA` reads store state, calls `getCommandCenterState`, routes to blockers when needed, and calls `nextTurn()` when ready.

- [ ] **Step 2: Add progressive disclosure components**

`ProgressivePanel` wraps lower-priority detail behind an accessible expand/collapse button. `CommandCenterHero` renders the objective, direct actions, and three vital metrics.

- [ ] **Step 3: Wire persistent shell CTA**

Desktop sidebar shows `Next Month` near the bottom. Mobile layout shows a floating thumb-friendly CTA above the bottom nav.

- [ ] **Step 4: Group navigation labels**

Update nav vocabulary to `Home`, `Life`, `Buy`, `Learn`, `Own`, with contextual routes preserved.

### Task 3: Dashboard First-Read Hierarchy

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Lead with `This Month`**

Render `CommandCenterHero` before stats. Keep old systems reachable below.

- [ ] **Step 2: Collapse advanced detail**

Wrap market pulse, life arc, decision coach, first-home rail, rules, cashflow, mini portfolio, and life planning in `ProgressivePanel` sections. Keep urgent property operations expanded when attention is needed.

- [ ] **Step 3: Remove duplicate old next-turn card**

The persistent `NextMonthCTA` and hero CTA become the canonical advance controls.

### Task 4: Buy / Own / Life Simplification

**Files:**
- Modify: `src/pages/Properties.tsx`
- Modify: `src/pages/Portfolio.tsx`
- Modify: `src/pages/Life.tsx`

- [ ] **Step 1: Properties**

Lead with `Best next buy for you`, add preset chips (`Starter-safe`, `High yield`, `Upgrade path`, `Advanced`), and hide detailed filters behind `More filters`.

- [ ] **Step 2: Portfolio**

Lead with `Portfolio Health`, group holdings with attention-first copy, and move achievements behind an expandable panel.

- [ ] **Step 3: Life**

Lead with `Plan This Month`, keep only energy/stress/monthly surplus as primary metrics, and collapse secondary action plus helper panels.

### Task 5: Verification And Playtest

**Files:**
- Modify: `scripts/playtest-smoke.mjs`
- Modify: `scripts/playtest-scroll-reset.mjs`
- Modify: `scripts/playtest-profiles.mjs`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Update smoke expectations**

Smoke should look for `This Month`, `Next Month`, grouped nav labels, and preserved deep systems.

- [ ] **Step 2: Run verification**

Run:
- `npm.cmd test`
- `npm.cmd run lint`
- `npm.cmd run build`
- `npm.cmd run test:profiles`
- `npm.cmd run test:scroll`
- `npm.cmd run test:smoke`

- [ ] **Step 3: Browser playtest**

Use the in-app browser to start a fresh run, confirm the next action is visible without scrolling, advance one month from the shell CTA, verify blocked scenario routing, and inspect Properties/Portfolio/Life for reduced overwhelm.

- [ ] **Step 4: Commit**

Commit message: `feat: add guided command center ux`
