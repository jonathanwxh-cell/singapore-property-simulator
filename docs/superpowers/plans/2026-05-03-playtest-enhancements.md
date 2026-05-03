# Playtest Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the economy-breaking bank exploit, clean the finance/scenario flow, and add targeted early-game feedback that makes life actions and careers feel more rewarding.

**Architecture:** Keep the engine as the source of truth for borrowing rules, life-action previews, career beats, and first-property milestones. UI pages should only render engine-derived state and call existing store actions. This pass should stay small and layered: stabilize economy first, improve loop flow second, add fun-factor helpers third.

**Tech Stack:** React 19, TypeScript, Zustand, Vite, Vitest, Tailwind CSS, existing engine/store/page structure.

---

## File Structure

- Modify: `src/engine/actions.ts`
  - Reject direct `personal` loans and require property-bound renovation loans.
- Modify: `src/engine/__tests__/actions.test.ts`
  - Add regression coverage for the bank cash-printer exploit.
- Modify: `src/pages/Bank.tsx`
  - Convert loan application into borrowing-readiness planning and fix TDSR formatting.
- Modify: `src/pages/Scenarios.tsx`
  - Prevent unresolved scenario dismissal and route resolved scenarios back to dashboard.
- Modify: `src/engine/life.ts`
  - Add reusable life-action preview logic and integrate career beats.
- Modify: `src/engine/__tests__/life.test.ts`
  - Add preview and career-beat coverage.
- Create: `src/engine/careerBeats.ts`
  - Small career-specific monthly beat resolver.
- Create: `src/engine/__tests__/careerBeats.test.ts`
  - Unit tests for career beat selection and effects.
- Create: `src/engine/propertyMilestones.ts`
  - First-property milestone selector.
- Create: `src/engine/__tests__/propertyMilestones.test.ts`
  - Unit tests for milestone thresholds.
- Modify: `src/pages/Life.tsx`
  - Render expected action impacts and first-property milestones.
- Create: `docs/superpowers/playtests/2026-05-03-playtest-enhancements-qa.md`
  - Browser QA notes for the completed pass.

---

### Task 1: Close The Bank Cash-Printer Exploit

**Files:**
- Modify: `src/engine/actions.ts`
- Modify: `src/engine/__tests__/actions.test.ts`

- [ ] **Step 1: Add failing regression tests for direct personal loans**

Add these tests inside the existing `describe('applyLoanPure', ...)` block in `src/engine/__tests__/actions.test.ts`:

```ts
it('rejects direct personal cash loans from the regular loan API', () => {
  const result = applyLoanPure(makePlayer(), 50_000, 5, 5, 'personal');

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.reason).toBe('personal_loan_unavailable');
  }
});

it('rejects renovation loans without a property target', () => {
  const result = applyLoanPure(makePlayer(), 50_000, 5, 5, 'renovation');

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.reason).toBe('property_required');
  }
});
```

- [ ] **Step 2: Run the targeted test and verify it fails**

Run:

```powershell
npm.cmd test -- src/engine/__tests__/actions.test.ts
```

Expected: FAIL because `applyLoanPure` still allows direct personal loans and property-less renovation loans.

- [ ] **Step 3: Implement the engine guard**

In `src/engine/actions.ts`, add these checks after the existing amount/term validation and before credit-score validation:

```ts
  if (type === 'personal') {
    return fail(
      'personal_loan_unavailable',
      'Personal loans are only available from explicit scenario outcomes.',
    );
  }

  if (type === 'renovation' && !propertyId) {
    return fail('property_required', 'Renovation loans must be tied to an owned property.');
  }
```

- [ ] **Step 4: Run the targeted test and verify it passes**

Run:

```powershell
npm.cmd test -- src/engine/__tests__/actions.test.ts
```

Expected: PASS.

- [ ] **Step 5: Run full engine tests**

Run:

```powershell
npm.cmd test
```

Expected: PASS.

- [ ] **Step 6: Commit the engine fix**

```powershell
git add src/engine/actions.ts src/engine/__tests__/actions.test.ts
git commit -m "fix: prevent direct personal loan cash exploit"
```

---

### Task 2: Rework The Bank UI Into Borrowing Readiness

**Files:**
- Modify: `src/pages/Bank.tsx`

- [ ] **Step 1: Update imports and store usage**

Change the imports and store destructuring in `src/pages/Bank.tsx`:

```ts
import { useNavigate } from 'react-router-dom';
import { formatCurrency, formatPercent } from '@/lib/format';
import { Landmark, Wallet, TrendingDown, Search, AlertTriangle } from 'lucide-react';
```

Then change:

```ts
  const { player, applyLoan, payLoan } = useGameStore();
```

to:

```ts
  const navigate = useNavigate();
  const { player, payLoan } = useGameStore();
```

- [ ] **Step 2: Remove unused loan error state**

Delete:

```ts
  const [loanError, setLoanError] = useState<string | null>(null);
```

Remove all `setLoanError(null)` calls from slider handlers.

- [ ] **Step 3: Use formatting helpers in displayed values**

Replace raw labels in the calculation block with:

```ts
  const tdsrCapLabel = formatPercent(TDSR_LIMIT * 100);
```

Render the cap as:

```tsx
<span className="text-text-secondary text-sm">TDSR ({tdsrCapLabel} cap)</span>
```

Use `formatCurrency` for CPF cards, total debt, monthly payment, estimated monthly payment, and total interest where practical.

- [ ] **Step 4: Replace the mutation button with a planning CTA**

Replace the existing `Apply for Loan` button with:

```tsx
<button
  onClick={() => navigate('/properties')}
  className="btn-primary w-full flex items-center justify-center gap-2"
>
  <Search size={16} />
  Browse Properties
</button>
```

Add a short readiness note above the button:

```tsx
<div className="flex items-start gap-2 p-3 rounded-lg bg-cyan-glow/10 border border-cyan-glow/30">
  <AlertTriangle size={16} className="text-cyan-glow shrink-0 mt-0.5" />
  <p className="text-text-secondary text-xs">
    Use this panel to estimate affordability. Mortgages are created when you buy a property.
  </p>
</div>
```

- [ ] **Step 5: Run lint and build**

Run:

```powershell
npm.cmd run lint
npm.cmd run build
```

Expected: both PASS.

- [ ] **Step 6: Commit the UI fix**

```powershell
git add src/pages/Bank.tsx
git commit -m "fix: make bank borrowing read-only"
```

---

### Task 3: Tighten Scenario Resolution Flow

**Files:**
- Modify: `src/pages/Scenarios.tsx`

- [ ] **Step 1: Add navigation support**

At the top of `src/pages/Scenarios.tsx`, add:

```ts
import { useNavigate } from 'react-router-dom';
```

Inside `Scenarios`, add:

```ts
  const navigate = useNavigate();
```

- [ ] **Step 2: Split unresolved dismiss from resolved continue**

Replace `handleDismiss` with:

```ts
  const handleResultContinue = () => {
    setResult(null);
    setResolved(false);
    navigate('/dashboard');
  };
```

- [ ] **Step 3: Remove unresolved scenario skip button**

In the `activeScenario && !resolved` branch, remove the top-right close button:

```tsx
<button onClick={handleDismiss} className="absolute top-4 right-4 text-text-dim hover:text-white transition-colors"><X size={20} /></button>
```

Also remove the unused `X` import.

- [ ] **Step 4: Route resolved scenarios back to dashboard**

In the result branch, change:

```tsx
<button onClick={handleDismiss} className="btn-primary">Continue</button>
```

to:

```tsx
<button onClick={handleResultContinue} className="btn-primary">Continue</button>
```

- [ ] **Step 5: Run lint and build**

Run:

```powershell
npm.cmd run lint
npm.cmd run build
```

Expected: both PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/pages/Scenarios.tsx
git commit -m "fix: return resolved scenarios to dashboard"
```

---

### Task 4: Add Engine-Owned Life Action Previews

**Files:**
- Modify: `src/engine/life.ts`
- Modify: `src/engine/__tests__/life.test.ts`
- Modify: `src/pages/Life.tsx`

- [ ] **Step 1: Add preview tests**

In `src/engine/__tests__/life.test.ts`, import `previewLifeAction` and add:

```ts
import { careers } from '@/data/careers';
import { createInitialLifeState } from '@/game/types';
import { previewLifeAction } from '../life';

it('previews side gig as cash-positive with energy and stress tradeoffs', () => {
  const tech = careers.find((career) => career.id === 'tech');
  expect(tech).toBeDefined();
  if (!tech) return;

  const preview = previewLifeAction('take-side-gig', createInitialLifeState(), tech, 1);

  expect(preview.cashDelta.expected).toBeGreaterThan(0);
  expect(preview.energyDelta).toBeLessThan(0);
  expect(preview.stressDelta).toBeGreaterThan(0);
});

it('previews scheme planning as grant-progress positive', () => {
  const graduate = careers.find((career) => career.id === 'graduate');
  expect(graduate).toBeDefined();
  if (!graduate) return;

  const preview = previewLifeAction('plan-schemes', createInitialLifeState(), graduate, 1);

  expect(preview.schemeFirstTimerGrantDelta).toBeGreaterThan(0);
  expect(preview.cashDelta.expected).toBeGreaterThanOrEqual(0);
});
```

- [ ] **Step 2: Run targeted tests and verify failure**

Run:

```powershell
npm.cmd test -- src/engine/__tests__/life.test.ts
```

Expected: FAIL because `previewLifeAction` does not exist.

- [ ] **Step 3: Refactor action resolution to share deterministic factors**

In `src/engine/life.ts`, add:

```ts
export interface LifeActionPreview {
  cashDelta: {
    min: number;
    expected: number;
    max: number;
  };
  energyDelta: number;
  stressDelta: number;
  reputationDelta: number;
  careerMomentumDelta: number;
  schemeSkillsFutureDelta: number;
  schemeFirstTimerGrantDelta: number;
  schemeHouseholdSupportDelta: number;
}
```

Change `resolveAction` to compute `actionFactor`, then delegate to a new helper:

```ts
function resolveAction(
  actionId: LifeActionId,
  life: PlayerLifeState,
  career: Career,
  rng: Pick<Rng, 'next'>,
  scale: number,
): LifeActionResolution {
  return resolveActionWithFactor(actionId, life, career, scale, (0.8 + rng.next() * 0.4) * scale);
}
```

Move the existing switch body into:

```ts
function resolveActionWithFactor(
  actionId: LifeActionId,
  life: PlayerLifeState,
  career: Career,
  scale: number,
  actionFactor: number,
): LifeActionResolution {
  const modifiers = career.actionModifiers;

  switch (actionId) {
    // Move the current switch cases here without changing their return objects.
  }
}
```

- [ ] **Step 4: Add preview function**

Below `resolveActionWithFactor`, add:

```ts
export function previewLifeAction(
  actionId: LifeActionId,
  life: PlayerLifeState,
  career: Career,
  scale = 1,
): LifeActionPreview {
  const normalizedLife = normalizeLifeState(life);
  const low = resolveActionWithFactor(actionId, normalizedLife, career, scale, 0.8 * scale);
  const expected = resolveActionWithFactor(actionId, normalizedLife, career, scale, 1 * scale);
  const high = resolveActionWithFactor(actionId, normalizedLife, career, scale, 1.2 * scale);

  return {
    cashDelta: {
      min: Math.min(low.cashDelta, expected.cashDelta, high.cashDelta),
      expected: expected.cashDelta,
      max: Math.max(low.cashDelta, expected.cashDelta, high.cashDelta),
    },
    energyDelta: expected.energyDelta,
    stressDelta: expected.stressDelta,
    reputationDelta: expected.reputationDelta,
    careerMomentumDelta: expected.careerMomentumDelta,
    schemeSkillsFutureDelta: expected.schemeSkillsFutureDelta,
    schemeFirstTimerGrantDelta: expected.schemeFirstTimerGrantDelta,
    schemeHouseholdSupportDelta: expected.schemeHouseholdSupportDelta,
  };
}
```

- [ ] **Step 5: Run targeted life tests**

Run:

```powershell
npm.cmd test -- src/engine/__tests__/life.test.ts
```

Expected: PASS.

- [ ] **Step 6: Render previews on action cards**

In `src/pages/Life.tsx`, import `careers` and `previewLifeAction`:

```ts
import { careers } from '@/data/careers';
import { previewLifeAction } from '@/engine/life';
```

Find the active career:

```ts
  const career = careers.find((item) => item.id === player.careerId) ?? careers[0];
```

Pass previews into `LifeActionOptionCard`:

```tsx
preview={previewLifeAction(action.id, player.life, career, selectedTone === 'secondary' ? 0.6 : 1)}
```

Extend the component props:

```ts
preview: LifeActionPreview;
```

Render compact preview rows inside the card:

```tsx
<div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-mono">
  <span className="rounded-md border border-white/10 bg-black/15 px-2 py-1 text-success">
    {formatCurrency(preview.cashDelta.expected)}
  </span>
  <span className="rounded-md border border-white/10 bg-black/15 px-2 py-1 text-cyan-glow">
    E {preview.energyDelta >= 0 ? '+' : ''}{preview.energyDelta}
  </span>
  <span className="rounded-md border border-white/10 bg-black/15 px-2 py-1 text-warning">
    S {preview.stressDelta >= 0 ? '+' : ''}{preview.stressDelta}
  </span>
</div>
```

- [ ] **Step 7: Run full verification**

Run:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Expected: all PASS.

- [ ] **Step 8: Commit**

```powershell
git add src/engine/life.ts src/engine/__tests__/life.test.ts src/pages/Life.tsx
git commit -m "feat: preview life action impacts"
```

---

### Task 5: Add Career-Specific Monthly Beats

**Files:**
- Create: `src/engine/careerBeats.ts`
- Create: `src/engine/__tests__/careerBeats.test.ts`
- Modify: `src/engine/life.ts`
- Modify: `src/game/types.ts`

- [ ] **Step 1: Extend life-month summary type**

In `src/game/types.ts`, add optional beat metadata to `LifeMonthSummary`:

```ts
  careerBeatId?: string;
  careerBeatLabel?: string;
```

- [ ] **Step 2: Create career beat tests**

Create `src/engine/__tests__/careerBeats.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { careers } from '@/data/careers';
import { createInitialLifeState } from '@/game/types';
import { resolveCareerBeat } from '../careerBeats';

const rngAlways = { next: () => 0 };
const rngNever = { next: () => 0.99 };

describe('resolveCareerBeat', () => {
  it('gives property agents a property-hustle referral beat', () => {
    const career = careers.find((item) => item.id === 'agent');
    expect(career).toBeDefined();
    if (!career) return;

    const beat = resolveCareerBeat({
      actionId: 'property-hustle',
      career,
      life: createInitialLifeState({ reputation: 20 }),
      rng: rngAlways,
    });

    expect(beat?.id).toBe('agent-buyer-referral');
    expect(beat?.cashDelta).toBeGreaterThan(0);
    expect(beat?.note).toContain('buyer referral');
  });

  it('does not force a beat when the roll misses', () => {
    const career = careers.find((item) => item.id === 'tech');
    expect(career).toBeDefined();
    if (!career) return;

    const beat = resolveCareerBeat({
      actionId: 'take-side-gig',
      career,
      life: createInitialLifeState(),
      rng: rngNever,
    });

    expect(beat).toBeNull();
  });
});
```

- [ ] **Step 3: Run targeted career beat tests and verify failure**

Run:

```powershell
npm.cmd test -- src/engine/__tests__/careerBeats.test.ts
```

Expected: FAIL because `careerBeats.ts` does not exist.

- [ ] **Step 4: Implement career beat resolver**

Create `src/engine/careerBeats.ts`:

```ts
import type { Career } from '@/data/careers';
import type { LifeActionId, PlayerLifeState } from '@/game/types';
import type { Rng } from './rng';

export interface CareerBeatInput {
  actionId: LifeActionId;
  career: Career;
  life: PlayerLifeState;
  rng: Pick<Rng, 'next'>;
}

export interface CareerBeat {
  id: string;
  label: string;
  cashDelta: number;
  energyDelta: number;
  stressDelta: number;
  reputationDelta: number;
  careerMomentumDelta: number;
  note: string;
}

export function resolveCareerBeat(input: CareerBeatInput): CareerBeat | null {
  const { actionId, career, life, rng } = input;
  const reputationBonus = Math.floor(life.reputation / 20);

  if (career.id === 'agent' && actionId === 'property-hustle' && rng.next() <= 0.5) {
    return {
      id: 'agent-buyer-referral',
      label: 'Buyer Referral',
      cashDelta: 900 + reputationBonus * 150,
      energyDelta: -2,
      stressDelta: 2,
      reputationDelta: 3,
      careerMomentumDelta: 1,
      note: 'A buyer referral converted into a small commission.',
    };
  }

  if (career.id === 'tech' && actionId === 'take-side-gig' && rng.next() <= 0.45) {
    return {
      id: 'tech-freelance-sprint',
      label: 'Freelance Sprint',
      cashDelta: 800 + reputationBonus * 120,
      energyDelta: -3,
      stressDelta: 3,
      reputationDelta: 2,
      careerMomentumDelta: 1,
      note: 'A short freelance sprint paid out after hours.',
    };
  }

  if (career.id === 'graduate' && actionId === 'upskill' && rng.next() <= 0.55) {
    return {
      id: 'graduate-course-subsidy',
      label: 'Course Subsidy',
      cashDelta: 300,
      energyDelta: 0,
      stressDelta: -1,
      reputationDelta: 1,
      careerMomentumDelta: 2,
      note: 'A subsidized course slot made upskilling easier this month.',
    };
  }

  return null;
}
```

- [ ] **Step 5: Integrate beats into life month resolution**

In `src/engine/life.ts`, import:

```ts
import { resolveCareerBeat } from './careerBeats';
```

After applying primary and secondary action resolutions, add:

```ts
  const careerBeat = resolveCareerBeat({
    actionId: primaryActionId,
    career,
    life: nextLife,
    rng,
  });

  if (careerBeat) {
    summary.careerBeatId = careerBeat.id;
    summary.careerBeatLabel = careerBeat.label;
    summary.cashDelta += careerBeat.cashDelta;
    summary.energyDelta += careerBeat.energyDelta;
    summary.stressDelta += careerBeat.stressDelta;
    summary.reputationDelta += careerBeat.reputationDelta;
    summary.careerMomentumDelta += careerBeat.careerMomentumDelta;
    nextLife.energy += careerBeat.energyDelta;
    nextLife.stress += careerBeat.stressDelta;
    nextLife.reputation += careerBeat.reputationDelta;
    nextLife.careerMomentum += careerBeat.careerMomentumDelta;
    notes.push(careerBeat.note);
  }
```

- [ ] **Step 6: Run targeted tests**

Run:

```powershell
npm.cmd test -- src/engine/__tests__/careerBeats.test.ts src/engine/__tests__/life.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/game/types.ts src/engine/life.ts src/engine/careerBeats.ts src/engine/__tests__/careerBeats.test.ts
git commit -m "feat: add career-specific monthly beats"
```

---

### Task 6: Add First-Property Milestones

**Files:**
- Create: `src/engine/propertyMilestones.ts`
- Create: `src/engine/__tests__/propertyMilestones.test.ts`
- Modify: `src/pages/Life.tsx`

- [ ] **Step 1: Add milestone selector tests**

Create `src/engine/__tests__/propertyMilestones.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import type { Player } from '@/game/types';
import { createInitialLifeState } from '@/game/types';
import { selectFirstPropertyMilestones } from '../propertyMilestones';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Test',
    age: 27,
    careerId: 'graduate',
    salary: 5000,
    cash: 50_000,
    cpfOrdinary: 0,
    cpfSpecial: 0,
    cpfMedisave: 0,
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
    life: createInitialLifeState(),
    ...overrides,
  };
}

describe('selectFirstPropertyMilestones', () => {
  it('marks bank readiness when credit and cashflow are healthy', () => {
    const milestones = selectFirstPropertyMilestones(makePlayer(), 81_900, 3_750);
    const bankMilestone = milestones.find((item) => item.id === 'bank-ipa-prepared');

    expect(bankMilestone?.achieved).toBe(true);
  });

  it('marks option fee ready once cash covers the threshold', () => {
    const milestones = selectFirstPropertyMilestones(makePlayer({ cash: 10_000 }), 81_900, 1_000);
    const optionMilestone = milestones.find((item) => item.id === 'option-fee-ready');

    expect(optionMilestone?.achieved).toBe(true);
  });
});
```

- [ ] **Step 2: Run targeted tests and verify failure**

Run:

```powershell
npm.cmd test -- src/engine/__tests__/propertyMilestones.test.ts
```

Expected: FAIL because `propertyMilestones.ts` does not exist.

- [ ] **Step 3: Implement selector**

Create `src/engine/propertyMilestones.ts`:

```ts
import type { Player } from '@/game/types';

export interface FirstPropertyMilestone {
  id: string;
  label: string;
  description: string;
  achieved: boolean;
}

export function selectFirstPropertyMilestones(
  player: Player,
  targetUpfront: number,
  monthlySurplus: number,
): FirstPropertyMilestone[] {
  const optionFeeThreshold = Math.min(5_000, Math.max(1_000, targetUpfront * 0.05));
  const cashFoundationThreshold = targetUpfront * 0.5;

  return [
    {
      id: 'eligibility-packet-ready',
      label: 'Eligibility Packet Ready',
      description: 'Scheme planning has started turning paperwork into buying confidence.',
      achieved: player.life.schemeProgress.firstTimerGrant >= 8,
    },
    {
      id: 'bank-ipa-prepared',
      label: 'Bank IPA Prepared',
      description: 'Credit and cashflow look healthy enough to start serious loan planning.',
      achieved: player.creditScore >= 650 && monthlySurplus > 0,
    },
    {
      id: 'viewing-shortlist-built',
      label: 'Viewing Shortlist Built',
      description: 'Market work has produced a clearer first-home shortlist.',
      achieved: player.life.reputation >= 3 || player.turnCount >= 2,
    },
    {
      id: 'option-fee-ready',
      label: 'Option Fee Ready',
      description: 'Cash on hand can cover a realistic first commitment.',
      achieved: player.cash >= optionFeeThreshold,
    },
    {
      id: 'cash-foundation-built',
      label: 'Cash Foundation Built',
      description: 'You are at least halfway to the target upfront cash requirement.',
      achieved: player.cash >= cashFoundationThreshold,
    },
  ];
}
```

- [ ] **Step 4: Render milestones in Life page**

In `src/pages/Life.tsx`, import:

```ts
import { selectFirstPropertyMilestones } from '@/engine/propertyMilestones';
```

After `affordability`, compute:

```ts
  const firstPropertyMilestones = selectFirstPropertyMilestones(
    player,
    purchaseValidation.totalUpfront,
    monthlySurplus,
  );
```

Inside the `Closest Property Path` card, render:

```tsx
<div className="mt-4 space-y-2">
  {firstPropertyMilestones.map((milestone) => (
    <div
      key={milestone.id}
      className={`rounded-lg border px-3 py-2 ${milestone.achieved ? 'border-success/40 bg-success/10' : 'border-glass-border bg-white/5'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className={milestone.achieved ? 'text-success font-rajdhani font-semibold' : 'text-white font-rajdhani font-semibold'}>
          {milestone.label}
        </p>
        <span className="text-[10px] font-mono text-text-dim">
          {milestone.achieved ? 'Ready' : 'Pending'}
        </span>
      </div>
      <p className="text-text-secondary text-xs mt-1">{milestone.description}</p>
    </div>
  ))}
</div>
```

- [ ] **Step 5: Run targeted tests**

Run:

```powershell
npm.cmd test -- src/engine/__tests__/propertyMilestones.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run full verification**

Run:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Expected: all PASS.

- [ ] **Step 7: Commit**

```powershell
git add src/engine/propertyMilestones.ts src/engine/__tests__/propertyMilestones.test.ts src/pages/Life.tsx
git commit -m "feat: add first-property milestones"
```

---

### Task 7: Browser QA And Playtest Notes

**Files:**
- Create: `docs/superpowers/playtests/2026-05-03-playtest-enhancements-qa.md`

- [ ] **Step 1: Start local dev server**

Run:

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 4173
```

Expected: Vite serves the app at `http://127.0.0.1:4173/`.

- [ ] **Step 2: Verify bank exploit is closed**

Browser flow:

1. Start `Tech Professional / Normal`.
2. Open `Bank`.
3. Confirm there is no active direct `Apply for Loan` cash-disbursement button.
4. Confirm the TDSR label reads `TDSR (55% cap)`.
5. Confirm `Browse Properties` opens the property browser.

- [ ] **Step 3: Verify intended purchase still works**

Browser flow:

1. Start `Property Agent / Easy`.
2. Buy `Tengah Plantation Grove 4-Room`.
3. Rent it out from `Portfolio`.
4. Advance one month.
5. Confirm rental income and mortgage payments show on dashboard.

- [ ] **Step 4: Verify scenario flow**

Browser flow:

1. Advance until a scenario appears.
2. Confirm there is no unresolved close/skip button.
3. Resolve one option.
4. Click `Continue`.
5. Confirm the app returns to dashboard.

- [ ] **Step 5: Verify life fun upgrades**

Browser flow:

1. Open `Life`.
2. Confirm action cards show cash, energy, and stress preview chips.
3. Confirm closest-property path shows first-property milestones.
4. Run one `Tech Professional / Normal` side-gig month and confirm last-month summary includes action results.
5. Run one `Property Agent / Easy` property-hustle month and confirm a career beat can appear across repeated test runs or deterministic seed work.

- [ ] **Step 6: Write QA note**

Create `docs/superpowers/playtests/2026-05-03-playtest-enhancements-qa.md` with:

```md
# Playtest Enhancements QA - 2026-05-03

## Coverage

- Bank exploit regression
- TDSR formatting
- Scenario resolution flow
- Clean easy purchase path
- Life action previews
- First-property milestones
- Career beat smoke test

## Results

- Bank direct cash loans:
- TDSR label:
- Scenario continue route:
- Purchase/rent/advance loop:
- Life preview readability:
- Browser console:

## Follow-Up

- Record any remaining issues found during QA.
```

- [ ] **Step 7: Run final verification**

Run:

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Expected: all PASS.

- [ ] **Step 8: Commit QA note**

```powershell
git add docs/superpowers/playtests/2026-05-03-playtest-enhancements-qa.md
git commit -m "docs: add playtest enhancement QA notes"
```

---

## Self-Review

- Spec coverage:
  - Bank exploit: Tasks 1 and 2
  - TDSR formatting: Task 2
  - Scenario return and skip behavior: Task 3
  - Life action previews: Task 4
  - Career identity: Task 5
  - First-property motivation: Task 6
  - Browser verification: Task 7
- Placeholder scan:
  - No placeholder markers or undefined implementation steps remain.
- Type consistency:
  - `LifeActionPreview`, `CareerBeat`, and `FirstPropertyMilestone` are introduced before use.
  - `careerBeatId` and `careerBeatLabel` are optional save-safe additions to `LifeMonthSummary`.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-03-playtest-enhancements.md`.

Two execution options:

1. Subagent-Driven (recommended) - dispatch a fresh subagent per task, review between tasks, fast iteration.

2. Inline Execution - execute tasks in this session using executing-plans, batch execution with checkpoints.
