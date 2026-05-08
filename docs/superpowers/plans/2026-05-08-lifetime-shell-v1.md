# Lifetime Shell v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add named endings, life memories, run history, and a life-summary finish so the current property simulator starts playing like Singapore: A Lifetime without rewriting the finance engine.

**Architecture:** Add a small lifetime domain around the existing `Player` and `GameState` shapes. Ending detection reads current player, property, route, life, and operation-history state; memory recording attaches story beats to existing actions and turn outcomes; UI consumes derived lifetime summaries instead of duplicating rules.

**Tech Stack:** React 19, TypeScript, Vite, Zustand, Vitest, Tailwind CSS, localStorage profile persistence.

---

## File Structure

- Create: `src/data/lifetimeEndings.ts` for named ending definitions, labels, hints, and non-spoiler collection copy.
- Create: `src/engine/lifetime/endings.ts` for deterministic ending scoring and selection.
- Create: `src/engine/lifetime/memories.ts` for memory creation, deduping, and summary helpers.
- Create: `src/engine/__tests__/lifetimeEndings.test.ts` for ending detection coverage.
- Create: `src/engine/__tests__/lifetimeMemories.test.ts` for memory helper coverage.
- Modify: `src/game/types.ts` to add lifetime types and player fields.
- Modify: `src/game/useGameStore.ts` to initialize and persist lifetime state.
- Modify: `src/data/saveSchema.ts` and `src/game/saveMigrations.ts` to support the new save shape.
- Modify: `src/engine/actions.ts` to record purchase, sale, tenant, renovation, reserve, and tax memories.
- Modify: `src/engine/turn.ts` to record monthly and game-over memories.
- Modify: `src/pages/GameOver.tsx` to show named ending, memories, and replay prompt.
- Modify: `src/pages/Dashboard.tsx` or dashboard panels to frame route as a life goal.
- Modify: `README.md` and `CHANGELOG.md` after the feature ships.

---

### Task 1: Add Lifetime Types And Defaults

**Files:**
- Modify: `src/game/types.ts`
- Modify: `src/game/useGameStore.ts`
- Test: `src/game/__tests__/useGameStore.test.ts`

- [ ] **Step 1: Write the failing store initialization test**

Add a test that starts a new game and expects lifetime fields to exist.

```ts
it('initializes lifetime memories and ending collection for a new run', () => {
  const { newGame } = useGameStore.getState();

  newGame('Lifetime Tester', 'graduate', 'normal', {
    residencyStatus: 'sc',
    householdProfile: 'couple-family',
    age: 30,
  }, 'bto-upgrader');

  const player = useGameStore.getState().player;
  expect(player.lifeMemories).toEqual([]);
  expect(player.endingCollection).toEqual({
    unlockedEndingIds: [],
    runHistory: [],
  });
});
```

- [ ] **Step 2: Run the failing test**

Run: `npm.cmd test -- src/game/__tests__/useGameStore.test.ts -t "initializes lifetime memories"`

Expected: FAIL because `lifeMemories` and `endingCollection` do not exist yet.

- [ ] **Step 3: Add the minimal type surface**

Add these types to `src/game/types.ts` near the other game-wide type definitions.

```ts
export type LifeMemoryCategory =
  | 'home'
  | 'career'
  | 'family'
  | 'money'
  | 'landlord'
  | 'market'
  | 'culture'
  | 'setback'
  | 'milestone';

export type EndingId =
  | 'heartland-hero'
  | 'kiasu-king'
  | 'fire-at-45'
  | 'property-tycoon'
  | 'sandwich-generation'
  | 'retire-in-jb'
  | 'cash-king'
  | 'en-bloc-millionaire'
  | 'negative-equity'
  | 'quiet-achiever'
  | 'kena-scam'
  | 'migration-story'
  | 'paper-general'
  | 'ah-beng-made-good';

export interface LifeMemory {
  id: string;
  turn: number;
  year: number;
  month: number;
  category: LifeMemoryCategory;
  title: string;
  detail: string;
  tags: string[];
  scoreImpact?: number;
}

export interface LifetimeRunRecord {
  id: string;
  endingId: EndingId;
  endingLabel: string;
  playerName: string;
  completedAt: string;
  finalYear: number;
  finalMonth: number;
  finalAge: number;
  netWorth: number;
  memories: LifeMemory[];
}

export interface EndingCollectionState {
  unlockedEndingIds: EndingId[];
  runHistory: LifetimeRunRecord[];
}
```

Extend `Player`:

```ts
lifeMemories?: LifeMemory[];
endingCollection?: EndingCollectionState;
```

- [ ] **Step 4: Add defaults in store hydration**

Add a helper in `src/game/useGameStore.ts`.

```ts
function withLifetimeDefaults(player: Player): Player {
  return {
    ...player,
    lifeMemories: player.lifeMemories ?? [],
    endingCollection: player.endingCollection ?? {
      unlockedEndingIds: [],
      runHistory: [],
    },
  };
}
```

Update the existing hydration chain so lifetime defaults run with other player defaults.

```ts
const hydrated = withLifetimeDefaults(
  withRunRouteDefaults(withBuyerProfileDefaults(withLifeDefaults(withPortfolioDefaults(withCareerDefaults(player)))))
);
```

Add the same defaults in `createInitialPlayer`.

- [ ] **Step 5: Run the store test**

Run: `npm.cmd test -- src/game/__tests__/useGameStore.test.ts -t "initializes lifetime memories"`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/game/types.ts src/game/useGameStore.ts src/game/__tests__/useGameStore.test.ts
git commit -m "feat: add lifetime state defaults"
```

---

### Task 2: Add Named Ending Definitions

**Files:**
- Create: `src/data/lifetimeEndings.ts`
- Create: `src/engine/lifetime/endings.ts`
- Create: `src/engine/__tests__/lifetimeEndings.test.ts`

- [ ] **Step 1: Write ending definition tests**

```ts
import { lifetimeEndings, lifetimeEndingsById } from '@/data/lifetimeEndings';

describe('lifetime ending definitions', () => {
  it('defines unique ending ids with player-facing copy', () => {
    const ids = lifetimeEndings.map((ending) => ending.id);

    expect(new Set(ids).size).toBe(lifetimeEndings.length);
    expect(lifetimeEndingsById['heartland-hero'].label).toBe('Heartland Hero');
    expect(lifetimeEndingsById['property-tycoon'].spoilerSafeHint).toContain('property');
    expect(lifetimeEndings.every((ending) => ending.summary.length > 20)).toBe(true);
  });
});
```

- [ ] **Step 2: Run the failing test**

Run: `npm.cmd test -- src/engine/__tests__/lifetimeEndings.test.ts`

Expected: FAIL because `src/data/lifetimeEndings.ts` does not exist.

- [ ] **Step 3: Create ending definitions**

Create `src/data/lifetimeEndings.ts`.

```ts
import type { EndingId, LifeMemoryCategory } from '@/game/types';

export interface LifetimeEndingDefinition {
  id: EndingId;
  label: string;
  tone: 'warm' | 'comic' | 'bittersweet' | 'cautionary' | 'prestige';
  summary: string;
  spoilerSafeHint: string;
  primaryCategories: LifeMemoryCategory[];
}

export const lifetimeEndings: LifetimeEndingDefinition[] = [
  {
    id: 'heartland-hero',
    label: 'Heartland Hero',
    tone: 'warm',
    summary: 'You built a rooted Singapore life around one practical home, steady obligations, and community stability.',
    spoilerSafeHint: 'Own modestly, stay stable, and let community matter more than status.',
    primaryCategories: ['home', 'family', 'culture'],
  },
  {
    id: 'property-tycoon',
    label: 'Property Tycoon',
    tone: 'prestige',
    summary: 'You kept climbing the property ladder until the portfolio became the story.',
    spoilerSafeHint: 'Build a large portfolio and survive the taxes, debt, and operating drag.',
    primaryCategories: ['home', 'landlord', 'money'],
  },
  {
    id: 'cash-king',
    label: 'Cash King',
    tone: 'comic',
    summary: 'You avoided the property chase and ended with liquidity, optionality, and a very smug bank balance.',
    spoilerSafeHint: 'Stay liquid and prove that not buying can also be a strategy.',
    primaryCategories: ['money', 'career'],
  },
  {
    id: 'quiet-achiever',
    label: 'Quiet Achiever',
    tone: 'warm',
    summary: 'No fireworks, no flexing, just a stable life that worked better than it looked on paper.',
    spoilerSafeHint: 'Keep stress low, debt manageable, and life stable.',
    primaryCategories: ['family', 'home', 'milestone'],
  },
  {
    id: 'negative-equity',
    label: 'Negative Equity',
    tone: 'cautionary',
    summary: 'The market turned, leverage bit back, and the dream home became a balance-sheet lesson.',
    spoilerSafeHint: 'High leverage and poor timing can become a long shadow.',
    primaryCategories: ['setback', 'market', 'money'],
  },
  {
    id: 'fire-at-45',
    label: 'FIRE at 45',
    tone: 'prestige',
    summary: 'You turned income discipline, low drag, and compounding into early freedom.',
    spoilerSafeHint: 'Build wealth fast while keeping stress and debt under control.',
    primaryCategories: ['career', 'money', 'milestone'],
  },
  {
    id: 'sandwich-generation',
    label: 'Sandwich Generation',
    tone: 'bittersweet',
    summary: 'Parents, household load, and long-term duty shaped nearly every major financial choice.',
    spoilerSafeHint: 'Family support can become the main story.',
    primaryCategories: ['family', 'money', 'setback'],
  },
  {
    id: 'kiasu-king',
    label: 'Kiasu King / Queen',
    tone: 'comic',
    summary: 'You optimized the life plan so hard that even the spreadsheet looked tired.',
    spoilerSafeHint: 'Chase prestige, school-zone pressure, and maximum optimization.',
    primaryCategories: ['family', 'career', 'culture'],
  },
  {
    id: 'retire-in-jb',
    label: 'Retire in JB',
    tone: 'bittersweet',
    summary: 'Singapore got expensive, so the good life moved across the Causeway.',
    spoilerSafeHint: 'A late-life route for players priced out or choosing lower-cost retirement.',
    primaryCategories: ['money', 'family', 'milestone'],
  },
  {
    id: 'en-bloc-millionaire',
    label: 'En Bloc Millionaire',
    tone: 'prestige',
    summary: 'One collective-sale windfall changed the whole life plan.',
    spoilerSafeHint: 'Sometimes the biggest upside comes from where you happened to hold.',
    primaryCategories: ['market', 'home', 'money'],
  },
  {
    id: 'kena-scam',
    label: 'Kena Scam',
    tone: 'cautionary',
    summary: 'The lesson arrived dressed as opportunity, and it was expensive.',
    spoilerSafeHint: 'Risk appetite without safeguards can become the ending.',
    primaryCategories: ['setback', 'money'],
  },
  {
    id: 'migration-story',
    label: 'Migration Story',
    tone: 'bittersweet',
    summary: 'The Singapore plan stopped being the whole plan.',
    spoilerSafeHint: 'Some lives resolve by leaving, not by winning the local ladder.',
    primaryCategories: ['career', 'family', 'milestone'],
  },
  {
    id: 'paper-general',
    label: 'Paper General',
    tone: 'prestige',
    summary: 'Credential, career ladder, and institutional stability became the main asset class.',
    spoilerSafeHint: 'A stable elite career can be its own property strategy.',
    primaryCategories: ['career', 'money'],
  },
  {
    id: 'ah-beng-made-good',
    label: 'Ah Beng Made Good',
    tone: 'warm',
    summary: 'A rough start turned into a stubbornly successful Singapore comeback story.',
    spoilerSafeHint: 'Recover from weak starting conditions and build something durable.',
    primaryCategories: ['career', 'money', 'milestone'],
  },
];

export const lifetimeEndingsById = Object.fromEntries(
  lifetimeEndings.map((ending) => [ending.id, ending])
) as Record<EndingId, LifetimeEndingDefinition>;
```

- [ ] **Step 4: Run the definition test**

Run: `npm.cmd test -- src/engine/__tests__/lifetimeEndings.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/lifetimeEndings.ts src/engine/__tests__/lifetimeEndings.test.ts
git commit -m "feat: define lifetime endings"
```

---

### Task 3: Implement Ending Detection

**Files:**
- Modify: `src/engine/lifetime/endings.ts`
- Modify: `src/engine/__tests__/lifetimeEndings.test.ts`

- [ ] **Step 1: Add detector tests**

Add tests for at least three endings using the existing `Player` shape.

```ts
import { detectLifetimeEnding } from '@/engine/lifetime/endings';
import { createInitialLifeState, type Player } from '@/game/types';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Tester',
    age: 55,
    careerId: 'fresh-grad',
    salary: 8000,
    cash: 200000,
    cpfOrdinary: 100000,
    cpfSpecial: 80000,
    cpfMedisave: 60000,
    creditScore: 750,
    properties: [],
    loans: [],
    maritalStatus: 'married',
    children: 0,
    year: 2040,
    month: 1,
    turnCount: 192,
    totalNetWorth: 1000000,
    achievements: [],
    difficulty: 'normal',
    totalRentalIncome: 0,
    totalPropertySalesProfit: 0,
    bankruptcyStrikes: 0,
    life: createInitialLifeState(),
    careerGrowthModifier: 1,
    careerRiskModifier: 1,
    careerVolatilityModifier: 1,
    lastCareerReviewTurn: 0,
    nextJobSwitchTurn: 24,
    firstHomePurchased: false,
    ownedPrivateHome: false,
    careerProgressionProfile: { reviewCount: 0, lastOutcome: 'steady', lastSalaryDelta: 0, lastBonus: 0 },
    careerReviewHistory: [],
    ...overrides,
  };
}

it('detects Cash King for high-liquidity non-owners', () => {
  const result = detectLifetimeEnding(makePlayer({
    cash: 1800000,
    totalNetWorth: 2200000,
    properties: [],
    firstHomePurchased: false,
  }), 'won');

  expect(result.ending.id).toBe('cash-king');
});

it('detects Property Tycoon for broad portfolios', () => {
  const result = detectLifetimeEnding(makePlayer({
    properties: [
      { id: 'a' } as Player['properties'][number],
      { id: 'b' } as Player['properties'][number],
      { id: 'c' } as Player['properties'][number],
    ],
    totalRentalIncome: 500000,
    totalNetWorth: 5000000,
  }), 'won');

  expect(result.ending.id).toBe('property-tycoon');
});
```

- [ ] **Step 2: Run the failing detector tests**

Run: `npm.cmd test -- src/engine/__tests__/lifetimeEndings.test.ts -t "detects"`

Expected: FAIL because `detectLifetimeEnding` does not exist.

- [ ] **Step 3: Implement score-based ending detection**

Create `src/engine/lifetime/endings.ts`.

```ts
import { lifetimeEndingsById } from '@/data/lifetimeEndings';
import { difficultySettings, type EndingId, type LifeMemory, type Player } from '@/game/types';

export interface LifetimeEndingResult {
  ending: typeof lifetimeEndingsById[EndingId];
  score: number;
  reasons: string[];
  memories: LifeMemory[];
}

type RunOutcome = 'won' | 'lost';

function countMemory(player: Player, tag: string): number {
  return (player.lifeMemories ?? []).filter((memory) => memory.tags.includes(tag)).length;
}

function hasMemory(player: Player, tag: string): boolean {
  return countMemory(player, tag) > 0;
}

export function detectLifetimeEnding(player: Player, outcome: RunOutcome): LifetimeEndingResult {
  const netWorthTarget = difficultySettings[player.difficulty].targetNetWorth;
  const propertyCount = player.properties.length;
  const stress = player.life.stress;
  const householdLoad = player.life.householdLoad;
  const memories = player.lifeMemories ?? [];

  const candidates: Array<{ id: EndingId; score: number; reasons: string[] }> = [
    {
      id: 'property-tycoon',
      score: propertyCount >= 3 ? 90 + propertyCount * 5 : 0,
      reasons: [`Owned ${propertyCount} properties by the end.`],
    },
    {
      id: 'cash-king',
      score: propertyCount === 0 && player.cash >= 1000000 ? 95 : 0,
      reasons: ['Stayed liquid instead of joining the property ladder.'],
    },
    {
      id: 'negative-equity',
      score: outcome === 'lost' || player.bankruptcyStrikes >= 2 || hasMemory(player, 'negative-equity') ? 92 : 0,
      reasons: ['Financial stress became the defining lesson.'],
    },
    {
      id: 'fire-at-45',
      score: player.age <= 45 && player.totalNetWorth >= netWorthTarget && stress <= 45 ? 88 : 0,
      reasons: ['Reached the wealth target early without burning out.'],
    },
    {
      id: 'sandwich-generation',
      score: householdLoad >= 3000 || countMemory(player, 'eldercare') >= 2 ? 84 : 0,
      reasons: ['Household obligations shaped the run.'],
    },
    {
      id: 'quiet-achiever',
      score: stress <= 35 && player.bankruptcyStrikes === 0 && player.totalNetWorth >= netWorthTarget * 0.45 ? 80 : 0,
      reasons: ['Stayed stable without chasing maximum leverage.'],
    },
    {
      id: 'heartland-hero',
      score: propertyCount === 1 && player.firstHomePurchased && stress <= 55 ? 78 : 0,
      reasons: ['Built a rooted life around one practical home.'],
    },
  ];

  const fallback = outcome === 'won'
    ? { id: 'quiet-achiever' as EndingId, score: 50, reasons: ['Finished the run with a stable life.'] }
    : { id: 'negative-equity' as EndingId, score: 50, reasons: ['The run ended under financial pressure.'] };

  const winner = candidates
    .filter((candidate) => candidate.score > 0)
    .sort((a, b) => b.score - a.score)[0] ?? fallback;

  return {
    ending: lifetimeEndingsById[winner.id],
    score: winner.score,
    reasons: winner.reasons,
    memories: memories.slice(-6),
  };
}
```

- [ ] **Step 4: Run the detector tests**

Run: `npm.cmd test -- src/engine/__tests__/lifetimeEndings.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/lifetime/endings.ts src/engine/__tests__/lifetimeEndings.test.ts
git commit -m "feat: detect lifetime endings"
```

---

### Task 4: Add Life Memory Helpers

**Files:**
- Create: `src/engine/lifetime/memories.ts`
- Create: `src/engine/__tests__/lifetimeMemories.test.ts`

- [ ] **Step 1: Write memory helper tests**

```ts
import { appendLifeMemory, createLifeMemory } from '@/engine/lifetime/memories';
import { createInitialLifeState, type Player } from '@/game/types';

function makePlayer(): Player {
  return {
    name: 'Tester',
    age: 30,
    careerId: 'fresh-grad',
    salary: 5000,
    cash: 50000,
    cpfOrdinary: 30000,
    cpfSpecial: 10000,
    cpfMedisave: 10000,
    creditScore: 700,
    properties: [],
    loans: [],
    maritalStatus: 'single',
    children: 0,
    year: 2026,
    month: 5,
    turnCount: 12,
    totalNetWorth: 100000,
    achievements: [],
    difficulty: 'normal',
    totalRentalIncome: 0,
    totalPropertySalesProfit: 0,
    bankruptcyStrikes: 0,
    life: createInitialLifeState(),
    lifeMemories: [],
    careerGrowthModifier: 1,
    careerRiskModifier: 1,
    careerVolatilityModifier: 1,
    lastCareerReviewTurn: 0,
    nextJobSwitchTurn: 24,
    firstHomePurchased: false,
    ownedPrivateHome: false,
    careerProgressionProfile: { reviewCount: 0, lastOutcome: 'steady', lastSalaryDelta: 0, lastBonus: 0 },
    careerReviewHistory: [],
  };
}

it('creates deterministic memory ids from turn and tag', () => {
  const memory = createLifeMemory(makePlayer(), {
    category: 'home',
    title: 'First keys collected',
    detail: 'The starter home became real.',
    tags: ['first-home'],
  });

  expect(memory.id).toBe('memory-12-first-home');
  expect(memory.year).toBe(2026);
  expect(memory.month).toBe(5);
});

it('dedupes memories by id', () => {
  const player = makePlayer();
  const first = appendLifeMemory(player, {
    category: 'home',
    title: 'First keys collected',
    detail: 'The starter home became real.',
    tags: ['first-home'],
  });
  const second = appendLifeMemory(first, {
    category: 'home',
    title: 'First keys collected',
    detail: 'The starter home became real.',
    tags: ['first-home'],
  });

  expect(second.lifeMemories).toHaveLength(1);
});
```

- [ ] **Step 2: Run the failing memory tests**

Run: `npm.cmd test -- src/engine/__tests__/lifetimeMemories.test.ts`

Expected: FAIL because `src/engine/lifetime/memories.ts` does not exist.

- [ ] **Step 3: Implement memory helpers**

Create `src/engine/lifetime/memories.ts`.

```ts
import type { LifeMemory, LifeMemoryCategory, Player } from '@/game/types';

export interface LifeMemoryDraft {
  category: LifeMemoryCategory;
  title: string;
  detail: string;
  tags: string[];
  scoreImpact?: number;
}

export function createLifeMemory(player: Player, draft: LifeMemoryDraft): LifeMemory {
  const primaryTag = draft.tags[0] ?? draft.category;

  return {
    id: `memory-${player.turnCount}-${primaryTag}`,
    turn: player.turnCount,
    year: player.year,
    month: player.month,
    category: draft.category,
    title: draft.title,
    detail: draft.detail,
    tags: draft.tags,
    scoreImpact: draft.scoreImpact,
  };
}

export function appendLifeMemory(player: Player, draft: LifeMemoryDraft): Player {
  const nextMemory = createLifeMemory(player, draft);
  const existing = player.lifeMemories ?? [];

  if (existing.some((memory) => memory.id === nextMemory.id)) return player;

  return {
    ...player,
    lifeMemories: [...existing, nextMemory].slice(-80),
  };
}
```

- [ ] **Step 4: Run the memory tests**

Run: `npm.cmd test -- src/engine/__tests__/lifetimeMemories.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/engine/lifetime/memories.ts src/engine/__tests__/lifetimeMemories.test.ts
git commit -m "feat: add life memory helpers"
```

---

### Task 5: Record Memories From Existing Gameplay

**Files:**
- Modify: `src/engine/actions.ts`
- Modify: `src/engine/turn.ts`
- Test: `src/engine/__tests__/actions.test.ts`
- Test: `src/engine/__tests__/turn.test.ts`

- [ ] **Step 1: Add purchase memory test**

In `src/engine/__tests__/actions.test.ts`, extend the successful purchase test or add a focused test that expects a `first-home` memory after the first buy.

```ts
expect(result.ok).toBe(true);
expect(result.value.player.lifeMemories?.some((memory) => memory.tags.includes('first-home'))).toBe(true);
```

- [ ] **Step 2: Add turn memory test**

In `src/engine/__tests__/turn.test.ts`, add a test for high-stress monthly memory.

```ts
const result = advanceTurn(makePlayer({
  life: createInitialLifeState({ stress: 88 }),
}), market, settings, 123);

expect(result.player.lifeMemories?.some((memory) => memory.tags.includes('burnout-warning'))).toBe(true);
```

- [ ] **Step 3: Run the failing gameplay memory tests**

Run: `npm.cmd test -- src/engine/__tests__/actions.test.ts src/engine/__tests__/turn.test.ts -t "memory|burnout|first-home"`

Expected: FAIL because gameplay does not record those memories yet.

- [ ] **Step 4: Record memories in purchase and turn flows**

In `src/engine/actions.ts`, after a successful first property purchase, wrap the updated player:

```ts
nextPlayer = appendLifeMemory(nextPlayer, {
  category: 'home',
  title: 'First keys collected',
  detail: `${property.name} became the first home in this Singapore life.`,
  tags: ['first-home', property.type.toLowerCase().replace(/\s+/g, '-')],
  scoreImpact: 12,
});
```

In `src/engine/turn.ts`, after life month resolution and before returning the new player:

```ts
if (newPlayer.life.stress >= 85) {
  newPlayer = appendLifeMemory(newPlayer, {
    category: 'setback',
    title: 'Burnout warning',
    detail: 'The month ended with stress near breaking point.',
    tags: ['burnout-warning', 'stress'],
    scoreImpact: -6,
  });
}
```

Use existing local variable names in the target files; do not introduce duplicate `const newPlayer` declarations if the function currently mutates a `let`.

- [ ] **Step 5: Run the gameplay memory tests**

Run: `npm.cmd test -- src/engine/__tests__/actions.test.ts src/engine/__tests__/turn.test.ts -t "memory|burnout|first-home"`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/engine/actions.ts src/engine/turn.ts src/engine/__tests__/actions.test.ts src/engine/__tests__/turn.test.ts
git commit -m "feat: record lifetime memories from gameplay"
```

---

### Task 6: Upgrade Game Over Into Life Summary

**Files:**
- Modify: `src/pages/GameOver.tsx`
- Test: create or extend a page-level test if the repo has existing page test patterns.

- [ ] **Step 1: Add rendering expectations**

Add a focused render test if page tests are available, or cover through a Playwright smoke script after implementation. The screen must render:

```text
This was your Singapore life
Named ending label
Why you got this ending
Recent life memories
Final net worth
Replay call to action
```

- [ ] **Step 2: Implement the summary render**

Use `detectLifetimeEnding(player, won ? 'won' : 'lost')` in `src/pages/GameOver.tsx`.

Render the ending before the numeric score:

```tsx
const lifetimeEnding = detectLifetimeEnding(player, won ? 'won' : 'lost');

<p className="label-text text-[11px] text-cyan-glow">This was your Singapore life</p>
<h1 className="font-display text-4xl text-white">{lifetimeEnding.ending.label}</h1>
<p className="mx-auto mt-3 max-w-2xl text-sm text-text-muted">{lifetimeEnding.ending.summary}</p>
```

Render reasons and memories below the score:

```tsx
{lifetimeEnding.reasons.map((reason) => (
  <li key={reason}>{reason}</li>
))}

{lifetimeEnding.memories.map((memory) => (
  <article key={memory.id}>
    <p className="label-text text-[10px] text-text-dim">{memory.year}.{String(memory.month).padStart(2, '0')}</p>
    <h3>{memory.title}</h3>
    <p>{memory.detail}</p>
  </article>
))}
```

- [ ] **Step 3: Run focused verification**

Run: `npm.cmd test -- src/engine/__tests__/lifetimeEndings.test.ts src/engine/__tests__/lifetimeMemories.test.ts`

Expected: PASS.

Run: `npm.cmd run build`

Expected: PASS, with only existing non-blocking bundle-size warnings if present.

- [ ] **Step 4: Commit**

```bash
git add src/pages/GameOver.tsx
git commit -m "feat: show lifetime ending summary"
```

---

### Task 7: Add Local Run History

**Files:**
- Modify: `src/game/useGameStore.ts`
- Modify: `src/game/savePersistence.ts`
- Modify: `src/data/saveSchema.ts`
- Modify: `src/game/saveMigrations.ts`
- Test: `src/game/__tests__/savePersistence.test.ts`
- Test: `src/game/__tests__/saveMigrations.test.ts`

- [ ] **Step 1: Add save-schema tests**

Extend save persistence tests so a state with `lifeMemories` and `endingCollection` round-trips through serialization.

```ts
const state = makeState();
state.player.lifeMemories = [{
  id: 'memory-1-first-home',
  turn: 1,
  year: 2026,
  month: 5,
  category: 'home',
  title: 'First keys collected',
  detail: 'The starter home became real.',
  tags: ['first-home'],
}];
state.player.endingCollection = {
  unlockedEndingIds: ['heartland-hero'],
  runHistory: [],
};

const parsed = parseStoredGameState(serializeGameState(state));

expect(parsed?.player.lifeMemories).toHaveLength(1);
expect(parsed?.player.endingCollection?.unlockedEndingIds).toContain('heartland-hero');
```

- [ ] **Step 2: Run the failing persistence tests**

Run: `npm.cmd test -- src/game/__tests__/savePersistence.test.ts src/game/__tests__/saveMigrations.test.ts`

Expected: FAIL if schema rejects the new fields.

- [ ] **Step 3: Update schema and migration**

Add zod schemas for `LifeMemory`, `LifetimeRunRecord`, and `EndingCollectionState` in `src/data/saveSchema.ts`, then make the fields optional for backward compatibility.

Bump `SAVE_VERSION` in `src/engine/constants.ts` only if strict validation requires a migration. If optional fields hydrate correctly through `withLifetimeDefaults`, keep the current save version.

- [ ] **Step 4: Run persistence tests**

Run: `npm.cmd test -- src/game/__tests__/savePersistence.test.ts src/game/__tests__/saveMigrations.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/data/saveSchema.ts src/game/savePersistence.ts src/game/saveMigrations.ts src/game/__tests__/savePersistence.test.ts src/game/__tests__/saveMigrations.test.ts
git commit -m "feat: persist lifetime run history"
```

---

### Task 8: Reframe Dashboard As A Life Goal

**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/dashboard/panels/*.tsx` if the current dashboard structure already owns the relevant card.
- Test: existing dashboard or command-center tests.

- [ ] **Step 1: Add dashboard copy expectation**

Extend the dashboard smoke or component test to expect the phrase:

```text
Your Singapore life
```

- [ ] **Step 2: Update the dashboard framing**

Add a small card near the top of the dashboard that maps the existing route to a life goal:

```tsx
<p className="label-text text-[10px] text-cyan-glow">Your Singapore life</p>
<h2 className="font-display text-2xl text-white">{runArc.route.label}</h2>
<p className="text-sm text-text-muted">
  This run is still powered by CPF, MOP, taxes, loans, and market cycles. The new goal is to discover what kind of life those choices create.
</p>
```

Keep this compact. Do not add another large dashboard list.

- [ ] **Step 3: Run dashboard-related tests**

Run: `npm.cmd test -- src/engine/__tests__/commandCenter.test.ts src/engine/__tests__/lifeCampaign.test.ts`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Dashboard.tsx src/pages/dashboard/panels src/engine/__tests__/commandCenter.test.ts src/engine/__tests__/lifeCampaign.test.ts
git commit -m "feat: frame dashboard around life goals"
```

---

### Task 9: Full Verification And Docs

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/roadmap/singapore-a-lifetime-roadmap.md` phase status line when `Lifetime Shell v1` ships.

- [ ] **Step 1: Run full automated checks**

Run: `npm.cmd test`

Expected: all tests pass.

Run: `npm.cmd run lint`

Expected: pass.

Run: `npm.cmd run build`

Expected: pass.

- [ ] **Step 2: Run browser playtest smoke**

Run: `npm.cmd run test:smoke`

Expected: smoke test reaches new game, dashboard, properties, purchase path, portfolio, and game-over without console errors.

- [ ] **Step 3: Update README only with shipped behavior**

Add a short shipped-feature note under `Gameplay` after the feature exists:

```md
The game is gradually evolving toward **Singapore: A Lifetime**: a life-tycoon wrapper over the existing property engine. Current shipped lifetime features include named endings, life memories, and a life-summary finish screen; planned future phases live in [docs/roadmap/singapore-a-lifetime-roadmap.md](docs/roadmap/singapore-a-lifetime-roadmap.md).
```

- [ ] **Step 4: Update changelog**

Add under `[Unreleased]`:

```md
### Added
- **Lifetime Shell v1**: named endings, life memories, and life-summary game-over framing so runs end as a Singapore life story instead of only a net-worth result.
```

- [ ] **Step 5: Commit**

```bash
git add README.md CHANGELOG.md docs/roadmap/singapore-a-lifetime-roadmap.md
git commit -m "docs: document lifetime shell release"
```

---

## Plan Self-Review

Spec coverage:

- Named endings are covered by Tasks 2, 3, and 6.
- Emotional narrative arc is covered by Tasks 4, 5, 6, and 8.
- Net-worth-only win is softened by Task 6 while retaining score context.
- Replay identity starts with ending collection in Tasks 1 and 7.
- README gradual update policy is covered in Task 9 and the roadmap documentation policy.

Deferred from v1:

- Full causal scenario weighting belongs to Phase 2.
- Life Actions 2.0 belongs to Phase 3.
- Cultural texture pack belongs to Phase 4.
- Full MOP Home Season belongs to Phase 5.
- Family Light and multi-generation handoff belong to later phases after one-life endings feel good.

Placeholder scan:

- The plan contains no empty markers, no incomplete sections, and no unassigned "write tests" instructions.

Type consistency:

- `EndingId`, `LifeMemory`, `LifetimeRunRecord`, and `EndingCollectionState` are introduced before use.
- Ending detection reads existing `Player` fields and optional lifetime fields.
- Memory helpers return `Player` to fit existing pure-engine update patterns.
