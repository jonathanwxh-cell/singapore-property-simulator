# Life Campaigns 1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a derived Life Campaign Director that turns each run into one clear Singapore housing chapter with a profile-aware objective, story beat, and lightweight scorecard.

**Architecture:** Keep campaign state derived from existing `Player`, `RunRoute`, milestones, scenarios, cashflow, and ownership state so no save migration is needed. Add one pure engine module, one dashboard component, focused unit tests, then browser-smoke the campaign card across default and non-default profiles.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Zustand-derived player state, existing Tailwind design tokens.

---

### Task 1: Pure Campaign Engine

**Files:**
- Create: `src/engine/lifeCampaign.ts`
- Test: `src/engine/__tests__/lifeCampaign.test.ts`

- [ ] **Step 1: Write tests for campaign derivation**

```ts
import { describe, expect, it } from 'vitest';
import { createInitialLifeState, type Player } from '@/game/types';
import { getLifeCampaign } from '../lifeCampaign';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Campaign Tester',
    age: 30,
    careerId: 'graduate',
    salary: 5_000,
    cash: 50_000,
    cpfOrdinary: 40_000,
    cpfSpecial: 15_000,
    cpfMedisave: 12_000,
    creditScore: 650,
    properties: [],
    loans: [],
    maritalStatus: 'married',
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
    runRouteId: 'bto-upgrader',
    ...overrides,
  };
}

describe('life campaign director', () => {
  it('frames the default BTO run as a foundation chapter with one next action', () => {
    const campaign = getLifeCampaign(makePlayer(), null);

    expect(campaign.title).toContain('BTO');
    expect(campaign.chapter.id).toBe('foundation');
    expect(campaign.activeMission.route).toBe('/life');
    expect(campaign.score.stability).toBeGreaterThan(0);
  });

  it('turns active scenarios into the campaign priority', () => {
    const campaign = getLifeCampaign(makePlayer(), 'first-home-window');

    expect(campaign.activeMission.route).toBe('/scenarios');
    expect(campaign.activeMission.label).toContain('scenario');
  });

  it('uses profile-specific story framing for single parents and multi-gen families', () => {
    const singleParent = getLifeCampaign(makePlayer({
      buyerProfile: { residencyStatus: 'sc', householdProfile: 'single-parent', age: 35 },
      runRouteId: 'bto-upgrader',
      children: 1,
    }), null);
    const multiGen = getLifeCampaign(makePlayer({
      buyerProfile: { residencyStatus: 'sc', householdProfile: 'multi-gen-family', age: 40 },
      runRouteId: 'heartland-landlord',
      children: 2,
      life: createInitialLifeState({ householdLoad: 2_650, stress: 32 }),
    }), null);

    expect(singleParent.storyBeat.title).toContain('Shelter');
    expect(multiGen.storyBeat.detail).toContain('family');
  });
});
```

- [ ] **Step 2: Implement the engine**

```ts
// src/engine/lifeCampaign.ts
// Export getLifeCampaign(player, currentScenario) with:
// - LifeCampaignChapterId: foundation | acquisition | ownership | expansion | legacy
// - LifeCampaign.activeMission: label, detail, route, actionLabel, tone
// - LifeCampaign.storyBeat: title, detail, tone
// - LifeCampaign.score: stability, wealth, learning, stress, overall
// Use getRunArc(), getFirstRunQuest(), getNextBestMoves(), selectAvailableCash(), selectMonthlyNetCashflow(), selectNetWorth().
```

- [ ] **Step 3: Verify the engine**

Run: `npm.cmd test -- lifeCampaign`
Expected: the new test file passes.

### Task 2: Dashboard Campaign Card

**Files:**
- Create: `src/components/LifeCampaignPanel.tsx`
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Add a focused presentational component**

```tsx
// src/components/LifeCampaignPanel.tsx
// Accepts LifeCampaign and onNavigate(route).
// Shows chapter label, campaign title, one active mission CTA, story beat, and 5 score chips.
// Keep it compact on mobile and visually quieter than CommandCenterHero.
```

- [ ] **Step 2: Wire it into Dashboard**

```tsx
// In Dashboard.tsx:
// import LifeCampaignPanel and getLifeCampaign
// const lifeCampaign = getLifeCampaign(player, currentScenario);
// Render below FirstRunQuestPanel and above stat cards.
```

- [ ] **Step 3: Verify dashboard render**

Run: `npm.cmd test`
Expected: existing Dashboard-related tests still pass.

### Task 3: Browser Playtest Coverage

**Files:**
- Modify: `scripts/playtest-smoke.mjs`

- [ ] **Step 1: Add smoke assertions**

```js
await expectVisible(page, 'text=Campaign Chapter');
await expectVisible(page, 'text=Current Mission');
await expectVisible(page, 'text=Campaign Score');
```

- [ ] **Step 2: Verify smoke**

Run: `npm.cmd run test:smoke`
Expected: smoke script passes and still checks mobile CTA overlap.

### Task 4: Final Verification And Commit

**Files:**
- All changed files from Tasks 1-3.

- [ ] **Step 1: Run full verification**

Run:
```bash
npm.cmd test
npm.cmd run lint
npm.cmd run build
npm.cmd run test:smoke
```

Expected: all commands exit 0.

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/plans/2026-05-06-life-campaigns-1.md src/engine/lifeCampaign.ts src/engine/__tests__/lifeCampaign.test.ts src/components/LifeCampaignPanel.tsx src/pages/Dashboard.tsx scripts/playtest-smoke.mjs
git commit -m "feat: add life campaign director"
```
