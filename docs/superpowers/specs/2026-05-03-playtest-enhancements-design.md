# Playtest Enhancement Design

Date: 2026-05-03
Source: `docs/superpowers/playtests/2026-05-03-live-playtest.md`

## Summary

The latest playtest shows that the game is moving in the right direction: life planning gives the opening more agency, the closest-property path is useful, and the market/property surfaces now feel meaningfully alive. The next pass should focus on integrity and player motivation rather than adding another broad system.

The recommended scope is:

1. Fix the bank exploit and make borrowing purpose-bound.
2. Clean up remaining finance formatting and trust signals.
3. Make scenario resolution return the player to the gameplay loop.
4. Add predictive life-action previews.
5. Add career-specific monthly beats and first-property milestones.

## Goals

- Prevent unsecured repeat loans from bypassing the intended property ladder.
- Preserve realistic Singapore-style borrowing constraints without turning the bank into a full banking simulator.
- Help players understand the likely consequences of life actions before ending the month.
- Make careers feel different during ordinary monthly play, not only through starting salary.
- Make realistic starts feel more rewarding before first ownership.

## Non-Goals

- No full CPF revamp.
- No new property catalog expansion in this pass.
- No new major art pipeline.
- No multiplayer, economy rebalance for endgame, or save-system migration beyond what is required for safe defaults.

## Priority 1: Bank And Credit Integrity

### Current Problem

The `Bank` page lets the player repeatedly click `Apply for Loan`, creating unlimited `personal` loans and immediately adding the principal to cash. This breaks the economy because it lets the player skip the intended life-to-property ladder.

### Design

The bank should become a debt-management and borrowing-readiness surface, not a direct cash generator.

Rules:

- Mortgages are created only through property purchases.
- Renovation loans must be tied to an owned property.
- Personal loans are not directly available from the regular bank UI.
- Emergency personal borrowing can still exist through explicit scenario outcomes later, but it should be purpose-bound and not a repeatable bank action.
- `applyLoanPure` should reject direct `personal` loans unless a future explicit scenario-purpose API is introduced.

Bank UI changes:

- Rename `Apply for Loan` to `Borrowing Readiness`.
- Keep the amount/term sliders as planning tools if useful.
- Show estimated monthly payment, projected TDSR, next-property LTV, and credit eligibility.
- Replace the active `Apply for Loan` button with a navigation CTA such as `Browse Properties`.
- Keep loan repayment fully functional.

Acceptance criteria:

- Repeated bank clicks cannot increase cash.
- Unit tests prove direct `personal` loans are rejected.
- Buying property still creates mortgages normally.
- Paying loans still works.

## Priority 2: Finance Formatting Polish

### Current Problem

The bank screen shows `TDSR (55.00000000000001% cap)`.

### Design

All finance percentage labels should use `formatPercent`.

Acceptance criteria:

- Bank displays `TDSR (55% cap)`.
- Existing format tests continue to cover floating-point artifacts.
- No raw `TDSR_LIMIT * 100` label string remains in JSX.

## Priority 3: Scenario Flow Coherence

### Current Problem

After resolving a scenario, `Continue` leaves the player on the `Scenarios` index. The code also allows the scenario modal close button to clear an unresolved current scenario, which can let a player skip events.

### Design

Scenario events should behave like part of the monthly loop.

Rules:

- The active scenario modal should require choosing an option.
- Closing an unresolved scenario should not clear `currentScenario`.
- After a scenario is resolved, `Continue` should return to `/dashboard`.
- The scenario index can remain available as a library/history-style screen when there is no active event.

Acceptance criteria:

- A pending scenario cannot be skipped with the close button.
- Resolving an event returns the player to dashboard.
- `currentScenario` is cleared only after a selected option resolves.

## Priority 4: Predictive Life-Action Previews

### Current Problem

Life actions are more fun now, but they still ask the player to infer too much. The player sees flavor text, then only learns cash, energy, stress, reputation, and scheme impact after advancing the month.

### Design

Each action card should show a compact expected impact preview before selection.

Preview data should come from engine logic, not duplicated UI guesses:

- cash range or expected value
- energy delta
- stress delta
- reputation or career-momentum delta when relevant
- scheme progress delta when relevant
- whether the action can unlock a secondary action next month

The preview does not need to reveal exact RNG results. It should communicate useful direction and magnitude.

Acceptance criteria:

- Life action cards show expected cash/energy/stress impact.
- Preview logic is covered by unit tests.
- The selected action hero and monthly snapshot reuse the same preview helper.

## Priority 5: Career Identity And First-Property Motivation

### Current Problem

Careers still feel lighter than they should in ordinary play. `Tech Professional` and `Property Agent` differ through salary and action modifiers, but the moment-to-moment story does not diverge strongly enough.

### Design

Add small career-specific monthly beats that can trigger from life actions. These should be lightweight, deterministic enough to test, and integrated into the existing life-month summary rather than becoming another scenario deck.

Examples:

- `Tech Professional`: freelance sprint, certification bump, startup crunch, stock-comp refresh.
- `Property Agent`: tenant-placement fee, buyer referral, dry viewing weekend, developer preview invite.
- `Banking & Finance`: bonus month, market desk pressure, client referral, compliance crunch.
- `Civil Service`: stable increment, training nomination, policy-cycle workload.
- `Medical Professional`: locum shift, fatigue pressure, training residency milestone.
- `Entrepreneur`: contract win, dry month, grant application progress, supplier issue.
- `Fresh Graduate`: first raise, upskill discount, networking referral.

First-property milestones should make the opening feel less empty:

- `Eligibility Packet Ready`
- `Bank IPA Prepared`
- `Viewing Shortlist Built`
- `Option Fee Ready`

These milestones should appear as progress states tied to cash shortfall, scheme progress, and life actions. They should mostly reward clarity, reputation, or small cash boosts rather than free property money.

Acceptance criteria:

- At least three careers have distinct monthly beats in the first implementation pass.
- Normal starts can see some kind of milestone or beat within the first two months.
- Life-month summaries show career-specific notes when a beat triggers.
- The closest-property path remains the main early-game target.

## Recommended Implementation Order

1. Fix the bank exploit and TDSR formatting.
2. Fix scenario return and skip behavior.
3. Add life-action preview helpers and UI.
4. Add career-specific monthly beats for `Tech Professional`, `Property Agent`, and `Fresh Graduate`.
5. Add first-property milestone display.
6. Run a browser playtest covering `Tech Professional / Normal`, `Property Agent / Easy`, and `Fresh Graduate / Hard`.

## Testing Strategy

- Unit-test loan rejection, mortgage creation, and payment behavior in `src/engine/__tests__/actions.test.ts`.
- Unit-test preview output in `src/engine/__tests__/life.test.ts`.
- Unit-test formatting in `src/lib/__tests__/format.test.ts`.
- Use browser playtesting to verify:
  - Bank no longer creates free cash.
  - Property purchase still works.
  - Scenario resolution returns to dashboard.
  - Life action cards communicate consequences clearly.
  - Career beats appear without overwhelming the monthly loop.

## Self-Review

- Scope is focused on the issues exposed by the May 3 playtest.
- The bank exploit is treated as mandatory before fun-factor additions.
- The plan avoids a full banking simulator and keeps borrowing rules purpose-bound.
- No placeholders or unresolved requirements remain.
