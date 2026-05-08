# MOP 2.4 Target Urgency Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make MOP more fun by turning the next-home plan into a clearer chase with target rivalry, payoff moments, and smarter skip stops.

**Architecture:** Add one derived engine module for target rivalry and one derived helper for payoff milestones, then thread those signals into the dashboard, recap notes, and notable-month snapshot logic. Keep everything derived from current player state so save migrations are unnecessary.

**Tech Stack:** React 19, TypeScript, Zustand, Vitest, Vite

---

### Task 1: Target rivalry engine

**Files:**
- Create: `src/engine/ownershipTargets.ts`
- Test: `src/engine/__tests__/ownershipTargets.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('picks a lead target and challenger from the shortlist with useful urgency labels', () => {
  const race = getOwnershipTargetRace(playerWithTwoTargets);
  expect(race.active).toBe(true);
  expect(race.lead.propertyId).toBe('ec-1');
  expect(race.challenger).not.toBeNull();
  expect(['Window Open', 'Watch Closely', 'Stretch', 'Drifting']).toContain(race.lead.urgencyLabel);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- ownershipTargets`
Expected: FAIL because `ownershipTargets.ts` does not exist yet

- [ ] **Step 3: Write minimal implementation**

Create a pure module that derives:

```ts
export interface OwnershipTargetRaceTarget {
  propertyId: string;
  name: string;
  route: string;
  price: number;
  readinessPct: number;
  urgencyLabel: 'Window Open' | 'Watch Closely' | 'Stretch' | 'Drifting';
  fitLabel: string;
}

export interface OwnershipTargetRace {
  active: boolean;
  lead: OwnershipTargetRaceTarget | null;
  challenger: OwnershipTargetRaceTarget | null;
  summary: string | null;
  notableKey: string | null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test -- ownershipTargets`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/ownershipTargets.ts src/engine/__tests__/ownershipTargets.test.ts
git commit -m "feat: add ownership target rivalry engine"
```

### Task 2: Payoff milestone detection

**Files:**
- Create: `src/engine/ownershipPayoffs.ts`
- Test: `src/engine/__tests__/ownershipPayoffs.test.ts`
- Modify: `src/engine/turn.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('detects when reserve-secured or shortlist-locked is newly reached', () => {
  const payoffs = getOwnershipPayoffTransitions(beforePlayer, afterPlayer);
  expect(payoffs.some((payoff) => payoff.id === 'reserve-secured')).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- ownershipPayoffs`
Expected: FAIL because `ownershipPayoffs.ts` does not exist yet

- [ ] **Step 3: Write minimal implementation**

Create a pure transition helper and call it from `advanceTurn()` so the current month recap can gain short payoff notes like:

```ts
'Reserve secured: the home can absorb small shocks more safely now.'
'Shortlist locked: you now have a real next-home race instead of open-ended browsing.'
'Lead target reachable: the numbers now support a serious move soon.'
```

- [ ] **Step 4: Run targeted tests**

Run: `npm.cmd test -- ownershipPayoffs turnRecap`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/engine/ownershipPayoffs.ts src/engine/__tests__/ownershipPayoffs.test.ts src/engine/turn.ts
git commit -m "feat: add ownership payoff moments"
```

### Task 3: Dashboard rivalry UI

**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/dashboard/panels/NextHomeGatewayPanel.tsx`
- Modify: `src/pages/dashboard/panels/OwnershipForksPanel.tsx`

- [ ] **Step 1: Write a failing UI-facing test if one exists for the panel logic**

If no panel test exists, use the engine tests above as the safety net and keep the UI changes minimal.

- [ ] **Step 2: Add rivalry data flow**

Read the target-rivalry engine in `Dashboard.tsx` and pass it to the next-home panel.

- [ ] **Step 3: Render the new UI**

Add:

```tsx
<TargetRaceSummary
  lead={targetRace.lead}
  challenger={targetRace.challenger}
  summary={targetRace.summary}
  nextPayoffLabel={nextPayoffLabel}
/>
```

- [ ] **Step 4: Verify with build**

Run: `npm.cmd run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/Dashboard.tsx src/pages/dashboard/panels/NextHomeGatewayPanel.tsx src/pages/dashboard/panels/OwnershipForksPanel.tsx
git commit -m "feat: surface next-home rivalry in dashboard"
```

### Task 4: Rivalry-aware notable-month stopping

**Files:**
- Modify: `src/game/useGameStore.ts`
- Test: `src/game/__tests__/useGameStore.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('treats target-rivalry changes as notable-month stop signals', () => {
  expect(isNotableMonthSignal(snapshotA, snapshotB)).toBe(true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- useGameStore`
Expected: FAIL with missing rivalry key handling

- [ ] **Step 3: Implement the snapshot change**

Include rivalry key and payoff key in `getNotableMonthSnapshot()` and treat either change as a stopping condition.

- [ ] **Step 4: Run targeted test**

Run: `npm.cmd test -- useGameStore`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/game/useGameStore.ts src/game/__tests__/useGameStore.test.ts
git commit -m "feat: stop on rivalry and payoff signals"
```

### Task 5: Final verification and docs

**Files:**
- Modify: `README.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Update docs**

Document the new `MOP 2.4` target-rivalry and payoff behavior in the README and changelog.

- [ ] **Step 2: Run full verification**

Run:

```bash
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run test:smoke
npm.cmd run test:scroll
```

Expected: all PASS

- [ ] **Step 3: Commit**

```bash
git add README.md CHANGELOG.md
git commit -m "docs: update MOP 2.4 documentation"
```
