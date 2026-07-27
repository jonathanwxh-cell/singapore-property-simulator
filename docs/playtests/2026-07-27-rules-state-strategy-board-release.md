# Rules, State Integrity, and Strategy Board Release

**Date:** 2026-07-27  
**Issues:** #58, #59  
**Scope:** simulation correctness, save/action integrity, landlord consequences, and the main monthly play loop

## Outcome

This release replaces several placeholder or misleading state transitions with explicit,
tested transactions and makes the previously dormant Strategy Board the centre of the
monthly play screen. A player now sees three situational plans, why one is the best fit,
what stage of the property journey they are in, and what the last choice changed.

## Policy model updated

- CPF contributions and allocation now vary by age and residency. Singapore PRs select
  contribution year 1, 2, or 3; foreigners receive no employer CPF in the model.
- CPF extra interest is routed by age to the appropriate retirement balance.
- HDB concessionary loans use an 80% maximum LTV and 25-year term.
- Bank LTV and mandatory-cash requirements account for outstanding housing loans and
  the reduced caps that apply when tenure or borrower-age limits are exceeded.
- TDSR/MSR qualification uses a simplified 4% bank / 3% HDB assessment floor while
  actual instalments use the offered rate.
- Commercial BSD uses the current five marginal bands.

The simulator remains educational and simplified, not financial advice. The dated
primary references used for this pass are:

- [CPF allocation rates from January 2026](https://www.cpf.gov.sg/content/dam/web/employer/employer-obligations/documents/CPFAllocationRatesfromJanuary2026.pdf)
- [CPF contribution rates from 1 January 2026](https://www.cpf.gov.sg/content/dam/web/employer/employer-obligations/documents/CPFcontributionratesfrom1Jan2026.pdf)
- [CPF interest rates](https://www.cpf.gov.sg/service/article/what-are-the-cpf-interest-rates)
- [CPF contribution exemptions](https://www.cpf.gov.sg/service/article/who-is-exempted-from-receiving-cpf-contributions)
- [MoneySense: buying a property and loan limits](https://www.moneysense.gov.sg/buying-a-property-how-much-can-you-afford/)
- [HDB housing loan](https://www.hdb.gov.sg/buying-a-flat/flat-grant-and-loan-eligibility/housing-loan/housing-loan-from-hdb)
- [IRAS Buyer's Stamp Duty](https://www.iras.gov.sg/taxes/stamp-duty/for-property/buying-or-acquiring-property/buyer%27s-stamp-duty-%28bsd%29)

## Integrity and consequence fixes

- Loan payoff, refinancing, MediSave bills, personal loans, and property-sale choices now
  mutate the transaction they describe.
- Scenario options are accepted only for the current active scenario, only once, and only
  with finite values.
- Failed scenario checks no longer award half of a positive payout.
- Completed games remain completed after reload; resolved life moments remain resolved;
  a direct cold visit to `/end` cannot overwrite a genuine personal best.
- Player age and single-buyer eligibility progress with time.
- Market-rate pulses reprice active bank mortgages and move asking rent on vacant units.
- Room rental creates a real 12-month MOP-safe lease; lease expiry, renovation overrun,
  and recurring maintenance now have explicit consequences.
- Auto-save failures are visible instead of silent.

## Strategy Board and accessibility

- The play screen renders the five-stage journey, three responsive strategy choices, a
  best-fit callout, Play/Inspect actions, and a consequence recap.
- Mobile and desktop widths share one readable play column without horizontal overflow.
- Decision sheets expose dialog semantics, trap and restore keyboard focus, close on
  Escape, and use 44px minimum action targets.

## Verification

The release gate covers:

- ESLint and TypeScript static checks
- the complete Vitest suite, including dedicated CPF, LTV, purchase, stamp-duty,
  landlord-operation, ending, scenario, turn, and store-integrity cases
- the production Vite build
- guided smoke, persona-profile, and responsive-scroll browser runs
- manual 390px mobile and 1440px desktop inspection, including console and overflow checks

Production deployment and live-browser receipts are recorded in the pull request after
CI and deployment complete.
