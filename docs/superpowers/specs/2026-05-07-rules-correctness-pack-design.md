# Rules Correctness Pack Design

## Purpose

This spec defines the first follow-up package from the recent realism review: a focused rules-correctness pass for Singapore property taxes and CPF housing usage.

The current game already models a lot of Singapore property friction well, but a few high-impact rules are still missing or too simplified in ways that can mislead players:

- Seller's Stamp Duty (`SSD`) is not applied on residential sales
- Additional Buyer's Stamp Duty (`ABSD`) remission / refund cases are not modeled
- CPF housing usage does not yet react to short lease coverage in a realistic way

These gaps should be fixed before broader persona-start realism work, because they affect core buy / sell decisions and educational trust.

## Scope

This pack covers only:

1. `SSD` for residential property sales
2. `ABSD` refund / concession flows for:
   - married-couple second-home remission / refund
   - single Singapore Citizen senior concession
3. `CPF lease-to-95` housing-usage realism

This pack does not cover:

- true senior downsizer starting states
- broader persona-specific starting backgrounds
- school proximity modeling
- richer life-history simulation
- mixed-citizenship spouse modeling
- fractional ownership or trust structures

Those remain future sub-projects.

## Product Goal

When players buy, bridge, or sell property, the simulator should teach the correct broad Singapore trade-offs:

- some taxes are paid upfront and only recovered later if conditions are met
- short holding periods can materially reduce sale proceeds
- short leases do not always hard-block a purchase, but they do reduce CPF flexibility and increase retirement trade-offs

The game should become more realistic without becoming opaque or legalistic.

## Non-Goals

- Do not replicate every IRAS or CPF edge case.
- Do not simulate legal filing workflows or manual document submission.
- Do not add mixed-owner marital eligibility matrices beyond what the current player-profile model can honestly support.
- Do not block purchases purely because a lease does not cover age 95 if CPF can still be used on a pro-rated basis.
- Do not widen the UI into a tax-management subgame.

## Source-of-Truth Policy Decisions

This pack should align to the following official rules as of `7 May 2026`:

### 1. SSD

For residential properties purchased on or after `4 July 2025`, the post-`4 July 2025` SSD schedule applies:

- `<= 1 year`: `16%`
- `> 1 year and <= 2 years`: `12%`
- `> 2 years and <= 3 years`: `8%`
- `> 3 years and <= 4 years`: `4%`
- `> 4 years`: `0%`

For residential properties purchased before `4 July 2025`, the pre-change schedule remains:

- `<= 1 year`: `12%`
- `> 1 year and <= 2 years`: `8%`
- `> 2 years and <= 3 years`: `4%`
- `> 3 years`: `0%`

The simplified game can continue to treat HDB MOP as a sale blocker before SSD matters for public housing gameplay.

### 2. Married-couple ABSD refund

Model the current concession as `pay now, refund later if qualified`.

Within the game's simplified profile system, the eligible pattern is:

- a married couple
- the run is represented as a Singapore Citizen-led married purchase in the current single-profile model
- they jointly buy the second residential property
- they do not own more than one residential property each at purchase time
- they pay ABSD upfront
- they sell the first residential property within `6 months`
- they do not buy another residential property in between

This first pass should model the cashflow and timing pain, not just the eventual waiver.
It should not attempt to infer mixed-citizenship spouse cases that the current `BuyerProfile` cannot represent.

### 3. Single SC senior ABSD concession

For purchases on or after `16 February 2024`, model the single SC senior concession as `pay now, refund later if qualified`.

Within the game's simplified profile system, the eligible pattern is:

- buyer is a single Singapore Citizen aged `55+`
- the first pass supports only the sole-buyer replacement pattern already representable by the current player model
- the buyer is replacing an existing residential property
- the replacement residential property is lower in value than the property sold
- ABSD is paid upfront
- the first property is sold within `6 months`

The real scheme also supports some immediate-family joint-purchase patterns. This pack should not pretend to cover ownership structures that the current player model cannot represent yet.

### 4. CPF lease-to-95

The game should use the realistic broad rule:

- if remaining lease covers the youngest buyer to age `95`, CPF OA can be used normally
- if remaining lease is above `20 years` but does not cover the youngest buyer to age `95`, CPF OA usage becomes pro-rated
- if remaining lease is `20 years or below`, CPF OA cannot be used

This pack should implement the simulator's own explicit simplification for pro-rating rather than invoking an unknown black-box calculator.

## Simulation Boundary

The current player model does not encode:

- spouse-by-spouse citizenship splits
- fractional ownership
- multiple current owners with different legal shares
- IRAS filing state
- trust purchases

Therefore this pack should be honest:

- model only the remission / concession paths that can be inferred from existing `Player` and `BuyerProfile` state
- explain when the game is using a simplified approximation
- avoid UI wording that implies full legal coverage
- keep phase-one married-couple support to runs the game already models as SC-led married purchases
- keep phase-one senior support to single-SC-senior sole-buyer replacement runs

## User Experience Rules

### Purchase surfaces

Players should see:

- `ABSD payable now`
- whether this purchase may later qualify for a refund / concession
- the condition window in plain language
- whether CPF OA is fully allowed, reduced, or unavailable because of lease coverage

### Sale surfaces

Players should see:

- sale value
- loan payoff
- `SSD` if applicable
- whether an `ABSD` refund was triggered by this sale
- net cash proceeds after all effects

### Practice / compare surfaces

Any practice-buy or preview panel must use the same engine outputs as the actual purchase flow.

No preview should say:

- full CPF available when actual purchase would prorate it
- no tax risk when actual sale would incur SSD
- generic ABSD only, when the run actually has a conditional future refund path

## Architecture

Use one rules layer shared by buy, preview, and sell paths.

### Core rule modules

#### `stampDuty.ts`

Expand this module to support:

- `calculateSSD(...)`
- `calculateABSDRefundEligibility(...)`
- `calculateSeniorConcessionEligibility(...)`

This module should remain pure and deterministic.

#### `purchase.ts`

Expand purchase validation so it returns:

- ABSD paid now
- possible refund / concession metadata
- lease-coverage status
- CPF usage mode:
  - `full`
  - `prorated`
  - `blocked`
- maximum CPF usable under the current lease conditions

This keeps all purchase math in one place.

#### `actions.ts`

Expand buy / sell actions so they can:

- attach a pending ABSD refund claim after a qualifying purchase
- apply SSD during sale
- resolve and pay refund claims when sale conditions are satisfied

## Data Model Changes

Add a persistent tax-relief claim shape to player state.

Suggested concept:

- `pendingTaxReliefs: PendingTaxRelief[]`

Each entry should include:

- type:
  - `absd-spouse-refund`
  - `absd-single-senior-refund`
- purchase property id
- purchase date / turn
- deadline month / turn
- expected refund amount
- qualifying sold property ids or ownership context
- status:
  - `pending`
  - `earned`
  - `expired`

This must be saved through the existing save schema and survive exports / imports.

## CPF Lease Simplification

The property dataset already stores:

- `yearBuilt`
- `leaseYears`

This pack should use those fields to derive remaining lease at purchase time.

Suggested simulator rule:

1. compute remaining lease at purchase from:
   - `leaseYears - (purchaseYear - yearBuilt)`
2. derive youngest buyer age from:
   - normalized buyer profile age
3. branch:
   - `remainingLease <= 20`: CPF blocked
   - `youngestAge + remainingLease >= 95`: CPF full
   - otherwise: CPF prorated

For the pro-rated amount, use an explicit game formula rather than hidden magic:

`proratedCpfLimit = lower(purchasePrice, valuationPriceEquivalent) * remainingLease / (95 - youngestBuyerAge)`

Cap the ratio between `0` and `1`.

For phase one, `valuationPriceEquivalent` should default to `purchasePrice`, because the simulator does not yet store a formal transaction-time valuation separate from the purchase price. If a true valuation field is introduced later, the rules layer can start using it without changing the public contract.

This is not a promise of exact CPF Board calculator parity. It is an explicit educational approximation aligned to the official rule direction.

## Detailed Feature Behavior

### A. SSD on sale

When selling a residential property:

- determine acquisition date
- decide whether pre-`4 July 2025` or post-`4 July 2025` SSD schedule applies
- compute holding period at sale date
- compute SSD
- deduct SSD from sale proceeds before adding cash to player state

Commercial property sales should remain outside SSD in this pack.

### B. Married-couple ABSD refund

On purchase:

- charge ABSD normally
- if run qualifies, create a pending refund claim
- explain clearly that the refund requires sale of the first property within `6 months`
- in phase one, measure the `6-month` window from the purchase turn because the current game does not yet model separate `TOP/CSC` milestone dates for uncompleted homes

On sale:

- if sold property satisfies the pending claim
- and sale timing remains within the claim deadline
- and no disqualifying additional residential purchase occurred
- then pay the stored refund amount into cash
- record a player-facing operation history / recap line

If deadline passes without satisfaction:

- claim expires
- no refund is paid

### C. Single SC senior concession

On purchase:

- charge ABSD normally
- only create the pending concession if the run matches the supported simplified senior pattern
- in phase one, measure the `6-month` window from the purchase turn because the current game does not yet model separate `TOP/CSC` milestone dates for uncompleted homes

On sale:

- if sale occurs within `6 months`
- and replacement property value is lower than the sold property's value
- pay the stored refund

If not:

- claim expires

### D. CPF lease-to-95 impact

On purchase validation:

- compute CPF usage mode
- cap CPF OA usage accordingly
- adjust `cashRequired`
- update blocking reasons and guidance copy

On practice / compare:

- surface the same mode and cap

On actual buy:

- reject CPF amount requests above the calculated allowed amount

## Error Handling

The engine should fail clearly when:

- a refund path is impossible under the current simplified player profile
- a CPF request exceeds the prorated maximum
- a sale tries to resolve a claim that already expired

User-facing messaging should prefer plain language over acronyms alone.

Examples:

- `Lease is too short for full CPF use. Only a reduced CPF amount is available.`
- `You paid ABSD now. This run can recover it only if the first home is sold within 6 months.`
- `SSD applies because this property is being sold too soon after purchase.`

## Testing Strategy

### Unit tests

Expand:

- `src/engine/__tests__/stampDuty.test.ts`
- `src/engine/__tests__/purchaseRealism.test.ts`
- `src/engine/__tests__/actions.test.ts`

Add coverage for:

- pre- and post-`4 July 2025` SSD schedules
- zero SSD beyond holding-period threshold
- no SSD for commercial category
- married-couple refund creation
- married-couple refund earned
- married-couple refund expired
- single-senior concession creation
- single-senior concession blocked when replacement value is not lower
- full CPF eligibility when lease covers to `95`
- prorated CPF eligibility when lease is short but above `20 years`
- zero CPF eligibility when lease is `20 years or below`

### Save/load tests

Expand save migration / persistence coverage to ensure pending tax-relief state round-trips cleanly.

### UI verification

Smoke-check:

- property detail purchase preview
- compare / practice-buy output
- sale outcome messaging

## Success Criteria

This pack is successful when:

1. residential sales can no longer overstate proceeds by ignoring SSD
2. ABSD refund/concession flows teach upfront cash pain and conditional later relief
3. short-lease properties no longer present CPF as an all-or-nothing simplification except where the lease is `20 years or below`
4. previews, validation, and final actions all agree on the same rules
5. save files preserve any pending refund state correctly

## Risks

### Risk 1: Hidden complexity explosion

Mitigation:

- keep the supported remission cases intentionally narrow
- refuse to model unsupported legal edge cases implicitly

### Risk 2: Preview / action mismatch

Mitigation:

- ensure practice-buy and compare surfaces use the same purchase-validation outputs as the actual buy path

### Risk 3: Over-legalistic UX

Mitigation:

- explain consequences in plain language
- keep detailed rule copy behind existing learn / glossary / detail surfaces

## Source References

These official references were used to anchor this spec as of `7 May 2026`:

- IRAS `Additional Buyer's Stamp Duty (ABSD)`: [https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer%27s-stamp-duty-%28absd%29](https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/additional-buyer%27s-stamp-duty-%28absd%29)
- IRAS `Remission of ABSD for a Married Couple`: [https://www.iras.gov.sg/taxes/stamp-duty/for-property/appeals-refunds-reliefs-and-remissions/common-stamp-duty-remissions-and-reliefs-for-property/remission-of-absd-for-a-married-couple](https://www.iras.gov.sg/taxes/stamp-duty/for-property/appeals-refunds-reliefs-and-remissions/common-stamp-duty-remissions-and-reliefs-for-property/remission-of-absd-for-a-married-couple)
- IRAS `ABSD concession for single Singapore Citizen (SC) seniors`: [https://www.iras.gov.sg/taxes/stamp-duty/for-property/appeals-refunds-reliefs-and-remissions/common-stamp-duty-remissions-and-reliefs-for-property/absd-concession-for-single-singapore-citizen-%28sc%29-seniors](https://www.iras.gov.sg/taxes/stamp-duty/for-property/appeals-refunds-reliefs-and-remissions/common-stamp-duty-remissions-and-reliefs-for-property/absd-concession-for-single-singapore-citizen-%28sc%29-seniors)
- IRAS `Seller's Stamp Duty for Residential Properties` declaration reference: [https://www.iras.gov.sg/media/docs/default-source/uploadedfiles/pdf/declaration-form-ssd-for-residential-properties.pdf](https://www.iras.gov.sg/media/docs/default-source/uploadedfiles/pdf/declaration-form-ssd-for-residential-properties.pdf)
- CPF Board `How much CPF savings can I use for my property purchase?`: [https://www.cpf.gov.sg/service/article/how-much-cpf-savings-can-i-use-for-my-property-purchase](https://www.cpf.gov.sg/service/article/how-much-cpf-savings-can-i-use-for-my-property-purchase)

## Implementation Order

1. Pure stamp-duty and refund eligibility helpers
2. Purchase validation CPF / refund metadata
3. Buy/sell action integration
4. Save-schema persistence
5. UI explanation pass
6. Verification and playtest
