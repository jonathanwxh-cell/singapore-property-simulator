# Property Operations Expansion Design

## Purpose

The simulator already teaches affordability, CPF, stamp duty, TDSR/MSR, career progression, listing discovery, and basic ownership. The missing layer is what happens after a player buys a property: how they improve it, rent it, maintain it, absorb surprises, and diversify once they are no longer just saving for the first home.

This spec turns the requested ideas into a staged "property operations" expansion. The core fantasy is: buy a Singapore property, operate it like an owner, make tradeoffs, and learn why yield, reserves, tenant quality, renovation ROI, and diversification matter.

## Design Principles

- Every post-purchase action should show a projected cash impact, rental impact, resale impact, risk impact, and time cost before the player confirms.
- Systems should stay readable. Use 2-3 choices per decision rather than spreadsheet-grade controls.
- Singapore realism should be simplified but recognizable: HDB MOP, room rental before whole-unit rental, EC/private ownership gates, conservancy/MCST-like carrying costs, landlord insurance, and tenant demand by district/property type.
- Early-game should not feel like waiting. The player should get small monthly/quarterly decisions even before they can buy another property.
- Add depth first, then 3D. Use floor-plan and room cards before heavier Three.js/R3F work.

## MVP Recommendation

Build this in four stages:

1. **Property Operations Lite**: interactive renovations, tenant management, maintenance events, emergency reserve.
2. **Visualization and Milestones**: floor-plan cards, room upgrade visuals, quarterly operations reviews, faster mini-goals.
3. **Diversification Layer**: REITs, T-bills/SSB-like cash parking, overseas property fund, risk-adjusted portfolio scoring.
4. **Social Layer**: local leaderboard upgrade, portfolio share cards, optional remote leaderboard later.

This order is deliberate: renovations and tenants make owned properties more fun immediately. Visualization makes those decisions feel personal. Broader investments and social comparison should come after the core property operations loop is stable.

## Feature 1: Interactive Renovations and Upgrades

### Player Experience

On each owned property detail page, the player gets an **Upgrade Plan** panel with 3-5 project cards depending on property type:

- Kitchen refresh: medium cost, good rental uplift, modest resale uplift.
- Bathroom refresh: medium cost, strong tenant satisfaction uplift, modest resale uplift.
- Flooring and paint: low cost, fast completion, small rent/resale bump.
- Smart-home package: low/medium cost, better appeal for condo/CCR/RCR tenants.
- Layout optimization: high cost, higher resale impact, riskier for HDB/older leasehold.
- Commercial fit-out: commercial-only, raises rent but increases vacancy if overbuilt.

Each card shows:

- Cost
- Duration in months
- Expected monthly rent uplift
- Expected resale value uplift
- Tenant satisfaction uplift
- Risk band
- Best-fit strategy, such as "yield", "flip", "stability", or "luxury"

### Mechanics

Replace the current single `renovationLevel` mechanic with project-based renovation state:

```ts
type RenovationCategory =
  | 'kitchen'
  | 'bathroom'
  | 'flooring'
  | 'smart-home'
  | 'layout'
  | 'commercial-fitout'
  | 'maintenance-overhaul';

interface RenovationProject {
  id: string;
  propertyId: string;
  category: RenovationCategory;
  label: string;
  cost: number;
  durationMonths: number;
  remainingMonths: number;
  rentUpliftPct: number;
  resaleUpliftPct: number;
  satisfactionUplift: number;
  riskPct: number;
  status: 'planned' | 'active' | 'completed' | 'overrun' | 'cancelled';
}
```

The player can run one active renovation per property. During renovation, occupancy becomes `renovating`; whole-unit rental pauses unless the renovation is minor. When the project completes, value/rent/satisfaction changes apply permanently.

### ROI Teaching

After completion, show an outcome card:

- "You spent S$18,000."
- "Monthly rent rose by S$140."
- "Estimated payback: 129 months."
- "Resale value rose by S$24,000."
- "Net estimated ROI: positive if held 3+ years."

This is the main educational loop: not every attractive renovation is financially smart.

## Feature 2: Dynamic Tenant Management

### Player Experience

The current rent toggle should become a **Rent Strategy** flow:

1. Choose rental mode.
2. Set asking rent strategy.
3. Select a tenant profile.
4. Manage satisfaction and renewal risk over time.

Rental modes:

- Owner-occupied room rental: available for eligible HDB before MOP, lower income, lower vacancy, requires player "living arrangement" compatibility.
- Whole-unit rental: unlocked after MOP for HDB; always available for private/commercial simplified rules.
- Corporate lease: higher rent, more demanding, stronger for prime/RCR/office properties.
- Student/shared rental: lower stability, higher wear, useful near universities and fringe districts.

Rent strategies:

- Conservative: lower rent, high occupancy, satisfaction bonus.
- Market: balanced rent and vacancy risk.
- Aggressive: higher rent, higher vacancy/default risk and satisfaction drag.

Tenant profiles:

- Local family: stable, rent-sensitive, low maintenance risk.
- Expat PMET: pays more in prime/RCR, higher expectations.
- Student tenants: good for city-fringe/education nodes, higher wear.
- SME/commercial tenant: commercial-only, higher rent variance.

### Mechanics

Add tenant state to owned properties:

```ts
interface TenantState {
  profileId: string;
  leaseStartTurn: number;
  leaseEndTurn: number;
  satisfaction: number;
  rentStrategy: 'conservative' | 'market' | 'aggressive';
  askingRent: number;
  contractedRent: number;
  defaultRiskPct: number;
  renewalIntent: number;
}
```

Monthly turn processing updates satisfaction:

- + if rent is conservative, property condition is good, maintenance is resolved quickly.
- - if rent is aggressive, maintenance is deferred, renovations disrupt tenants, or vacancy history is high.

Vacancy risk should depend on:

- Asking rent vs market rent
- District demand
- Property type
- Tenant satisfaction
- Market rental index
- Renovation/condition score

### Singapore Realism

For HDB:

- Simplified 5-year MOP for BTO/resale.
- Before MOP: player can rent rooms only if living arrangement is compatible.
- After MOP: whole-unit rental unlocks.

For private:

- Whole-unit rental can start immediately.
- Condo-like properties have higher tenant expectations and carrying costs.

For commercial:

- Tenant fit-out matters more.
- Vacancy and tenant default risk are higher but yields can be stronger.

## Feature 3: Maintenance, Insurance, and Emergency Fund

### Player Experience

Add a **Property Operations Alerts** section on Dashboard and Portfolio:

- Burst pipe at Tampines GreenVerde.
- Aircon compressor failure.
- Electrical rewiring warning.
- MCST/conservancy increase.
- Tenant complaint pending.
- Insurance renewal due.

Each event offers 2-3 choices:

- Cheap fix: low upfront cost, higher recurrence risk, satisfaction penalty.
- Proper repair: medium cost, reduces recurrence, small satisfaction boost.
- Premium overhaul/claim insurance: higher process cost or deductible, improves condition and reduces future risk.

### Emergency Reserve

Add a player-level emergency reserve target:

```ts
interface ReserveState {
  targetMonths: number;
  allocatedCash: number;
  autoTopUpPct: number;
}
```

The reserve is still cash, but presented as protected runway. If the reserve covers an event, the UI shows "covered by reserve" and preserves the lesson that planning reduces panic.

### Maintenance Event Model

```ts
interface MaintenanceIssue {
  id: string;
  propertyId: string;
  category: 'plumbing' | 'electrical' | 'aircon' | 'waterproofing' | 'appliance' | 'common-area' | 'tenant-damage';
  severity: 'minor' | 'major' | 'urgent';
  estimatedCost: number;
  satisfactionImpact: number;
  valueImpactPct: number;
  recurrenceRiskPct: number;
  status: 'open' | 'repaired' | 'deferred' | 'insured';
}
```

Monthly issue chance scales with:

- Property age
- Lease age
- Tenant wear
- Renovation condition
- Property type
- Existing deferred issues

## Feature 4: 2D Floor Plans Now, Optional 3D Later

### Recommendation

Do not start with full 3D. The current simulator is React/Vite and UI-heavy. A full 3D stack would add asset and performance complexity before the new operation systems are proven.

Start with **floor-plan graphics and room cards**:

- HDB 3-room, 4-room, 5-room floor-plan silhouettes.
- Condo compact 1/2/3-bedroom plans.
- Landed simple multi-zone plan.
- Commercial shop/office layouts.

Each room can show renovation state:

- Kitchen: original, refreshed, premium.
- Bathroom: original, refreshed, premium.
- Living/flooring: original, refreshed.
- Smart home: enabled/disabled.

### Later 3D Path

If the 2D floor-plan layer works, add optional 3D with React Three Fiber:

- `src/features/visualization/UnitPreview3D.tsx`
- Low-poly room shell
- Swappable materials for upgraded rooms
- Static camera with orbit disabled by default on mobile
- Lazy-loaded route or modal to avoid bloating initial app load

### Asset Plan

Generate and wire these assets during implementation if needed:

- `public/floorplans/hdb-3-room.svg`
- `public/floorplans/hdb-4-room.svg`
- `public/floorplans/hdb-5-room.svg`
- `public/floorplans/condo-2-bed.svg`
- `public/floorplans/commercial-shop.svg`
- `public/operation-cards/reno-kitchen.png`
- `public/operation-cards/tenant-interview.png`
- `public/operation-cards/burst-pipe.png`
- `public/operation-cards/reit-board.png`

The first implementation should use SVG floor plans where possible to keep files small.

## Feature 5: Shorter Cycles and Mini-Milestones

### Problem

Monthly turns are realistic, but players need feedback before they can afford the next property. Waiting for CPF/cash accumulation can feel passive.

### Solution

Keep monthly turns, but add **quarterly operations reviews** and **mini-milestones**:

- Every 3 turns: show a compact review card with cashflow, tenant status, career momentum, market tape, and property condition.
- Every owned property has a next best action: "Find tenant", "Set reserve", "Upgrade kitchen", "Resolve maintenance", "Review rent".
- Pre-first-property players get "deposit milestones" at 25%, 50%, 75%, 100% of affordable starter upfront.
- HDB players can rent rooms before whole-unit rental unlocks.
- Career/job-switch events should remain more frequent than traditional annual simulation, but not every turn.

### Milestone Examples

- First emergency reserve: 3 months of ownership costs.
- First room tenant.
- First completed renovation.
- First positive rental cashflow month.
- First renewal at higher rent.
- First maintenance issue resolved without cash shortfall.
- First REIT dividend.

## Feature 6: Leaderboard and Social Comparison

### MVP

Upgrade the existing mock leaderboard into a local score system:

- Save player score snapshots into localStorage.
- Let players compare multiple runs on the same device.
- Add score breakdown: net worth, risk-adjusted leverage, rental stability, tenant happiness, district coverage, emergency reserve, difficulty multiplier.
- Add shareable portfolio summary text/card.

### Later Online Option

Remote leaderboard should wait until the scoring rules are stable. When ready:

- Store anonymous run summaries only.
- No authentication requirement for MVP.
- Use GitHub/Vercel/Supabase only if the project chooses a backend.
- Prevent obvious spam by limiting fields and using deterministic score validation where possible.

### Scoring Formula

```ts
score =
  netWorthScore
  + rentalStabilityScore
  + tenantSatisfactionScore
  + diversificationScore
  + achievementPoints
  - excessiveLeveragePenalty
  - bankruptcyStrikePenalty
```

This makes "best player" mean more than highest leverage.

## Feature 7: Broader Investment Options

### Player Experience

After the first home purchase or after turn 12, unlock an **Investments** page:

- Singapore REIT basket: monthly dividend, property-market sensitivity, moderate volatility.
- T-bill/SSB-like safe yield: low return, liquid or semi-liquid, good emergency parking.
- Global property fund: higher currency/market volatility, diversification benefit.
- Cash reserve: no return, protects against shocks.

The player can allocate surplus cash monthly or make one-off buys/sells.

### Mechanics

```ts
type InvestmentAssetId = 'sg-reit-basket' | 'tbill-safe-yield' | 'global-property-fund';

interface InvestmentHolding {
  assetId: InvestmentAssetId;
  units: number;
  averageCost: number;
  currentValue: number;
  monthlyIncome: number;
}
```

Monthly turn processing:

- Applies asset price movements.
- Adds dividends/interest.
- Adjusts net worth.
- Adds diversification score.

### Educational Role

This should not replace property. It should teach:

- Diversification reduces reliance on one property market.
- Safe yield competes with holding idle cash.
- REITs provide exposure without full property purchase friction.
- International exposure has currency/volatility tradeoffs.

## Data Model Summary

Recommended additions:

```ts
interface OwnedProperty {
  propertyId: string;
  purchasePrice: number;
  purchaseDate: string;
  currentValue: number;
  isRented: boolean;
  monthlyRental: number;
  renovationLevel: number;
  loanId?: string;
  occupancyStatus?: OccupancyStatus;
  tenantQuality?: number;
  vacancyMonths?: number;
  maintenanceCost?: number;
  propertyTax?: number;
  listingChannel?: string;
  conditionScore?: number;
  mopRemainingMonths?: number;
  activeRenovation?: RenovationProject;
  completedRenovations?: RenovationCategory[];
  tenant?: TenantState;
  openMaintenanceIssues?: MaintenanceIssue[];
  rentStrategy?: 'conservative' | 'market' | 'aggressive';
}

interface Player {
  reserve?: ReserveState;
  investments?: InvestmentHolding[];
  operationHistory?: PropertyOperationLogEntry[];
}
```

Use optional fields and save hydration so old saves continue loading.

## Engine Architecture

Create focused engine/data modules:

- `src/data/renovations.ts`: renovation templates by property type.
- `src/data/tenantProfiles.ts`: tenant demand and satisfaction profiles.
- `src/data/maintenanceEvents.ts`: issue templates and repair choices.
- `src/data/investments.ts`: investable asset definitions.
- `src/engine/propertyOperations.ts`: renovation, tenant, maintenance, reserve pure functions.
- `src/engine/investments.ts`: investment valuation and monthly income pure functions.
- `src/engine/scoring.ts`: leaderboard/run score calculation.

Modify existing integration points:

- `src/game/types.ts`: new optional state types.
- `src/data/saveSchema.ts`: schema hydration for new optional fields; save version bump if required.
- `src/engine/turn.ts`: advance renovations, tenant satisfaction, vacancies, maintenance risks, reserves, investments.
- `src/engine/actions.ts`: add pure actions for starting renovations, setting rent strategy, resolving maintenance, reserve updates, and investment trades.
- `src/game/useGameStore.ts`: expose store actions and autosave.
- `src/pages/PropertyDetail.tsx`: operations tabs for upgrades, tenants, repairs, floor plan.
- `src/pages/Portfolio.tsx`: operations alerts and property health.
- `src/pages/Dashboard.tsx`: urgent alerts and quarterly review.
- `src/pages/Leaderboard.tsx`: local run score snapshots.
- `src/App.tsx` and navigation if adding `Investments`.

## UI Design

### Property Detail

Add tabs or sections:

- Overview
- Purchase/Manage
- Upgrades
- Tenants
- Repairs
- Floor Plan

Each tab should have one primary action and a clear consequence preview.

### Portfolio

Add portfolio health summary:

- Occupancy rate
- Average tenant satisfaction
- Monthly rental income
- Monthly carry
- Open maintenance issues
- Reserve coverage in months

### Dashboard

Add "This Month Needs Attention":

- Renovation completed
- Tenant lease ending
- Maintenance issue open
- Reserve below target
- Investment dividend received

### Investments

Add asset cards and allocation summary:

- Expected yield
- Risk
- Liquidity
- Correlation with property market
- Monthly income

## Testing Strategy

Unit tests:

- Renovation cost, duration, completion, rent uplift, resale uplift.
- Tenant satisfaction, vacancy, renewal, rent strategy effects.
- HDB MOP room rental vs whole-unit rental restrictions.
- Maintenance event generation and repair choices.
- Reserve drawdown and auto top-up.
- Investment monthly returns and dividends.
- Score calculation.

Store tests:

- Start renovation updates state and cash.
- Advance turns completes renovation.
- Set rent strategy changes tenant state.
- Resolve maintenance clears issue and updates cash/condition.
- Save/load hydrates optional new fields.

Playtest smoke:

- Start new game.
- Buy affordable starter.
- Open property detail.
- Start a basic renovation.
- Advance until completion.
- Rent room/whole unit depending on property rule.
- Trigger or resolve a maintenance issue through a deterministic test helper.
- View portfolio operations summary.
- View local leaderboard score.

## Acceptance Criteria

- Owned properties have at least one meaningful monthly decision after purchase.
- Renovation choices visibly change rent, resale value, property condition, and payback estimate.
- Rent strategy affects income and vacancy/satisfaction risk.
- HDB room rental before MOP and whole-unit rental after MOP are represented in simplified form.
- Maintenance events can be mitigated by emergency reserve and insurance-like choices.
- Floor-plan or room-state visuals make upgraded properties feel distinct.
- New players see progress milestones at least every 3 turns.
- Leaderboard scoring rewards sustainable play, not only maximum leverage.
- Broader investments are useful but do not overpower direct property gameplay.

## Non-Goals for First Implementation

- Full first-person renovation engine.
- Real-time multiplayer trading.
- Fully accurate legal/tax handling for every Singapore housing rule.
- Heavy 3D rendering in the first pass.
- Backend leaderboard before local scoring is proven.

## Risks and Mitigations

- **Risk:** Too many systems land at once and overwhelm players.
  **Mitigation:** Ship in phases with clear unlocks and tutorial callouts.

- **Risk:** Renovations become an obvious money printer.
  **Mitigation:** Use payback estimates, duration, disruption, overruns, and market-sensitive returns.

- **Risk:** Tenant mechanics feel punitive.
  **Mitigation:** Give players clear previews and reliable conservative options.

- **Risk:** 3D scope balloons.
  **Mitigation:** Start with SVG floor plans and room cards; make 3D optional later.

- **Risk:** Broader investments distract from property simulator identity.
  **Mitigation:** Unlock after first home and make them supporting tools for cash management/diversification.

## Suggested Implementation Slices

### Slice 1: Operations Core

Add new types, renovation templates, tenant profiles, maintenance templates, pure engine functions, save hydration, and unit tests.

### Slice 2: Property Detail Operations UI

Add Upgrades, Tenants, Repairs, and Floor Plan sections to `PropertyDetail.tsx`. Wire store actions and previews.

### Slice 3: Monthly Turn Integration

Advance active renovations, resolve tenant satisfaction/vacancy, roll maintenance risks, apply reserve behavior, and generate operation alerts.

### Slice 4: Portfolio and Dashboard Readability

Surface occupancy, satisfaction, maintenance, reserve coverage, milestone cards, and quarterly reviews.

### Slice 5: Diversification and Leaderboard

Add local investments, local run scoring, and shareable portfolio snapshots.

## Open Product Decision

The main decision before implementation is whether Slice 1 should include investments immediately or keep investments for Slice 5. Recommendation: keep investments for Slice 5 so renovations, tenants, and maintenance become fun first.
