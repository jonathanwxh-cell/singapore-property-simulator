# Hybrid Life-Sim Progression Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a phase-1 Singapore life-sim layer that gives players meaningful monthly income, household, and planning choices before property ownership.

**Architecture:** Introduce a nested `player.life` state, resolve monthly life actions in a new pure engine module, thread the results through `advanceTurn`, and surface the new loop in a dedicated `Life` page plus richer dashboard and property guidance. Keep randomness and UI messaging downstream of pure selectors so the feature stays testable and deterministic.

**Tech Stack:** React 19, TypeScript, Zustand, Vitest, Vite, existing game engine/selectors architecture

---

## File Structure

- Modify: `src/game/types.ts`
  add `PlayerLifeState`, `LifeMonthSummary`, and the nested `player.life` field
- Modify: `src/data/careers.ts`
  add action-bias metadata used by the life engine
- Create: `src/data/lifeActions.ts`
  define the seven monthly actions and UI metadata
- Create: `src/engine/life.ts`
  pure helpers for defaults, normalization, monthly action resolution, and household load
- Modify: `src/engine/selectors.ts`
  add household cashflow and affordability-report selectors
- Modify: `src/engine/turn.ts`
  integrate life resolution into the monthly turn pipeline
- Modify: `src/game/useGameStore.ts`
  seed life defaults, normalize legacy saves, and expose setters for actions and living arrangement
- Modify: `src/data/saveSchema.ts`
  accept the nested life object while remaining backward-compatible
- Modify: `src/hooks/useSaveLoad.ts`
  continue loading legacy saves through the updated schema
- Create: `src/engine/__tests__/life.test.ts`
  test household load, action resolution, and secondary-action gating
- Modify: `src/engine/__tests__/selectors.test.ts`
  cover new household and affordability selectors
- Modify: `src/engine/__tests__/turn.test.ts`
  cover action resolution and clearing during turn advancement
- Modify: `src/game/__tests__/useGameStore.test.ts`
  cover life defaults, action selection, and legacy normalization behavior
- Create: `src/pages/Life.tsx`
  add the main monthly planning surface
- Modify: `src/App.tsx`
  register the new route
- Modify: `src/components/Sidebar.tsx`
  add `Life` navigation
- Modify: `src/pages/Dashboard.tsx`
  surface life-state summary, selected actions, and household cashflow
- Modify: `src/pages/PropertyDetail.tsx`
  show affordability blockers and timeline guidance

### Task 1: Model the Life State and Seed Defaults

**Files:**
- Create: `src/data/lifeActions.ts`
- Modify: `src/game/types.ts`
- Modify: `src/data/careers.ts`
- Modify: `src/game/useGameStore.ts`
- Test: `src/game/__tests__/useGameStore.test.ts`

- [ ] **Step 1: Write the failing store tests for default life state and action selection**

```ts
it('creates a new game with default life-state values', () => {
  useGameStore.getState().newGame('Avery', 'tech', 'normal');

  expect(useGameStore.getState().player.life).toMatchObject({
    energy: 70,
    stress: 20,
    reputation: 0,
    careerMomentum: 0,
    householdLoad: 650,
    householdSupport: 50,
    livingArrangement: 'with-parents',
    selectedPrimaryActionId: null,
    selectedSecondaryActionId: null,
    trainingTrackId: null,
    trainingMonthsRemaining: 0,
  });
});

it('stores monthly life actions in player state', () => {
  resetStore();

  useGameStore.getState().setPrimaryLifeAction('take-side-gig');
  useGameStore.getState().setSecondaryLifeAction('recover');

  expect(useGameStore.getState().player.life.selectedPrimaryActionId).toBe('take-side-gig');
  expect(useGameStore.getState().player.life.selectedSecondaryActionId).toBe('recover');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- src/game/__tests__/useGameStore.test.ts`
Expected: FAIL with missing `life` state and missing setter methods

- [ ] **Step 3: Write the minimal model and store scaffolding**

```ts
export interface PlayerLifeState {
  energy: number;
  stress: number;
  reputation: number;
  careerMomentum: number;
  householdLoad: number;
  householdSupport: number;
  livingArrangement: 'with-parents' | 'renting-room' | 'renting-flat';
  selectedPrimaryActionId: string | null;
  selectedSecondaryActionId: string | null;
  trainingTrackId: string | null;
  trainingMonthsRemaining: number;
  schemeProgress: {
    skillsFuture: number;
    firstTimerGrant: number;
    householdSupport: number;
  };
  lastMonthSummary: LifeMonthSummary | null;
}

export function createInitialLifeState(): PlayerLifeState {
  return {
    energy: 70,
    stress: 20,
    reputation: 0,
    careerMomentum: 0,
    householdLoad: 650,
    householdSupport: 50,
    livingArrangement: 'with-parents',
    selectedPrimaryActionId: null,
    selectedSecondaryActionId: null,
    trainingTrackId: null,
    trainingMonthsRemaining: 0,
    schemeProgress: {
      skillsFuture: 0,
      firstTimerGrant: 0,
      householdSupport: 0,
    },
    lastMonthSummary: null,
  };
}

setPrimaryLifeAction: (actionId) => {
  set(state => ({
    player: finalizePlayer({
      ...state.player,
      life: {
        ...state.player.life,
        selectedPrimaryActionId: actionId,
      },
    }),
  }));
},
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test -- src/game/__tests__/useGameStore.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/types.ts src/data/careers.ts src/data/lifeActions.ts src/game/useGameStore.ts src/game/__tests__/useGameStore.test.ts
git commit -m "feat: seed life-state defaults and action metadata"
```

### Task 2: Build the Life Engine and Affordability Selectors

**Files:**
- Create: `src/engine/life.ts`
- Modify: `src/engine/selectors.ts`
- Test: `src/engine/__tests__/life.test.ts`
- Test: `src/engine/__tests__/selectors.test.ts`

- [ ] **Step 1: Write the failing engine and selector tests**

```ts
it('returns the correct base household load for each living arrangement', () => {
  expect(getBaseHouseholdLoad('with-parents')).toBe(650);
  expect(getBaseHouseholdLoad('renting-room')).toBe(1700);
  expect(getBaseHouseholdLoad('renting-flat')).toBe(3200);
});

it('unlocks the secondary action only when energy and stress thresholds are met', () => {
  expect(canTakeSecondaryAction({ energy: 70, stress: 30 } as PlayerLifeState)).toBe(true);
  expect(canTakeSecondaryAction({ energy: 69, stress: 30 } as PlayerLifeState)).toBe(false);
  expect(canTakeSecondaryAction({ energy: 70, stress: 31 } as PlayerLifeState)).toBe(false);
});

it('estimates months to afford from monthly surplus', () => {
  const player = makePlayer({ cash: 50_000, life: makeLifeState() });
  const report = selectAffordabilityReport(player, 81_900, 6_000);

  expect(report.shortfall).toBe(31_900);
  expect(report.monthsAtCurrentPace).toBe(6);
  expect(report.blockers).toContain('cash');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- src/engine/__tests__/life.test.ts src/engine/__tests__/selectors.test.ts`
Expected: FAIL with missing `life.ts` exports and missing affordability selector

- [ ] **Step 3: Write the minimal life engine and selector helpers**

```ts
export function getBaseHouseholdLoad(arrangement: PlayerLifeState['livingArrangement']): number {
  switch (arrangement) {
    case 'renting-room':
      return 1700;
    case 'renting-flat':
      return 3200;
    default:
      return 650;
  }
}

export function canTakeSecondaryAction(life: PlayerLifeState): boolean {
  return life.energy >= 70 && life.stress <= 30;
}

export function selectAffordabilityReport(
  player: Player,
  totalUpfront: number,
  monthlySurplus: number,
): AffordabilityReport {
  const shortfall = Math.max(0, totalUpfront - player.cash);
  return {
    shortfall,
    blockers: shortfall > 0 ? ['cash'] : [],
    monthsAtCurrentPace: shortfall === 0 ? 0 : monthlySurplus > 0 ? Math.ceil(shortfall / monthlySurplus) : null,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test -- src/engine/__tests__/life.test.ts src/engine/__tests__/selectors.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/life.ts src/engine/selectors.ts src/engine/__tests__/life.test.ts src/engine/__tests__/selectors.test.ts
git commit -m "feat: add life engine helpers and affordability selectors"
```

### Task 3: Integrate Life Resolution into Turn Flow and Save Compatibility

**Files:**
- Modify: `src/engine/turn.ts`
- Modify: `src/game/useGameStore.ts`
- Modify: `src/data/saveSchema.ts`
- Modify: `src/hooks/useSaveLoad.ts`
- Modify: `src/engine/__tests__/turn.test.ts`
- Modify: `src/game/__tests__/useGameStore.test.ts`

- [ ] **Step 1: Write the failing integration tests**

```ts
it('resolves the selected primary action and clears it after advancing a turn', () => {
  const result = advanceTurn({
    player: makePlayer({
      life: makeLifeState({
        selectedPrimaryActionId: 'take-side-gig',
        selectedSecondaryActionId: 'recover',
      }),
    }),
    market: baseMarket,
    settings: baseSettings,
    rng: createRng(42),
  });

  expect(result.player.life.lastMonthSummary?.primaryActionId).toBe('take-side-gig');
  expect(result.player.life.selectedPrimaryActionId).toBe(null);
  expect(result.player.life.selectedSecondaryActionId).toBe(null);
});

it('normalizes legacy save data that has no life state', () => {
  resetStore({
    player: makePlayer() as Player,
  });

  useGameStore.getState().loadGame(makeState({
    player: { ...makePlayer(), life: undefined as never },
  }));

  expect(useGameStore.getState().player.life.livingArrangement).toBe('with-parents');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- src/engine/__tests__/turn.test.ts src/game/__tests__/useGameStore.test.ts`
Expected: FAIL because turns do not resolve life actions and legacy save normalization is missing

- [ ] **Step 3: Write the minimal turn and save integration**

```ts
const lifeResolution = resolveLifeMonth(player, career, rng);
const monthlySurplusBeforeLife = takeHomePay + rentalIncome - totalLoanPayment - totalOwnershipCosts - lifeResolution.householdCost;
const newCash = player.cash + monthlySurplusBeforeLife + lifeResolution.cashDelta;

const newPlayer: Player = {
  ...player,
  cash: newCash,
  life: lifeResolution.nextLife,
  // existing fields...
};

const playerSchema = z.object({
  // existing fields...
  life: z.object({
    energy: z.number(),
    stress: z.number(),
    reputation: z.number(),
    careerMomentum: z.number(),
    householdLoad: z.number(),
    householdSupport: z.number(),
    livingArrangement: z.enum(['with-parents', 'renting-room', 'renting-flat']),
    selectedPrimaryActionId: z.string().nullable(),
    selectedSecondaryActionId: z.string().nullable(),
    trainingTrackId: z.string().nullable(),
    trainingMonthsRemaining: z.number(),
    schemeProgress: z.object({
      skillsFuture: z.number(),
      firstTimerGrant: z.number(),
      householdSupport: z.number(),
    }),
    lastMonthSummary: z.any().nullable(),
  }).optional(),
});
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test -- src/engine/__tests__/turn.test.ts src/game/__tests__/useGameStore.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/turn.ts src/game/useGameStore.ts src/data/saveSchema.ts src/hooks/useSaveLoad.ts src/engine/__tests__/turn.test.ts src/game/__tests__/useGameStore.test.ts
git commit -m "feat: integrate life actions into turns and save loading"
```

### Task 4: Ship the New Life UI and Property Guidance

**Files:**
- Create: `src/pages/Life.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/PropertyDetail.tsx`
- Test: `src/engine/__tests__/selectors.test.ts`

- [ ] **Step 1: Write the failing selector tests for dashboard and property guidance**

```ts
it('includes household load in monthly net cashflow', () => {
  const player = makePlayer({
    salary: 5_000,
    life: makeLifeState({ householdLoad: 650 }),
  });

  expect(selectMonthlyNetCashflow(player, TAKE_HOME_RATIO)).toBe(3350);
});

it('returns null months-to-buy when monthly surplus is non-positive', () => {
  const player = makePlayer({
    cash: 50_000,
    life: makeLifeState({ householdLoad: 4_500 }),
  });

  const report = selectAffordabilityReport(player, 81_900, selectMonthlyNetCashflow(player, TAKE_HOME_RATIO));
  expect(report.monthsAtCurrentPace).toBe(null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- src/engine/__tests__/selectors.test.ts`
Expected: FAIL because the current cashflow selector ignores household load

- [ ] **Step 3: Implement the UI wiring**

```tsx
const Life = lazy(() => import('@/pages/Life'));

<Route path="/life" element={<Life />} />

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { label: 'Life', path: '/life', icon: BriefcaseBusiness },
  { label: 'Properties', path: '/properties', icon: Building2 },
];

const affordability = selectPropertyAffordabilityReport(player, property);

<GlassCard accentColor="#00F0FF">
  <h3 className="section-title text-white mb-4">Life Planning</h3>
  <p className="text-text-secondary text-sm">
    Primary action: {selectedPrimaryAction?.label ?? 'Focus at Work'}
  </p>
</GlassCard>

<p className="text-text-secondary text-xs">
  {affordability.monthsAtCurrentPace === null
    ? 'Current monthly surplus is too tight to project a purchase timeline.'
    : `At your current pace, this looks about ${affordability.monthsAtCurrentPace} months away.`}
</p>
```

- [ ] **Step 4: Run verification to confirm tests, lint, and build stay green**

Run: `npm.cmd test`
Expected: PASS

Run: `npm.cmd run lint`
Expected: PASS

Run: `npm.cmd run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/Life.tsx src/App.tsx src/components/Sidebar.tsx src/pages/Dashboard.tsx src/pages/PropertyDetail.tsx src/engine/__tests__/selectors.test.ts
git commit -m "feat: ship life planning surfaces and affordability guidance"
```

## Self-Review

- Spec coverage:
  - life-state model: Task 1
  - action resolution and household costs: Task 2
  - turn integration and save compatibility: Task 3
  - life page, dashboard, sidebar, and property guidance: Task 4
- Placeholder scan:
  - no `TODO`, `TBD`, or cross-task "same as above" references remain
- Type consistency:
  - `selectedPrimaryActionId`, `selectedSecondaryActionId`, `lastMonthSummary`, and `householdLoad` are used consistently across tasks

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-02-hybrid-life-sim-progression.md`.

Two execution options:

1. Subagent-Driven (recommended) - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. Inline Execution - Execute tasks in this session using executing-plans, batch execution with checkpoints

This branch should use option `2` because the user asked me to proceed autonomously in-session.
