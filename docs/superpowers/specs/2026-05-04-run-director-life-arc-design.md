# Run Director And Life Arc Design

## Purpose

The simulator has strong systems now: fictional Singapore listings, buyer profiles, first-home missions, decision coaching, life actions, renovations, tenant management, maintenance, and landlord operations. The missing longevity layer is a reason to replay from a different point of view.

This spec adds a **Run Director**: a route-aware guidance system that makes each new game feel like a Singapore property life story instead of a generic sandbox. New players should get a simple path with obvious next steps. Returning players should get different constraints, goals, scenario weightings, and endgame recaps across multiple playthroughs.

## Design Principles

- Start with story, not settings. Players choose a route such as "BTO Upgrader" or "Single 35 Resale Buyer" rather than tuning many simulation sliders.
- Keep the first 10 minutes light. Show only the next 1-3 useful actions and unlock deeper systems when they become relevant.
- Make Singapore rules recognizable but readable: HDB access, MOP, CPF, ABSD, upgrading, room rental, PR/foreigner friction, and landlord operations should appear in context.
- Every route should teach a different lesson, not just change starting cash.
- Preserve sandbox freedom. The route guides and scores the run, but it should not hard-lock players out of valid off-route choices that existing rules allow.

## Recommended Approach

Use **guided life routes** as the core structure.

Alternative 1, a simulation-first market regime expansion, would deepen realism but make onboarding heavier. Alternative 2, a tycoon-first sandbox, would add breadth but could weaken the Singapore financial-literacy angle. Guided routes give the best balance: easier for new players, better replayability for experienced players, and a clean place to attach future market regimes and endgame scoring.

## Player Experience

New Game gains a route step after buyer profile and before difficulty. The player chooses one route card:

- **BTO-to-Condo Upgrader**: classic citizen/couple first-home ladder, focused on affordability, MOP, resale timing, and upgrade discipline.
- **Single 35 Resale Buyer**: solo affordability pressure, grants/readiness, smaller first home, and stronger cash-buffer lessons.
- **PR Private-Market Climber**: ABSD-aware private/resale journey, tighter capital requirements, and career-income pressure.
- **Foreign Investor**: private/commercial focus with heavy ABSD, no public-housing route, and stronger diversification/tenant-risk lessons.
- **Heartland Landlord**: yield, room rental, maintenance, tenant happiness, and reserve management.
- **Commercial Operator**: commercial listings, tenant default risk, fit-out/lease management, and business-like cashflow.
- **FIRE / Debt-Free Homeowner**: conservative route focused on lower leverage, emergency reserve, paid-down debt, and sustainable net worth.

The Dashboard then shows a **Life Arc** card:

- Current route and route phase.
- One primary milestone.
- Two supporting objectives.
- Route lesson in plain English.
- A "Why this matters" line for new players.

Decision Coach becomes route-aware by prioritizing actions that advance the selected route, while still showing critical issues such as active scenarios, repairs, bankruptcy risk, or low cash first.

## Route Phases

Each run moves through route phases derived from player state:

- **Foundation**: no property yet, focus on income, CPF/cash, eligibility, and first-home readiness.
- **Acquisition**: player is close to buying or comparing starter properties.
- **Ownership**: player owns a home and is learning carrying costs, MOP, renovations, and life/career tradeoffs.
- **Expansion**: player has rental income, a second-property ambition, or commercial/private upgrade goals.
- **Legacy**: late-run scoring, debt discipline, diversification, and final lessons.

Routes do not need custom turn counters. Phases should be derived from existing state such as property count, HDB ownership, MOP remaining, rental income, net worth, reserve, debt load, and commercial ownership.

## Data Model

Add a route id to player state:

```ts
type RunRouteId =
  | 'bto-upgrader'
  | 'single-resale'
  | 'pr-private-climber'
  | 'foreign-investor'
  | 'heartland-landlord'
  | 'commercial-operator'
  | 'fire-homeowner';

interface Player {
  runRouteId?: RunRouteId;
}
```

Hydration should default old saves to a route inferred from buyer profile:

- Foreigner profile: `foreign-investor`.
- Single 35+ profile: `single-resale`.
- Commercial-heavy owned portfolio: `commercial-operator`.
- Rented property/landlord signals: `heartland-landlord`.
- Otherwise: `bto-upgrader`.

Route definitions live in `src/data/runRoutes.ts`:

```ts
interface RunRoute {
  id: RunRouteId;
  label: string;
  tagline: string;
  difficultyHint: string;
  beginnerFriendly: boolean;
  recommendedBuyerProfiles: HouseholdProfile[];
  recommendedResidency: BuyerResidencyStatus[];
  primaryLessons: string[];
  scenarioTags: string[];
  milestoneTemplates: RouteMilestoneTemplate[];
}
```

The director engine lives in `src/engine/runDirector.ts` and exposes:

```ts
function getRouteForPlayer(player: Player): RunRoute;
function getRunArc(player: Player): RunArc;
function getRouteMilestones(player: Player): RouteMilestone[];
function scoreRunRoute(player: Player): RunRouteScore;
```

## Route Milestones

Milestones should be deterministic, explainable, and based on existing game state. Example milestones:

- BTO Upgrader: "Build S$60K available cash", "Buy an eligible first home", "Survive the MOP with positive cashflow", "Upgrade without overleveraging".
- Single 35 Resale Buyer: "Reach age/eligibility readiness", "Keep 6 months reserve", "Buy a manageable resale flat", "Avoid stress spiral while servicing loan".
- PR Private Climber: "Absorb first-home ABSD", "Buy private without negative monthly cashflow", "Use career growth to refinance/upgrade".
- Foreign Investor: "Preserve liquidity after ABSD", "Operate a private rental", "Diversify away from one concentrated asset".
- Heartland Landlord: "Set a reserve", "Keep tenant satisfaction above 70", "Resolve maintenance quickly", "Grow rental income".
- Commercial Operator: "Buy commercial asset", "Manage fit-out/tenant default risk", "Keep vacancy streak low", "Reach resilient operating cashflow".
- FIRE Homeowner: "Keep debt service modest", "Build 12-month reserve", "Pay down mortgage", "End with high net worth and low stress".

Each milestone has:

- Status: locked, active, completed.
- Route: where to click.
- Impact label: cash, eligibility, risk, yield, debt, or lifestyle.
- Plain-English explanation.

## Scenario And Coaching Integration

Scenario selection should become route-aware without becoming deterministic. Add route tags to scenarios, then prefer eligible scenarios that match the active route when random events fire.

Priority order remains:

- Critical gameplay blockers.
- Active scenario resolution.
- Open maintenance and bankruptcy risk.
- Route milestone action.
- First-home missions.
- Advance month.

This protects new players from route advice hiding urgent problems.

## UI Surfaces

New Game:

- Add a fifth route-selection step.
- Highlight "Beginner friendly" for BTO Upgrader and Single 35 Resale Buyer.
- Warn gently if route and buyer profile are unusual, but allow it.

Dashboard:

- Add a Life Arc card near Decision Coach and First-Home Mission Rail.
- Show route phase, active milestone, two next objectives, and progress percentage.

How To Play:

- Add a "Pick a route" section explaining that routes guide, not restrict.

Game Over:

- Add route recap: route score, completed milestones, missed lessons, and a suggested next route for replay.

Portfolio:

- Show a compact route progress ribbon only when the route is property-operations heavy, such as Heartland Landlord or Commercial Operator.

## Error Handling And Save Compatibility

- Unknown route ids from imported saves fall back to inferred route and log no fatal error.
- Existing saves without route ids remain valid.
- Route recommendations must never bypass existing purchase/eligibility validation.
- Route mismatch warnings are educational text only.

## Testing Plan

Unit tests:

- Route inference from buyer profile and portfolio state.
- Route phase derivation for no-property, first-owner, landlord, commercial, and late-game states.
- Milestone status calculation.
- Decision Coach route milestone priority after critical issues.
- Save-schema hydration with missing and unknown route ids.

UI/smoke tests:

- New game can choose each beginner route and reach dashboard.
- Dashboard renders Life Arc with active milestone.
- Game Over renders route recap.
- Existing smoke flow still passes.

Browser playtests:

- Beginner citizen/couple BTO route: verify onboarding is clear and does not overwhelm.
- Single 35 route: verify eligibility messaging is understandable.
- Landlord route with owned property: verify route guidance points to tenant/reserve/repair choices.

## Scope For First Implementation

Build the complete route framework and a polished first version of UI/coaching integration. Do not add full market-regime simulation, REITs, international property, multiplayer, or 3D in this phase. Those should attach to the route framework later.

The success condition is: a new player can start a guided route and know what to do next, while a returning player can replay with a meaningfully different Singapore property objective.
