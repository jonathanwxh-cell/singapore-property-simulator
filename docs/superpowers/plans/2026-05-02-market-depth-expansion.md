# Market Depth Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand the game from a small fixed catalog into a broader, more strategic Singapore property market with fuller district coverage, richer ownership decisions, and portfolio-aware content.

**Architecture:** Keep the existing React + Zustand + data-driven architecture, but add a thin market-domain layer between static data and UI rendering. Use curated data for signature listings and template-backed metadata for scalable listing expansion, while preserving save compatibility and the existing store flow.

**Tech Stack:** React 19, TypeScript, Zustand, React Router, Vitest, ESLint, Vite

---

## File Structure

### Core data and market domain

- Create: `src/data/propertyArchetypes.ts`
- Create: `src/data/listingChannels.ts`
- Create: `src/engine/listings.ts`
- Modify: `src/data/properties.ts`
- Modify: `src/data/districts.ts`
- Modify: `src/game/types.ts`

### Ownership and monthly simulation

- Create: `src/engine/portfolio.ts`
- Modify: `src/engine/actions.ts`
- Modify: `src/engine/turn.ts`
- Modify: `src/engine/selectors.ts`
- Modify: `src/game/useGameStore.ts`

### UI surfaces

- Modify: `src/pages/Properties.tsx`
- Modify: `src/pages/PropertyDetail.tsx`
- Modify: `src/pages/Portfolio.tsx`
- Modify: `src/pages/Market.tsx`
- Modify: `src/index.css`

### Scenarios and progression

- Create: `src/engine/scenarioContext.ts`
- Modify: `src/data/scenarios.ts`
- Modify: `src/engine/achievementRules.ts`
- Modify: `src/data/achievements.ts`

### Tests

- Create: `src/engine/__tests__/listings.test.ts`
- Create: `src/engine/__tests__/portfolio.test.ts`
- Create: `src/engine/__tests__/scenarioContext.test.ts`
- Update: `src/engine/__tests__/actions.test.ts`
- Update: `src/engine/__tests__/turn.test.ts`
- Update: `src/game/__tests__/useGameStore.test.ts`

---

### Task 1: Introduce scalable listing metadata

**Files:**

- Create: `src/data/propertyArchetypes.ts`
- Create: `src/data/listingChannels.ts`
- Create: `src/engine/listings.ts`
- Modify: `src/data/properties.ts`
- Test: `src/engine/__tests__/listings.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { buildListingSummary, getListingsByDistrict } from '../listings';

describe('listing catalog', () => {
  it('covers every defined district with at least two listings', () => {
    const coverage = buildListingSummary();
    expect(coverage.totalListings).toBeGreaterThanOrEqual(80);
    expect(coverage.uncoveredDistrictIds).toEqual([]);
    expect(coverage.districtsWithSingleListing).toEqual([]);
  });

  it('returns multiple listings for district 22 after expansion', () => {
    const listings = getListingsByDistrict(22);
    expect(listings.length).toBeGreaterThanOrEqual(2);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/listings.test.ts`

Expected: FAIL because `listings.ts` does not exist and district coverage is incomplete.

- [ ] **Step 3: Write minimal implementation**

```ts
export type ListingChannel = 'New Launch' | 'Resale' | 'Auction' | 'Distressed' | 'Off-Market' | 'Signature';

export interface PropertyArchetype {
  id: string;
  label: string;
  channel: ListingChannel;
  rarity: 'common' | 'premium' | 'signature';
}

export function getListingsByDistrict(districtId: number) {
  return properties.filter((property) => property.districtId === districtId);
}

export function buildListingSummary() {
  const districtIds = districts.map((district) => district.id);
  const byDistrict = districtIds.map((districtId) => getListingsByDistrict(districtId));
  return {
    totalListings: properties.length,
    uncoveredDistrictIds: districtIds.filter((districtId) => getListingsByDistrict(districtId).length === 0),
    districtsWithSingleListing: districtIds.filter((districtId) => getListingsByDistrict(districtId).length === 1),
    byDistrict,
  };
}
```

- [ ] **Step 4: Expand the catalog**

Add at least `46` new entries to `src/data/properties.ts` with these targets:

- every district has at least `2` listings
- every region has budget, mid-tier, and aspirational choices
- at least `8` listings use non-default channels like `Auction`, `Distressed`, `Off-Market`, or `Signature`

Each new listing should include:

```ts
channel: 'Resale',
rarity: 'common',
archetypeId: 'ocr-family-condo',
```

- [ ] **Step 5: Run tests and commit**

Run:

```bash
npx vitest run src/engine/__tests__/listings.test.ts
npm.cmd run lint
```

Commit:

```bash
git add src/data/propertyArchetypes.ts src/data/listingChannels.ts src/engine/listings.ts src/data/properties.ts src/engine/__tests__/listings.test.ts
git commit -m "feat: expand market inventory and listing metadata"
```

### Task 2: Add ownership state and carrying costs

**Files:**

- Modify: `src/game/types.ts`
- Create: `src/engine/portfolio.ts`
- Modify: `src/engine/actions.ts`
- Modify: `src/engine/turn.ts`
- Modify: `src/engine/selectors.ts`
- Test: `src/engine/__tests__/portfolio.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { advancePortfolioMonth } from '../portfolio';

describe('portfolio operating costs', () => {
  it('applies maintenance, tax, and vacancy drag to owned properties', () => {
    const result = advancePortfolioMonth(samplePlayerWithVacantProperty);
    expect(result.monthlyCosts.propertyTax).toBeGreaterThan(0);
    expect(result.monthlyCosts.maintenance).toBeGreaterThan(0);
    expect(result.updatedProperties[0].vacancyMonths).toBe(1);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/portfolio.test.ts`

Expected: FAIL because `portfolio.ts` and new ownership fields do not exist.

- [ ] **Step 3: Extend the owned property model**

Add fields to `OwnedProperty` in `src/game/types.ts`:

```ts
occupancyStatus: 'vacant' | 'tenanted' | 'renovating' | 'listed';
tenantQuality: number;
vacancyMonths: number;
maintenanceCost: number;
propertyTax: number;
listingChannel?: string;
```

Create `advancePortfolioMonth()` in `src/engine/portfolio.ts`:

```ts
export function advancePortfolioMonth(player: Player) {
  const updatedProperties = player.properties.map((property) => ({
    ...property,
    vacancyMonths: property.isRented ? 0 : property.vacancyMonths + 1,
  }));

  const monthlyCosts = {
    maintenance: updatedProperties.reduce((sum, property) => sum + property.maintenanceCost, 0),
    propertyTax: updatedProperties.reduce((sum, property) => sum + property.propertyTax, 0),
  };

  return { updatedProperties, monthlyCosts };
}
```

- [ ] **Step 4: Wire the monthly simulation**

Update `buyPropertyPure()` and `toggleRental()` so new assets start with operational state:

```ts
occupancyStatus: 'vacant',
tenantQuality: 50,
vacancyMonths: 0,
maintenanceCost: Math.round(property.price * 0.0008),
propertyTax: Math.round(property.price * 0.0006),
```

Update `advanceTurn()` so monthly cashflow subtracts carrying costs before final cash calculation.

- [ ] **Step 5: Run tests and commit**

Run:

```bash
npx vitest run src/engine/__tests__/portfolio.test.ts src/engine/__tests__/turn.test.ts
npm.cmd test
```

Commit:

```bash
git add src/game/types.ts src/engine/portfolio.ts src/engine/actions.ts src/engine/turn.ts src/engine/selectors.ts src/engine/__tests__/portfolio.test.ts src/engine/__tests__/turn.test.ts
git commit -m "feat: add portfolio operating state and monthly costs"
```

### Task 3: Upgrade the property browser into a real market surface

**Files:**

- Modify: `src/pages/Properties.tsx`
- Modify: `src/pages/PropertyDetail.tsx`
- Modify: `src/index.css`
- Test: `src/game/__tests__/propertyBrowser.test.tsx`

- [ ] **Step 1: Write the failing UI test**

```tsx
import { render, screen } from '@testing-library/react';
import Properties from '@/pages/Properties';

it('shows channel filters and district coverage summaries', () => {
  render(<Properties />);
  expect(screen.getByText('All Channels')).toBeInTheDocument();
  expect(screen.getByText(/district coverage/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/__tests__/propertyBrowser.test.tsx`

Expected: FAIL because the current browser only exposes search, type, and region filters.

- [ ] **Step 3: Add richer market UI**

Add a channel filter state:

```tsx
const [channelFilter, setChannelFilter] = useState<string>('all');
```

Add result badges on cards:

```tsx
<span className="listing-chip">{property.channel}</span>
<span className="listing-chip listing-chip--rarity">{property.rarity}</span>
```

Add a market summary block above the grid:

```tsx
<GlassCard>
  <p className="label-text">District Coverage</p>
  <p className="font-mono text-white">{coveredDistricts}/{districts.length}</p>
</GlassCard>
```

- [ ] **Step 4: Enrich the property detail page**

Add a "Why this asset matters" section showing:

- district theme
- channel
- yield tier
- appreciation vs income hint

Example:

```tsx
<div className="space-y-2">
  <p className="text-text-secondary text-sm">Channel: {property.channel}</p>
  <p className="text-text-secondary text-sm">Playstyle: {district.region === 'OCR' ? 'Yield / upgrader' : 'Prestige / appreciation'}</p>
</div>
```

- [ ] **Step 5: Run tests and commit**

Run:

```bash
npx vitest run src/game/__tests__/propertyBrowser.test.tsx
npm.cmd run build
```

Commit:

```bash
git add src/pages/Properties.tsx src/pages/PropertyDetail.tsx src/index.css src/game/__tests__/propertyBrowser.test.tsx
git commit -m "feat: turn property browser into a fuller market surface"
```

### Task 4: Make scenarios portfolio-aware

**Files:**

- Create: `src/engine/scenarioContext.ts`
- Modify: `src/data/scenarios.ts`
- Modify: `src/game/useGameStore.ts`
- Test: `src/engine/__tests__/scenarioContext.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { getEligibleScenarios } from '../scenarioContext';

describe('scenario context', () => {
  it('filters tenant issues when the player has no rented assets', () => {
    const eligible = getEligibleScenarios(playerWithoutRentals);
    expect(eligible.some((scenario) => scenario.id === 'tenant-default')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/engine/__tests__/scenarioContext.test.ts`

Expected: FAIL because all scenarios are currently globally eligible.

- [ ] **Step 3: Add scenario guards**

Create scenario context helpers:

```ts
export function getEligibleScenarios(player: Player) {
  return scenarios.filter((scenario) => {
    if (scenario.id === 'tenant-default') return player.properties.some((property) => property.isRented);
    if (scenario.id === 'lease-top-up') return player.properties.some((property) => property.purchasePrice > 0);
    return true;
  });
}
```

Extend the scenario data shape with optional guard metadata:

```ts
requires?: 'rented-property' | 'owned-property' | 'aging-leasehold' | 'premium-district';
```

- [ ] **Step 4: Use the eligible scenario pool in turn advancement**

Update `advanceTurn()` to pick from `getEligibleScenarios(player)` instead of the entire `scenarios` array.

- [ ] **Step 5: Run tests and commit**

Run:

```bash
npx vitest run src/engine/__tests__/scenarioContext.test.ts src/engine/__tests__/turn.test.ts
npm.cmd test
```

Commit:

```bash
git add src/engine/scenarioContext.ts src/data/scenarios.ts src/game/useGameStore.ts src/engine/__tests__/scenarioContext.test.ts src/engine/__tests__/turn.test.ts
git commit -m "feat: make scenarios portfolio-aware"
```

### Task 5: Expand progression routes and achievements

**Files:**

- Modify: `src/data/achievements.ts`
- Modify: `src/engine/achievementRules.ts`
- Modify: `src/pages/Portfolio.tsx`
- Test: `src/game/__tests__/useGameStore.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
it('unlocks heartland landlord after owning three OCR HDB assets', () => {
  const player = buildHeartlandLandlordPlayer();
  const evaluated = withEvaluatedAchievements(player);
  expect(evaluated.achievements).toContain('hdb-heartland');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/__tests__/useGameStore.test.ts`

Expected: FAIL if the supporting route summaries and richer progression surfacing are not present.

- [ ] **Step 3: Add explicit strategy routes**

Add new achievements such as:

```ts
{
  id: 'commercial-operator',
  name: 'Commercial Operator',
  description: 'Own 3 commercial assets at the same time.',
  condition: 'commercial_count >= 3',
  icon: 'Briefcase',
  tier: 'gold',
  points: 1200,
  secret: false,
}
```

Update the portfolio page with a route summary card:

```tsx
<GlassCard>
  <p className="label-text">Current Route</p>
  <p className="font-rajdhani text-white">Heartland Yield Builder</p>
</GlassCard>
```

- [ ] **Step 4: Make progression visible**

Add grouped achievement strips in `Portfolio.tsx`:

- wealth
- district mastery
- rental and operating mastery
- prestige collection

- [ ] **Step 5: Run tests and commit**

Run:

```bash
npx vitest run src/game/__tests__/useGameStore.test.ts
npm.cmd run lint
```

Commit:

```bash
git add src/data/achievements.ts src/engine/achievementRules.ts src/pages/Portfolio.tsx src/game/__tests__/useGameStore.test.ts
git commit -m "feat: add fuller empire routes and progression goals"
```

### Task 6: Finish with market-page intelligence and release QA

**Files:**

- Modify: `src/pages/Market.tsx`
- Modify: `README.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add a failing UI smoke test**

```tsx
it('shows market movers and district opportunity summaries', () => {
  render(<Market />);
  expect(screen.getByText(/market movers/i)).toBeInTheDocument();
  expect(screen.getByText(/district opportunities/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/game/__tests__/marketPage.test.tsx`

Expected: FAIL because the current market page is mostly passive metrics.

- [ ] **Step 3: Add the final market intelligence panels**

Add panels like:

```tsx
<GlassCard>
  <h3 className="section-title text-white mb-4">Market Movers</h3>
  <p className="text-text-secondary text-sm">Top districts by yield pressure, appreciation heat, and affordability.</p>
</GlassCard>
```

Add a district opportunities list driven by `districts` and `properties`.

- [ ] **Step 4: Backfill docs**

Update `README.md` to reflect:

- broader listing coverage
- ownership operating states
- portfolio-aware scenarios

Update `CHANGELOG.md` with a new entry for the expansion work.

- [ ] **Step 5: Final verification and commit**

Run:

```bash
npm.cmd test
npm.cmd run lint
npm.cmd run build
```

Manual QA:

- browse all regions and channels
- confirm every district has listings
- buy at least one budget listing and one premium listing
- verify monthly costs reduce cash correctly
- verify tenant-specific scenarios only appear with rented assets
- verify strategy route summaries update in portfolio

Commit:

```bash
git add src/pages/Market.tsx README.md CHANGELOG.md
git commit -m "feat: ship fuller market intelligence and release docs"
```

## Self-Review

### Spec coverage

This plan covers:

- listing count expansion
- district coverage completion
- acquisition channel structure
- ownership lifecycle depth
- portfolio-aware scenarios
- stronger progression identities
- fuller browser, market, and portfolio surfaces

### Placeholder scan

No `TODO` or `TBD` markers are left in the plan. Each task identifies files, tests, and commit boundaries.

### Scope check

This is still a large effort. The recommended execution order is:

1. Task 1
2. Task 3
3. Task 2
4. Task 4
5. Task 5
6. Task 6

That order front-loads the most visible improvements without blocking later depth work.
