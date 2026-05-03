# Career & Eligibility Lite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add single-run career progression and simplified housing eligibility so players feel a visible climb from first-timer to upgrader without adding heavy family or legal complexity.

**Architecture:** Extend the pure engine and persisted player state with lightweight progression fields, then surface those derived states through the scenario flow, property browsing UI, and annual recap surfaces. Reuse the existing seeded turn system and scenario modal system so the feature feels native to the current build rather than bolted on.

**Tech Stack:** React 19, TypeScript, Zustand, Vite, Vitest, Playwright smoke script, static assets from `public/`

---

## File Map

- Create: `src/engine/careerProgression.ts`
- Create: `src/engine/eligibility.ts`
- Create: `src/engine/__tests__/careerProgression.test.ts`
- Create: `src/engine/__tests__/eligibility.test.ts`
- Create: `src/components/EligibilityBadge.tsx`
- Copy/Create: `public/career-review-key-art.png`
- Modify: `src/game/types.ts`
- Modify: `src/game/useGameStore.ts`
- Modify: `src/data/saveSchema.ts`
- Modify: `src/data/properties.ts`
- Modify: `src/data/scenarios.ts`
- Modify: `src/engine/turn.ts`
- Modify: `src/engine/__tests__/turn.test.ts`
- Modify: `src/engine/__tests__/actions.test.ts`
- Modify: `src/game/__tests__/useGameStore.test.ts`
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/Scenarios.tsx`
- Modify: `src/pages/Properties.tsx`
- Modify: `src/pages/PropertyDetail.tsx`
- Modify: `src/pages/GameOver.tsx`
- Modify: `scripts/playtest-smoke.mjs`
- Modify: `CHANGELOG.md`

### Task 1: Add Progression State and Save Hydration

**Files:**
- Create: `src/engine/__tests__/eligibility.test.ts`
- Modify: `src/game/types.ts`
- Modify: `src/game/useGameStore.ts`
- Modify: `src/data/saveSchema.ts`
- Modify: `src/game/__tests__/useGameStore.test.ts`

- [ ] **Step 1: Write the failing state-shape and hydration tests**

```ts
import { describe, expect, it } from 'vitest';
import { useGameStore } from '@/game/useGameStore';
import { deriveEligibilityFlags } from '@/engine/eligibility';

describe('career progression state', () => {
  it('initializes progression defaults for a new game', () => {
    useGameStore.getState().newGame('Plan Test', 'graduate', 'normal');
    const player = useGameStore.getState().player;

    expect(player.firstHomePurchased).toBe(false);
    expect(player.careerProgressionProfile.reviewCount).toBe(0);
    expect(player.nextJobSwitchTurn).toBe(24);
  });

  it('hydrates missing progression fields when loading older saves', () => {
    const baseState = useGameStore.getState();
    useGameStore.getState().loadGame({
      ...baseState,
      player: {
        ...baseState.player,
        firstHomePurchased: undefined,
        careerProgressionProfile: undefined,
        nextJobSwitchTurn: undefined,
      } as never,
    });

    const hydrated = useGameStore.getState().player;
    expect(hydrated.firstHomePurchased).toBe(false);
    expect(hydrated.careerProgressionProfile.reviewCount).toBe(0);
    expect(hydrated.nextJobSwitchTurn).toBeGreaterThan(0);
  });

  it('derives first-timer and homeowner flags from player state', () => {
    const flags = deriveEligibilityFlags({
      salary: 5000,
      properties: [],
      firstHomePurchased: false,
      ownedPrivateHome: false,
    });

    expect(flags.firstTimer).toBe(true);
    expect(flags.homeowner).toBe(false);
  });
});
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:

```bash
npm.cmd run test -- src/game/__tests__/useGameStore.test.ts src/engine/__tests__/eligibility.test.ts
```

Expected:

- FAIL because new progression fields and `deriveEligibilityFlags` do not exist yet

- [ ] **Step 3: Add the minimal player-state and save-schema fields**

```ts
export interface CareerProgressionProfile {
  reviewCount: number;
  lastOutcome: 'promotion' | 'bonus' | 'steady' | 'setback' | null;
  lastSalaryDelta: number;
  lastBonus: number;
}

export interface EligibilityFlags {
  firstTimer: boolean;
  homeowner: boolean;
  upgrader: boolean;
  ecEligible: boolean;
  salaryCeilingExceeded: boolean;
}

export interface Player {
  // existing fields...
  careerGrowthModifier: number;
  careerRiskModifier: number;
  careerVolatilityModifier: number;
  lastCareerReviewTurn: number;
  nextJobSwitchTurn: number;
  firstHomePurchased: boolean;
  ownedPrivateHome: boolean;
  careerProgressionProfile: CareerProgressionProfile;
  careerReviewHistory: Array<{
    turn: number;
    outcome: CareerProgressionProfile['lastOutcome'];
    salaryDelta: number;
    bonus: number;
  }>;
}
```

- [ ] **Step 4: Add the eligibility helper and hydration defaults**

```ts
export function deriveEligibilityFlags(input: {
  salary: number;
  properties: Array<{ propertyId: string }>;
  firstHomePurchased: boolean;
  ownedPrivateHome: boolean;
}) {
  const firstTimer = !input.firstHomePurchased;
  const homeowner = input.properties.length > 0;
  const upgrader = input.firstHomePurchased;
  const ecEligible = input.salary <= 16000 && !input.ownedPrivateHome;

  return {
    firstTimer,
    homeowner,
    upgrader,
    ecEligible,
    salaryCeilingExceeded: false,
  };
}
```

- [ ] **Step 5: Run the focused tests to verify they pass**

Run:

```bash
npm.cmd run test -- src/game/__tests__/useGameStore.test.ts src/engine/__tests__/eligibility.test.ts
```

Expected:

- PASS for the new progression defaults and hydration coverage

- [ ] **Step 6: Commit**

```bash
git add src/game/types.ts src/game/useGameStore.ts src/data/saveSchema.ts src/engine/eligibility.ts src/engine/__tests__/eligibility.test.ts src/game/__tests__/useGameStore.test.ts
git commit -m "feat: add career progression player state"
```

### Task 2: Build Annual Career Review and Job Switch Engine

**Files:**
- Create: `src/engine/careerProgression.ts`
- Create: `src/engine/__tests__/careerProgression.test.ts`
- Modify: `src/engine/turn.ts`
- Modify: `src/data/scenarios.ts`
- Modify: `src/engine/__tests__/turn.test.ts`

- [ ] **Step 1: Write the failing career progression tests**

```ts
import { describe, expect, it } from 'vitest';
import { createRng } from '@/engine/rng';
import { resolveAnnualCareerReview, shouldOfferJobSwitch } from '@/engine/careerProgression';

describe('career progression', () => {
  it('triggers an annual review every 12 turns', () => {
    expect(shouldOfferJobSwitch(24, 24)).toBe(true);
    expect(shouldOfferJobSwitch(23, 24)).toBe(false);
  });

  it('returns deterministic annual outcomes for the same seed', () => {
    const a = resolveAnnualCareerReview({
      rng: createRng(42),
      salary: 5000,
      careerGrowthRate: 0.04,
      careerRiskFactor: 0.1,
      careerGrowthModifier: 1,
      careerRiskModifier: 1,
      careerVolatilityModifier: 0,
      positiveCashflow: true,
      underStress: false,
    });

    const b = resolveAnnualCareerReview({
      rng: createRng(42),
      salary: 5000,
      careerGrowthRate: 0.04,
      careerRiskFactor: 0.1,
      careerGrowthModifier: 1,
      careerRiskModifier: 1,
      careerVolatilityModifier: 0,
      positiveCashflow: true,
      underStress: false,
    });

    expect(a).toEqual(b);
  });
});
```

- [ ] **Step 2: Run the career tests to verify they fail**

Run:

```bash
npm.cmd run test -- src/engine/__tests__/careerProgression.test.ts src/engine/__tests__/turn.test.ts
```

Expected:

- FAIL because the new progression engine and turn integration do not exist

- [ ] **Step 3: Implement the minimal career progression engine**

```ts
export function shouldRunAnnualCareerReview(turnCount: number): boolean {
  return turnCount > 0 && turnCount % 12 === 0;
}

export function shouldOfferJobSwitch(turnCount: number, nextJobSwitchTurn: number): boolean {
  return turnCount >= nextJobSwitchTurn;
}

export function resolveAnnualCareerReview(input: CareerReviewInput): CareerReviewResult {
  const baseRoll = input.rng.next();
  const stabilityBias = input.positiveCashflow ? 0.08 : -0.08;
  const stressBias = input.underStress ? -0.12 : 0;
  const score = baseRoll + stabilityBias + stressBias - input.careerRiskFactor * 0.1;

  if (score > 0.82) return { outcome: 'promotion', salaryDeltaPct: 0.12, bonusCash: input.salary * 1.2, volatilityDelta: -0.02 };
  if (score > 0.62) return { outcome: 'bonus', salaryDeltaPct: 0.05, bonusCash: input.salary * 0.75, volatilityDelta: 0 };
  if (score > 0.28) return { outcome: 'steady', salaryDeltaPct: 0.03, bonusCash: 0, volatilityDelta: 0 };
  return { outcome: 'setback', salaryDeltaPct: -0.02, bonusCash: 0, volatilityDelta: 0.04 };
}
```

- [ ] **Step 4: Wire annual review and job-switch scenarios into `advanceTurn`**

```ts
if (shouldRunAnnualCareerReview(newTurnCount)) {
  scenarioId = 'career-review';
} else if (shouldOfferJobSwitch(newTurnCount, player.nextJobSwitchTurn)) {
  scenarioId = 'job-switch-opportunity';
}
```

- [ ] **Step 5: Re-run the focused tests**

Run:

```bash
npm.cmd run test -- src/engine/__tests__/careerProgression.test.ts src/engine/__tests__/turn.test.ts
```

Expected:

- PASS with deterministic review cadence and scenario injection

- [ ] **Step 6: Commit**

```bash
git add src/engine/careerProgression.ts src/engine/__tests__/careerProgression.test.ts src/engine/turn.ts src/data/scenarios.ts src/engine/__tests__/turn.test.ts
git commit -m "feat: add annual career review engine"
```

### Task 3: Surface Eligibility in Property Browsing and Purchasing

**Files:**
- Create: `src/components/EligibilityBadge.tsx`
- Modify: `src/data/properties.ts`
- Modify: `src/pages/Properties.tsx`
- Modify: `src/pages/PropertyDetail.tsx`
- Modify: `src/engine/__tests__/actions.test.ts`

- [ ] **Step 1: Write failing UI-adjacent and purchase tests**

```ts
it('marks the player as no longer first-timer after first residential purchase', () => {
  const result = buyPropertyPure(makePlayer({ cash: 500_000, cpfOrdinary: 200_000 }), 'hdb-bto-0', 80_000, 20_000);
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.player.firstHomePurchased).toBe(true);
  }
});

it('flags private home ownership after buying a private condo', () => {
  const result = buyPropertyPure(makePlayer({ cash: 3_000_000, cpfOrdinary: 0, salary: 10_000 }), 'condo-4', 700_000, 0);
  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.value.player.ownedPrivateHome).toBe(true);
  }
});
```

- [ ] **Step 2: Run the targeted test file to verify it fails**

Run:

```bash
npm.cmd run test -- src/engine/__tests__/actions.test.ts
```

Expected:

- FAIL because purchase actions do not yet update progression flags

- [ ] **Step 3: Implement minimal purchase-state transitions and eligibility UI helpers**

```ts
const isResidential = property.type !== 'Commercial Shop' && property.type !== 'Commercial Office';
const isPrivateResidential = property.type === 'Private Condo' || property.type.startsWith('Landed');

return ok({
  player: {
    ...player,
    firstHomePurchased: player.firstHomePurchased || isResidential,
    ownedPrivateHome: player.ownedPrivateHome || isPrivateResidential,
    // existing purchase updates...
  },
});
```

```tsx
export default function EligibilityBadge({ label, tone }: { label: string; tone: 'good' | 'warn' | 'blocked' }) {
  const toneClasses = {
    good: 'bg-success/15 text-success border-success/30',
    warn: 'bg-warning/15 text-warning border-warning/30',
    blocked: 'bg-danger/15 text-danger border-danger/30',
  };

  return <span className={`px-2 py-1 rounded text-[10px] font-rajdhani uppercase border ${toneClasses[tone]}`}>{label}</span>;
}
```

- [ ] **Step 4: Render eligibility labels in property list and detail**

```tsx
const flags = deriveEligibilityFlags({
  salary: player.salary,
  properties: player.properties,
  firstHomePurchased: player.firstHomePurchased,
  ownedPrivateHome: player.ownedPrivateHome,
});
```

```tsx
{flags.firstTimer && property.isHdb && <EligibilityBadge label="First-Timer Friendly" tone="good" />}
{property.type === 'Executive Condo' && !flags.ecEligible && <EligibilityBadge label="Salary Ceiling Exceeded" tone="blocked" />}
```

- [ ] **Step 5: Re-run tests and then smoke the property surfaces**

Run:

```bash
npm.cmd run test -- src/engine/__tests__/actions.test.ts
npm.cmd run build
```

Expected:

- PASS with updated first-home and private-home flags
- build succeeds with the new badges and eligibility section

- [ ] **Step 6: Commit**

```bash
git add src/components/EligibilityBadge.tsx src/data/properties.ts src/pages/Properties.tsx src/pages/PropertyDetail.tsx src/engine/__tests__/actions.test.ts src/engine/actions.ts
git commit -m "feat: add property eligibility surfacing"
```

### Task 4: Add Recap UI, Custom Art, and Smoke Coverage

**Files:**
- Copy/Create: `public/career-review-key-art.png`
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/Scenarios.tsx`
- Modify: `src/pages/GameOver.tsx`
- Modify: `scripts/playtest-smoke.mjs`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Write the failing smoke expectations first**

```js
await expectVisible(page, 'text=Career Review');
await expectVisible(page, 'text=Eligibility Summary');
await expectVisible(page, 'text=First-Timer Friendly');
await expectVisible(page, 'img[alt=\"Career Review\"]');
```

- [ ] **Step 2: Run the smoke test to verify it fails**

Run:

```bash
npm.cmd run test:smoke
```

Expected:

- FAIL because the review UI, eligibility summary, and new art are not yet rendered

- [ ] **Step 3: Implement the dashboard, scenario, and game-over recap surfaces**

```tsx
<GlassCard accentColor="#FFD740">
  <h3 className="section-title text-white mb-2">Eligibility Summary</h3>
  <div className="flex flex-wrap gap-2">
    {flags.firstTimer && <EligibilityBadge label="First-Timer" tone="good" />}
    {flags.upgrader && <EligibilityBadge label="Upgrader" tone="warn" />}
    {flags.ecEligible && <EligibilityBadge label="EC Eligible" tone="good" />}
  </div>
</GlassCard>
```

```tsx
<img src="/career-review-key-art.png" alt="Career Review" className="w-full h-40 object-cover rounded-lg opacity-80" />
```

- [ ] **Step 4: Copy in the generated art and update the smoke script**

Run:

```bash
Copy-Item "C:\\Users\\Greyf\\.codex\\generated_images\\019de62c-5272-7621-9004-40249ba2b3d6\\ig_0c13bba2a2824d0f0169f5f47fa2808191b18ed8f2d3934b1c.png" "public\\career-review-key-art.png"
```

- [ ] **Step 5: Run the full verification set**

Run:

```bash
npm.cmd run test
npm.cmd run build
npm.cmd run test:smoke
```

Expected:

- PASS across unit tests, production build, and the browser smoke flow

- [ ] **Step 6: Commit**

```bash
git add public/career-review-key-art.png src/pages/Dashboard.tsx src/pages/Scenarios.tsx src/pages/GameOver.tsx scripts/playtest-smoke.mjs CHANGELOG.md
git commit -m "feat: add career recap and eligibility progression ui"
```

## Self-Review

- Spec coverage:
  - annual review cadence: Task 2
  - job-switch cadence: Task 2
  - first-home and upgrader state: Tasks 1 and 3
  - eligibility browser/detail UI: Task 3
  - annual recap and generated art: Task 4
- Placeholder scan:
  - no `TBD`, `TODO`, or cross-references without paths
- Type consistency:
  - `careerProgressionProfile`, `careerVolatilityModifier`, `firstHomePurchased`, and `ownedPrivateHome` are used consistently across tasks

## Execution Handoff

Because the user already asked to proceed autonomously, execute this plan inline in the current worktree using `superpowers:executing-plans`.
