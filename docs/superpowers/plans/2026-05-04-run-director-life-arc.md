# Run Director Life Arc Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build route-based playthrough guidance so new players get a clear Singapore property journey and returning players get replayable life arcs.

**Architecture:** Add route definitions in data, pure route derivation/scoring in `runDirector`, then wire the route through save hydration, new-game setup, dashboard coaching, portfolio context, and game-over recap. Route logic remains advisory and never bypasses purchase, eligibility, tenant, or maintenance validation.

**Tech Stack:** React 19, TypeScript, Zustand, Vite, Vitest, Playwright-backed smoke scripts.

---

## File Map

- Create `src/data/runRoutes.ts` for route metadata, labels, recommended profiles, lessons, and milestone templates.
- Create `src/engine/runDirector.ts` for route inference, phase derivation, milestone state, progress, score, and replay recommendation.
- Create `src/components/RunArcPanel.tsx` for the reusable route progress UI.
- Modify `src/game/types.ts` to add `RunRouteId` and `Player.runRouteId`.
- Modify `src/data/saveSchema.ts` to validate optional route ids.
- Modify `src/game/useGameStore.ts` to accept route selection during new game and hydrate old saves.
- Modify `src/engine/decisionCoach.ts` to include route milestone moves after urgent blockers.
- Modify `src/pages/NewGame.tsx` to add the route-selection step.
- Modify `src/pages/Dashboard.tsx`, `src/pages/Portfolio.tsx`, `src/pages/GameOver.tsx`, and `src/pages/HowToPlay.tsx` to surface the life arc.
- Modify `scripts/playtest-smoke.mjs` to verify route selection and dashboard rendering.
- Modify `README.md` and `CHANGELOG.md` for user-facing docs.

---

### Task 1: Route Types And Engine Tests

**Files:**
- Modify: `src/game/types.ts`
- Create: `src/data/runRoutes.ts`
- Create: `src/engine/runDirector.ts`
- Test: `src/engine/__tests__/runDirector.test.ts`

- [ ] **Step 1: Write failing route-director tests**

```ts
import { describe, expect, it } from 'vitest';
import { properties } from '@/data/properties';
import type { Player } from '@/game/types';
import {
  getRunArc,
  getRouteMilestones,
  inferRunRouteId,
  scoreRunRoute,
} from '../runDirector';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Tester',
    age: 30,
    careerId: 'graduate',
    salary: 5000,
    cash: 80000,
    cpfOrdinary: 50000,
    cpfSpecial: 10000,
    cpfMedisave: 8000,
    creditScore: 650,
    properties: [],
    loans: [],
    maritalStatus: 'single',
    children: 0,
    year: 2024,
    month: 1,
    turnCount: 0,
    totalNetWorth: 0,
    achievements: [],
    difficulty: 'normal',
    totalRentalIncome: 0,
    totalPropertySalesProfit: 0,
    bankruptcyStrikes: 0,
    life: {
      energy: 75,
      stress: 25,
      reputation: 50,
      careerMomentum: 50,
      householdLoad: 0,
      householdSupport: 50,
      livingArrangement: 'with-parents',
      selectedPrimaryActionId: null,
      selectedSecondaryActionId: null,
      trainingTrackId: null,
      trainingMonthsRemaining: 0,
      schemeProgress: { skillsFuture: 0, firstTimerGrant: 0, householdSupport: 0 },
      lastMonthSummary: null,
    },
    careerGrowthModifier: 1,
    careerRiskModifier: 1,
    careerVolatilityModifier: 0,
    lastCareerReviewTurn: 0,
    nextJobSwitchTurn: 24,
    firstHomePurchased: false,
    ownedPrivateHome: false,
    careerProgressionProfile: { reviewCount: 0, lastOutcome: null, lastSalaryDelta: 0, lastBonus: 0 },
    careerReviewHistory: [],
    buyerProfile: { residencyStatus: 'sc', householdProfile: 'couple-family', age: 30 },
    reserve: { targetMonths: 3, allocatedCash: 0, autoTopUpPct: 0 },
    operationHistory: [],
    ...overrides,
  };
}

describe('run director', () => {
  it('infers sensible default routes for common Singapore profiles', () => {
    expect(inferRunRouteId(makePlayer())).toBe('bto-upgrader');
    expect(inferRunRouteId(makePlayer({
      buyerProfile: { residencyStatus: 'sc', householdProfile: 'single-35-plus', age: 35 },
    }))).toBe('single-resale');
    expect(inferRunRouteId(makePlayer({
      buyerProfile: { residencyStatus: 'foreigner', householdProfile: 'foreigner-investor', age: 40 },
    }))).toBe('foreign-investor');
  });

  it('promotes landlord and commercial routes from portfolio evidence', () => {
    const commercial = properties.find((property) => property.type === 'Commercial Shop' || property.type === 'Commercial Office');
    expect(commercial).toBeDefined();

    expect(inferRunRouteId(makePlayer({
      properties: [{ propertyId: 'hdb-bto-0', purchasePrice: 420000, purchaseDate: 'Jan 2024', currentValue: 420000, isRented: true, monthlyRental: 1200, renovationLevel: 0 }],
    }))).toBe('heartland-landlord');
    expect(inferRunRouteId(makePlayer({
      properties: [{ propertyId: commercial!.id, purchasePrice: commercial!.price, purchaseDate: 'Jan 2024', currentValue: commercial!.price, isRented: false, monthlyRental: 0, renovationLevel: 0 }],
    }))).toBe('commercial-operator');
  });

  it('derives active milestones and progress for a starter route', () => {
    const arc = getRunArc(makePlayer({ cash: 30000, cpfOrdinary: 10000 }));
    const milestones = getRouteMilestones(makePlayer({ cash: 30000, cpfOrdinary: 10000 }));

    expect(arc.route.id).toBe('bto-upgrader');
    expect(arc.phase).toBe('foundation');
    expect(arc.activeMilestone).toBeDefined();
    expect(milestones.some((milestone) => milestone.status === 'active')).toBe(true);
    expect(arc.progressPct).toBeGreaterThanOrEqual(0);
    expect(arc.progressPct).toBeLessThanOrEqual(100);
  });

  it('scores route completion and recommends a different replay route', () => {
    const score = scoreRunRoute(makePlayer({
      runRouteId: 'heartland-landlord',
      properties: [{ propertyId: 'hdb-bto-0', purchasePrice: 420000, purchaseDate: 'Jan 2024', currentValue: 450000, isRented: true, monthlyRental: 1400, renovationLevel: 1, tenant: { profileId: 'local-family', rentalMode: 'room-rental', leaseStartTurn: 1, leaseEndTurn: 13, satisfaction: 82, rentStrategy: 'market', askingRent: 1400, contractedRent: 1400, defaultRiskPct: 5, renewalIntent: 80 } }],
      reserve: { targetMonths: 6, allocatedCash: 30000, autoTopUpPct: 0 },
    }));

    expect(score.completedMilestones).toBeGreaterThan(0);
    expect(score.score).toBeGreaterThan(0);
    expect(score.suggestedNextRouteId).not.toBe('heartland-landlord');
  });
});
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `npm.cmd test -- src/engine/__tests__/runDirector.test.ts`

Expected: FAIL because `src/engine/runDirector.ts` does not exist.

- [ ] **Step 3: Implement route ids, route data, and pure director functions**

Add `RunRouteId`, `RunRoutePhase`, `RouteMilestoneStatus`, `RouteMilestone`, `RunArc`, and `RunRouteScore` types to `src/game/types.ts`.

Implement `runRoutes`, `runRoutesById`, `isRunRouteId`, and route metadata in `src/data/runRoutes.ts`.

Implement `inferRunRouteId`, `getRouteForPlayer`, `getRouteMilestones`, `getRunArc`, and `scoreRunRoute` in `src/engine/runDirector.ts`.

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `npm.cmd test -- src/engine/__tests__/runDirector.test.ts`

Expected: PASS.

---

### Task 2: Save Hydration And New Game Route Selection

**Files:**
- Modify: `src/data/saveSchema.ts`
- Modify: `src/game/useGameStore.ts`
- Modify: `src/pages/NewGame.tsx`
- Test: `src/game/__tests__/useGameStore.test.ts`

- [ ] **Step 1: Write failing store tests for new route persistence**

```ts
import { describe, expect, it } from 'vitest';
import { useGameStore } from '../useGameStore';

describe('run route store wiring', () => {
  it('stores the selected route when starting a new game', () => {
    useGameStore.getState().newGame('Route Tester', 'graduate', 'normal', {
      residencyStatus: 'sc',
      householdProfile: 'couple-family',
      age: 30,
    }, 'heartland-landlord');

    expect(useGameStore.getState().player.runRouteId).toBe('heartland-landlord');
  });
});
```

- [ ] **Step 2: Run the focused store test and verify it fails**

Run: `npm.cmd test -- src/game/__tests__/useGameStore.test.ts`

Expected: FAIL because `newGame` does not accept route id yet.

- [ ] **Step 3: Wire route id through saves and New Game**

Update `newGame(name, careerId, difficulty, buyerProfile, runRouteId)` and `createInitialPlayer(...)`. Use `inferRunRouteId` when no route is provided. Add `runRouteId` to `playerSchema` with optional enum validation. Add a route step in New Game with route cards from `runRoutes`.

- [ ] **Step 4: Run focused tests**

Run: `npm.cmd test -- src/game/__tests__/useGameStore.test.ts src/engine/__tests__/runDirector.test.ts`

Expected: PASS.

---

### Task 3: Dashboard, Coach, Portfolio, And Game Over Surfaces

**Files:**
- Create: `src/components/RunArcPanel.tsx`
- Modify: `src/engine/decisionCoach.ts`
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/Portfolio.tsx`
- Modify: `src/pages/GameOver.tsx`
- Modify: `src/pages/HowToPlay.tsx`
- Test: `src/engine/__tests__/decisionCoach.test.ts`

- [ ] **Step 1: Write failing coach test**

```ts
import { describe, expect, it } from 'vitest';
import { getNextBestMoves } from '../decisionCoach';
import { createTestPlayer } from './testHelpers';

describe('route-aware decision coach', () => {
  it('adds a route milestone move when there are no critical blockers', () => {
    const moves = getNextBestMoves({
      player: createTestPlayer({ runRouteId: 'fire-homeowner', cash: 10000, properties: [] }),
    });

    expect(moves.some((move) => move.id.startsWith('route-'))).toBe(true);
  });
});
```

If no shared helper exists, build the player inline using the pattern in `runDirector.test.ts`.

- [ ] **Step 2: Run the focused coach test and verify it fails**

Run: `npm.cmd test -- src/engine/__tests__/decisionCoach.test.ts`

Expected: FAIL because route moves are not added.

- [ ] **Step 3: Implement reusable route UI and coach integration**

Create `RunArcPanel` that accepts `player`, optional `compact`, and optional `onOpenRoute`. Use `getRunArc(player)` internally. In `decisionCoach`, insert the active route milestone after scenario/repair/vacancy blockers and before generic first-home readiness.

- [ ] **Step 4: Wire route surfaces**

Render `RunArcPanel` on Dashboard near Decision Coach, on Portfolio in compact mode for operations-heavy routes, and on GameOver as route recap using `scoreRunRoute`. Add How To Play copy that explains routes guide rather than restrict.

- [ ] **Step 5: Run focused tests**

Run: `npm.cmd test -- src/engine/__tests__/decisionCoach.test.ts src/engine/__tests__/runDirector.test.ts`

Expected: PASS.

---

### Task 4: Smoke Coverage, Docs, And Verification

**Files:**
- Modify: `scripts/playtest-smoke.mjs`
- Modify: `README.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Extend smoke script route assertions**

Update the new-game flow to select a route card and assert dashboard text such as `Life Arc` and `BTO-to-Condo Upgrader`.

- [ ] **Step 2: Update docs**

Add a README section describing guided routes and add a CHANGELOG entry under Unreleased.

- [ ] **Step 3: Run automated verification**

Run:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
npm.cmd run test:smoke
npm.cmd run test:profiles
npm.cmd run test:scroll
```

Expected: all pass. Build may retain the existing non-blocking large chunk warning.

- [ ] **Step 4: Browser playthrough**

Use the in-app browser to run three playthrough lenses:

- Beginner citizen/couple BTO route: start game, verify route card, dashboard Life Arc, properties guidance, and first-home purchase clarity.
- Single 35 resale route: verify route copy and eligibility messaging are not confusing.
- Heartland landlord route: verify guidance points to reserve/tenant/repair systems after acquiring or loading an owned-property state.

- [ ] **Step 5: Commit and merge**

Commit with:

```powershell
git add src scripts README.md CHANGELOG.md docs/superpowers/plans/2026-05-04-run-director-life-arc.md
git commit -m "feat: add guided run director life arcs"
```

Merge back to main, push, and confirm:

```powershell
git checkout main
git merge --no-ff feat/run-director-life-arc
git push origin main
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
```
