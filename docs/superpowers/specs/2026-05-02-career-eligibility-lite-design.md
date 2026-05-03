# Career & Eligibility Lite Design

Date: 2026-05-02
Project: `singapore-property-simulator`
Phase: `Career & Eligibility Lite`
Status: Approved for implementation

## Summary

This phase adds single-run long-term progression through career and housing-access systems without turning the game into a heavy compliance simulator. The player should feel like they are moving through recognizable Singapore life stages as a buyer and investor, but the rules should remain legible inside the current monthly turn loop.

The core idea is simple:

- the player's income path should change over time through annual reviews and periodic job-switch decisions
- housing access should become more explicit through visible eligibility labels and a small number of meaningful gates
- the run should feel more structured from `first-timer` to `upgrader` without adding marriage, children, or multi-actor household systems yet

This phase builds directly on the current systems:

- monthly turn simulation
- salary and CPF growth
- scenarios
- property browser and purchase flow
- underwriting checks like LTV, MSR, and TDSR

## Goals

- Make long-term progression visible in a single run.
- Give the player recurring career choices that materially change buying power.
- Surface housing eligibility in the property browser before the player clicks into a detail page.
- Make the first-home ladder and upgrader ladder feel intentional rather than accidental.
- Preserve the approachable tone of the current build by using a small number of clearly explained rules.

## Non-Goals

- No cross-run meta progression.
- No marriage, family nucleus, school, or children mechanics in this phase.
- No full Singapore rulebook simulation for HDB/BTO/MOP/resale levy complexity.
- No new multiplayer, leaderboard, or social systems.
- No broad rewrite of property pricing or loan math.

## Player Outcome

By the end of this phase, a typical run should feel like:

1. `Early game`: the player is building salary, evaluating stability versus growth, and planning their first eligible purchase.
2. `Mid game`: the player understands why some properties are now available or blocked, and sees their career choices directly affect housing tier access.
3. `Late game`: the player feels they have progressed from entry-level buyer to credible upgrader or higher-tier investor within the same run.

## Product Approach

This phase uses a `systems-first eligibility ladder` approach.

Why this approach:

- it fits the existing architecture better than a narrative-heavy chapter system
- it creates realism through visible constraints instead of hidden probabilities
- it can reuse the scenario framework for yearly review and job-switch moments
- it keeps the scope smaller than a full legal or family simulation

## Feature Set

### 1. Annual Career Review

Every 12 turns, the player receives a structured career outcome.

Possible outcomes:

- `Promotion`
- `Strong Year Bonus`
- `Steady Year`
- `Career Setback`

Effects:

- salary increase or stagnation
- one-time cash bonus only on `Promotion` and `Strong Year Bonus`
- a persisted `careerVolatilityModifier` change when the outcome is `Career Setback`

Design rules:

- each career keeps its current identity through existing growth and risk factors
- low-risk careers should feel steadier, not flat
- high-risk careers should create larger upside and clearer downside
- annual reviews must be deterministic under the current seeded RNG model

### 2. Job Switch Opportunities

At a light cadence, the player is offered job-switch decisions.

Recommended cadence:

- first switch check after turn 24
- then every 24 turns after that

Each opportunity offers 2 or 3 choices such as:

- `Stay in role`
- `Take a higher-paying role`
- `Take a stretch role with more upside and more volatility`

Effects:

- immediate salary adjustment
- updated long-term growth modifier
- updated long-term risk modifier

Constraints:

- this should not become a separate job market simulator
- no resumes, interviews, or skill trees
- choices should be readable in one card and one decision

### 3. Housing Eligibility States

The game will explicitly track a small set of housing-progression states.

Initial set:

- `First-Timer`
- `Homeowner`
- `Upgrader`
- `EC Eligible`
- `Salary Ceiling Exceeded`

Purpose:

- show the player why a listing is a realistic fit, a stretch, or blocked
- make the property browser itself part of the progression loop

Simplified rule model for this phase:

- `First-Timer`: player has never completed a home purchase
- `Homeowner`: player currently owns at least one residential property
- `Upgrader`: player is no longer a first-timer after the first qualifying home purchase
- `EC Eligible`: player monthly salary is less than or equal to `EC_MAX_MONTHLY_INCOME`, default `16000`, and the run has not flagged the player as a private-home owner
- `Salary Ceiling Exceeded`: listing has a salary-ceiling tag and the player's current monthly salary exceeds that threshold

Important note:

This phase intentionally uses a simplified, game-readable approximation of real Singapore eligibility. It should feel grounded, not exhaustive.

### 4. First-Home and Upgrader Support

The current run already has early support momentum. This phase formalizes it into a progression ladder.

Additions:

- persistent first-home support state
- clearer grant/support messaging tied to eligibility
- state transition after first qualifying purchase

Expected player feel:

- the first purchase should feel like crossing into a new stage of the run
- support should fade or change after the first rung, reinforcing progression

### 5. Annual Progression Recap

At year-end review points, the game should clearly summarize what changed.

Recap content:

- salary before and after
- annual bonus or setback
- current housing status
- newly unlocked or newly blocked tiers
- buying-power delta for the next year

This should make progression tangible even on years when the player does not buy or sell property.

## UI Surfaces

### Dashboard

Add:

- `Career Review` card when an annual event is active
- compact `Eligibility Summary` panel
- yearly summary state after review resolution

The dashboard remains the main "what changed this month/year?" surface.

### Property Browser

Each listing should show lightweight progression labels such as:

- `First-Timer Friendly`
- `EC Eligible`
- `Salary Ceiling Exceeded`
- `Upgrader Tier`

The player should be able to browse everything, but the UI must explain the status clearly.

### Property Detail

Add a small `Eligibility` section that explains:

- why the player qualifies
- why the player does not qualify
- what would need to change if the property is blocked by progression rules

This should sit alongside the existing upfront-cost and loan information.

### Scenarios

Reuse the scenario system for:

- annual career review events
- job-switch choice events

This keeps the implementation smaller and consistent with the existing event flow.

### Game Over

Add a short progression recap section:

- final salary
- total salary growth across the run
- promotions earned
- setbacks weathered
- housing ladder reached

## Generated Art

This phase should use the generated custom illustration for the annual career review / income milestone surface.

Generated source:

- `C:\Users\Greyf\.codex\generated_images\019de62c-5272-7621-9004-40249ba2b3d6\ig_0c13bba2a2824d0f0169f5f47fa2808191b18ed8f2d3934b1c.png`

Recommended implementation target:

- copy into repo as `public/career-review-key-art.png`

Usage:

- annual career review hero art

Constraint:

- do not reuse the existing property- or market-event art for this screen if the new illustration is available

## Data Model Changes

Add lightweight player progression fields.

Recommended player-state additions:

- `careerProgressionProfile`
- `careerRiskModifier`
- `careerGrowthModifier`
- `careerVolatilityModifier`
- `lastCareerReviewTurn`
- `nextJobSwitchTurn`
- `housingStatus`
- `firstHomePurchased`
- `eligibilityFlags`
- `careerReviewHistory`

Design guidance:

- keep the data flat and save-friendly
- avoid introducing nested progression trees or deeply coupled objects
- maintain backward-compatible save hydration where possible

## Simulation Rules

### Career Review Resolution

Inputs:

- current career
- current salary
- career risk factor
- recent financial health
- seeded RNG

Outputs:

- salary delta
- bonus cash delta
- narrative label for the year
- possible risk/growth modifier adjustment

Financial-health signal should stay simple:

- positive cashflow
- insolvency pressure
- recent ownership status

The career system should react slightly to how well the run is going, but it should not become a hidden skill score.

### Job Switch Resolution

The game offers explicit choices rather than fully random changes.

Each choice modifies:

- current salary
- future growth
- future volatility

This keeps the system realistic enough to matter but simple enough to understand immediately.

### Eligibility Evaluation

Eligibility should be derived, not hand-maintained where possible.

Examples:

- `First-Timer` from purchase history
- `Homeowner` from current portfolio
- `Salary Ceiling Exceeded` from current salary versus listing or tier threshold

This keeps the logic easier to test and reduces save corruption risk.

## Error Handling and Migration

- Existing saves must hydrate safely with default progression values.
- Missing new fields should fall back to reasonable defaults.
- Listings without explicit eligibility tags should derive them at runtime.
- Career review events should not stack on top of unresolved scenario events.

## Testing Strategy

### Engine Tests

Add coverage for:

- annual review cadence
- deterministic review outcomes by seed
- job-switch schedule
- eligibility derivation
- first-timer to upgrader transition
- salary ceiling classification

### Store Tests

Add coverage for:

- new state initialization
- save/load hydration with missing fields
- event gating when scenarios are already active

### Browser Smoke Test

Extend smoke coverage to validate:

- annual review surfacing
- eligibility labels in property browser
- first-home progression transition
- career review illustration present on the relevant surface once implemented

## Rollout Order

Recommended implementation order:

1. progression state and save-schema expansion
2. eligibility derivation logic
3. annual career review engine
4. job-switch events
5. property-browser and property-detail eligibility UI
6. dashboard recap UI
7. game-over progression recap
8. generated illustration placement and smoke coverage

## Risks

- Over-modeling real Singapore rules too early will make the phase harder to explain and slower to ship.
- If eligibility is overly restrictive, players may feel blocked rather than guided.
- If annual reviews are too random, progression will feel unfair instead of strategic.

## Success Criteria

This phase is successful if:

- the player can describe their run as a career-and-housing climb, not just a sequence of purchases
- eligibility rules are visible and understandable in the property browser
- career decisions materially affect buying power
- the build stays approachable and does not require reading a long legal explainer
