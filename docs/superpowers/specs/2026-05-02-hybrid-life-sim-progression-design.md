# Hybrid Life-Sim Progression Design

**Date:** 2026-05-02

**Goal**

Make the early and mid game feel like a realistic Singapore life-to-property ladder instead of a passive wait-for-down-payment loop. Players should have meaningful, Singapore-specific ways to earn, stabilize, and plan before they own property, while property remains the main long-term wealth engine.

## Problem Summary

The current simulator has a stronger post-purchase loop than pre-purchase loop.

- On `normal`, the player often spends the first several months pressing `Advance Turn` with little tactical choice.
- Careers mostly differ by starting salary and annual growth; `riskFactor` is not expressed in monthly gameplay.
- The bank provides leverage, not an earning path.
- Scenario cadence is sparse on `normal`, so the opening feels quiet.
- The game explains whether a player can buy a property now, but not how to reach that purchase in a realistic way.

## Phase 1 Scope

This design intentionally ships a focused first phase rather than every possible life milestone.

Phase 1 includes:

- persistent life-state stats that shape month-to-month decisions
- a monthly life-action system with one primary action and one conditional secondary action
- Singapore-specific income and support actions grounded in ordinary urban life
- realistic recurring household costs that make the player's life situation matter
- career-specific action biases so each career feels different before property ownership
- scheme and grant planning that provides conditional upside instead of arcade cash drops
- affordability guidance that tells the player what is blocking a purchase and how long it may take
- new UI surfaces for planning, reviewing, and understanding these life choices

Phase 1 does not include:

- full spouse simulation
- childbirth and childcare systems
- dual-income partner modeling
- BTO queue simulation
- detailed healthcare insurance products
- a full small-business management game

Those can follow in a later phase if this life-sim foundation works well.

## Design Principles

- Property stays central. Life systems feed the property game instead of replacing it.
- Choices must create tradeoffs, not free cash.
- Singapore realism matters more than generic tycoon abstraction.
- Upsides should appear as often as setbacks, but usually through effort, timing, or eligibility.
- The opening should be active without becoming micromanagement-heavy.

## Player Model Changes

Add a nested `life` state to `Player` so the new simulation stays coherent and does not explode the flat player shape.

```ts
interface PlayerLifeState {
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

interface LifeMonthSummary {
  primaryActionId: string;
  secondaryActionId: string | null;
  cashDelta: number;
  energyDelta: number;
  stressDelta: number;
  reputationDelta: number;
  careerMomentumDelta: number;
  householdSupportDelta: number;
  notes: string[];
}
```

`lastMonthSummary` should capture the resolved life actions and their effects so the UI can explain what just happened without re-running any logic.

## Core Life Stats

- `energy`: limits how hard the player can push. High energy can unlock the optional second action.
- `stress`: a soft risk stat. High stress weakens work and side-income outcomes.
- `reputation`: improves player-driven upside such as referrals, trusted gigs, and promotion quality.
- `careerMomentum`: reflects whether the player is trending upward, flat, or slipping in their career.
- `householdLoad`: the recurring monthly burden of transport, insurance, parents allowance, food, and other ordinary commitments.
- `householdSupport`: a stability score that reflects whether the player is actively maintaining their family or household obligations.

## Monthly Loop

Each month resolves in this order:

1. recurring salary, CPF, household costs, rent, loan, and property cashflow
2. chosen life actions resolve
3. training and scheme progress update
4. market and property updates resolve
5. existing random scenarios may still trigger
6. a month summary is stored for the UI
7. selected life actions are cleared for the next month

The player should be allowed to advance without selecting actions, but the engine should default the primary action to `focus-at-work`. This preserves usability while still nudging the player toward intentional play.

## Living Arrangement and Realistic Baseline Costs

Add a lightweight living-arrangement model to make monthly life feel grounded.

- `with-parents`: lowest cash burn, but includes a parents-allowance style household burden. Base monthly household load: `650`.
- `renting-room`: moderate recurring costs, more independence. Base monthly household load: `1700`.
- `renting-flat`: highest recurring cost, strongest pressure on savings. Base monthly household load: `3200`.

Phase 1 should default new games to `with-parents`. This matches the opening age and keeps the early game difficult but not punishing.

`householdLoad` should be derived from:

- living arrangement baseline
- career lifestyle pressure
- life-stage obligations already chosen by the player

The engine should treat `householdLoad` as a real monthly expense, not just a flavor number.

## Monthly Action Budget

The player gets:

- `1` primary life action every month
- `1` optional secondary action only when start-of-month `energy >= 70` and `stress <= 30`

The secondary action exists to reward healthy play and career stability, not to create a grind loop.

## Action Catalogue

Phase 1 ships seven life actions.

### Focus at Work

The safe default action.

- reliable salary stability
- strongest promotion and momentum growth
- low stress increase
- modest energy cost

### Take Side Gig

Cash-now action representing realistic Singapore side income such as tuition, freelance work, delivery shifts, event staffing, contract admin, or locum-style shifts for suitable careers.

- immediate cash gain
- stress increase
- energy decrease
- outcome quality depends on career fit, reputation, and current stress

### Property Hustle

Property-adjacent income and intelligence work such as viewings support, buyer referrals, lease leads, or marketing help.

- small to medium immediate cash gain
- strong reputation gain
- especially good for `agent`
- can give smaller but still possible upside to other careers

### Upskill

Represents professional courses, certifications, and SkillsFuture-style progress.

- short-term cash cost
- energy cost
- long-term career momentum gain
- may improve future `focus-at-work` and `take-side-gig` outcomes
- also grows `skillsFuture` scheme progress

### Support Household

Represents helping with parents allowance, caregiving errands, urgent family obligations, or other household support.

- cash cost or opportunity cost
- reduces stress
- improves household support
- improves medium-term stability

### Claim / Plan Schemes

Represents the player taking time to understand and prepare for support they may be eligible for, instead of magically receiving cash.

- small immediate upside at times, such as CDC- or GST-style household relief
- stronger impact is medium-term progress toward housing or training support
- best results come from consistency, not one-off use

### Recover

The reset action.

- restores energy
- lowers stress
- modest reputation or momentum downside compared with working harder

## Career Identity

Careers should bias action outcomes through data rather than hard-coded conditionals scattered across the engine.

Add per-career modifiers for:

- `focus-at-work`
- `take-side-gig`
- `property-hustle`
- `upskill`
- `support-household`
- `scheme-planning`
- stress sensitivity
- promotion quality

Examples:

- `tech`: good freelance upside, good certification payoff, moderate crunch stress
- `banking`: best bonus upside, high stress sensitivity, good promotion spikes
- `civil`: strongest scheme-planning reliability, lower side-gig upside, stable progression
- `medical`: stable work, strong locum-like side income, high fatigue load
- `agent`: best property-hustle income and reputation, weak salary floor
- `entrepreneur`: volatile side-income and work outcomes, highest upside swing
- `graduate`: weakest start, strongest payoff from upskilling and disciplined household play

## Schemes and Conditional Upside

Phase 1 should add a small scheme layer that feels recognizably Singaporean without becoming a policy simulator.

Shipped scheme tracks:

- `SkillsFuture-style progress`: improves upskilling efficiency and lowers course cost over time
- `first-timer grant planning`: progress meter for a future housing-support boost
- `household support relief`: occasional modest cash relief tied to scheme-planning and living arrangement

Important rule:

- scheme effects should mostly be conditional, delayed, or capped
- they should not function as random jackpot cash rewards

## Affordability Guidance

Property buying needs better explanation.

Add affordability analysis helpers that surface:

- cash shortfall
- whether the blocker is cash, credit, LTV, or income ratios
- estimated months to buy at current monthly surplus
- estimated months to buy with a stronger saving path

This should appear:

- on `PropertyDetail`
- in the new life-planning surface
- optionally in a dashboard summary card

The goal is to turn "cannot buy yet" into a plan the player can act on.

## UI Surface Changes

### New `Life` Page

Add a dedicated route and navigation item for life simulation.

This page should show:

- current life stats
- living arrangement and household burden
- monthly action picker
- training and scheme progress
- last month action summary
- a short "best next step" affordability hint

### Dashboard

Upgrade the dashboard so it stops feeling empty in the first few turns.

Add:

- a compact life-status panel
- current selected monthly actions
- household and non-property cashflow visibility
- a CTA into the `Life` page

### Property Detail

Enhance the purchase panel with:

- what is blocking this purchase
- how many months away it appears to be
- how life actions could accelerate progress

### Sidebar and Routing

Add a `Life` destination while keeping the existing `Scenarios` page for random narrative events.

## Engine and Data Modules

Add or modify the following modules:

- `src/game/types.ts`
  add life-state types and new player fields
- `src/data/careers.ts`
  extend careers with action modifiers and narrative labels
- `src/data/lifeActions.ts`
  define actions, labels, descriptions, and UI metadata
- `src/engine/life.ts`
  resolve action outcomes, monthly household costs, and summary objects
- `src/engine/turn.ts`
  integrate life resolution into the monthly turn pipeline
- `src/engine/selectors.ts`
  expose household cashflow and affordability helpers
- `src/game/useGameStore.ts`
  add methods for selecting actions and living arrangement
- `src/pages/Life.tsx`
  new planning surface
- `src/pages/Dashboard.tsx`
  expose the new loop in the main hub
- `src/pages/PropertyDetail.tsx`
  show affordability analysis
- `src/components/Sidebar.tsx`
  add navigation entry

## State and Resolution Rules

Key resolution rules for Phase 1:

- action outcomes should have deterministic base effects plus a small RNG spread
- high stress weakens upside outcomes
- high reputation improves referral and commission style outcomes
- high career momentum improves work and promotion quality
- low energy can block the optional secondary action
- `upskill` training should persist across months until completion
- monthly household load must always be included in cashflow calculations

The game must never resolve life actions twice for the same month or allow stale action selections to leak across turns.

## Random Scenarios and Narrative Tone

The existing scenario system remains, but its relative role changes.

Phase 1 should preserve the random scenario modal flow while letting the player-driven life action system do more of the heavy lifting in the opening game.

Target tone after this change:

- more player-driven upside
- fewer dead months
- setbacks remain possible, but are no longer the only memorable interruptions

## Visual and Asset Plan

New images are optional, not mandatory for correctness.

If the new `Life` surface or narrative summaries feel visually thin, add a small supporting set of grounded painterly images for:

- side hustle / after-hours work
- upskilling / classroom or laptop study
- household support / family obligations

These assets should live in `public/` and use the same fallback behavior as the existing image system. If the implementation can achieve a strong result with icons and layout alone, avoid forcing decorative assets just to satisfy the feature.

## Error Handling

- invalid action IDs should fall back safely to `focus-at-work`
- secondary actions should be ignored when eligibility rules are not met
- affordability estimates should degrade gracefully when monthly surplus is zero or negative
- saved games without `life` state must be upgraded with safe defaults on load
- old owned-property data should continue to normalize correctly alongside the new life fields

## Testing Strategy

Phase 1 must be test-led.

Add or update tests for:

- life-state defaults on new game
- life action selection and clearing
- monthly household cost calculation
- each action's core effect shape
- secondary-action eligibility rules
- training progression
- scheme-progress accumulation
- affordability helper edge cases
- save/load compatibility for legacy saves
- dashboard/property detail selectors that depend on new cashflow values

## Success Criteria

This feature is successful when:

- the first few months contain meaningful, understandable player choices
- at least three careers feel materially different before owning any property
- the player has realistic ways to accelerate toward a purchase without relying only on waiting
- the UI makes tradeoffs legible instead of hiding them
- the game still passes test, lint, build, and browser smoke verification

## Future Extensions

If Phase 1 lands well, the next wave can add:

- relationship and marriage tracks
- partner income and joint planning
- childbirth and childcare pressure
- eldercare escalation
- BTO and resale path specialization
- richer player-driven opportunity cards tied to life actions
