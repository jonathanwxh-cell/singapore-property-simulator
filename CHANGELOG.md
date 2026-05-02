# Changelog

All notable changes to Property Tycoon: Singapore are documented here.

## 2026-05-02

### Fixed

- Centralized property purchase validation so the property detail UI and reducer use the same affordability and financing rules.
- Fixed the silent property purchase failure by ensuring enabled purchases mutate persisted state, create the mortgage, unlock achievements, and route cleanly to the portfolio flow.
- Preserved the corrected net worth formula across HUD, dashboard, portfolio, save and load flows, and game over calculations.
- Corrected shortfall calculations to use exact upfront cash requirements including down payment, BSD, and ABSD where applicable.
- Fixed first-turn scenario triggering, pending scenario overwrites, and save or continue flow inconsistencies.
- Cleaned up percentage and currency formatting to avoid floating-point artifacts such as `55.00000000000001%`.

### Improved

- Added clearer purchase rejection reasons for LTV, TDSR, MSR, ownership, and cash shortfall blockers.
- Improved slider usability by preventing accidental text selection during drag interactions.
- Expanded regression coverage for purchase validation, store updates, formatting, selector math, and turn progression.

## 2026-05-01

### Added

- Deterministic engine test harness coverage for finance and action flows.
- CPF contribution and growth rules, BSD and ABSD stamp duty support, and mortgage underwriting constraints including LTV, TDSR, and MSR.
- Centralized numeric formatting helpers for money and percentage displays.
- Achievement rule evaluation and progression tracking.
- Project documentation covering gameplay, realism assumptions, architecture, and repository structure.

### Fixed

- Net worth now subtracts outstanding debt instead of overstating progress.
- State changes now recompute net worth and achievements reliably after purchases, loans, and related actions.
- Purchase, TDSR, and loan repayment math was normalized across engine and UI flows.
- Bank sliders, payment caps, dashboard metrics, portfolio holdings, and market formatting were cleaned up for consistency.
- Property detail shortfall display was corrected and image fallback handling was made more robust.
- Route transition polish removed stale-page flashes during navigation.

### Testing

- Added regression suites for finance, ABSD, achievements, formatting, action guards, and loan ID generation.

## 2026-04-30

### Added

- Initial Singapore Property Simulator project scaffold with the first playable property, finance, and progression loop.
