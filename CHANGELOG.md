# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- `LICENSE` file for the repository.
- `.github/workflows/ci.yml` to run lint, test, and build on push and pull request.
- `.github/PULL_REQUEST_TEMPLATE.md` with summary, test-plan, and changelog prompts.
- Hybrid life-planning systems including monthly actions, energy, stress, household load, career momentum, side gigs, and scheme-planning decisions.
- Reusable life-scene artwork for life planning surfaces, action cards, and month-outcome storytelling.
- Vector-first skyline-and-wordmark logo system for the title screen and HUD.
- Expanded live Singapore market from 34 properties to 80 listings across all 28 districts, with full district coverage and six listing channels.
- Owned-property operating state including occupancy, vacancy streaks, maintenance drag, property tax, portfolio-aware scenarios, and the `Commercial Operator` progression path.

### Changed
- Standardized repository metadata in `package.json` with the proper package name, version, description, license, repository, author, keywords, and homepage.
- Removed `bun.lock`; `package-lock.json` is now the canonical lockfile.
- Added CI, version, and license badges to the README while preserving the updated gameplay and systems documentation.
- Replaced the old raster title emblem with the reusable `GameLogo` component on the title screen and HUD.
- Upgraded the property browser, market, portfolio, property detail, dashboard, and life-planning surfaces to expose listing channels, market context, affordability guidance, carrying costs, and life-state storytelling more clearly.

### Fixed
- Centralized property purchase validation so the property detail UI and reducer use the same affordability and financing rules.
- Fixed the silent property purchase failure by ensuring successful purchases mutate persisted state, create the mortgage, unlock achievements, and route cleanly into the portfolio flow.
- Preserved the corrected net worth formula across HUD, dashboard, portfolio, save/load flows, and game-over calculations.
- Corrected shortfall calculations to use exact upfront cash requirements including down payment, BSD, and ABSD where applicable.
- Fixed first-turn scenario triggering, pending-scenario overwrites, and save/continue flow inconsistencies.
- Cleaned up percentage and currency formatting to avoid floating-point artifacts such as `55.00000000000001%`.

### Improved
- Added clearer purchase rejection reasons for LTV, TDSR, MSR, ownership, and cash-shortfall blockers.
- Improved slider usability by preventing accidental text selection during drag interactions.
- Expanded regression coverage for purchase validation, store updates, formatting, selector math, turn progression, and the life-sim layer.

## [0.4.1] - 2026-05-01

### Changed
- Replaced live district, property, scenario, and title art with a cohesive grounded painterly game-art set.
- Rebuilt `title-logo.png` as a custom emblem-plus-type composition for cleaner in-game readability.

### Added
- Previously missing referenced assets: `market-trend-bg.jpg`, `scenario-boom.jpg`, and `scenario-market-crash.jpg`.

### Fixed
- Simulator progression and lint gate.

## [0.4.0] - 2026-04-30 - Singapore Realism Model

### Added
- **CPF (Central Provident Fund)** - age-bracket OA/SA/MA contributions, $6,800 wage ceiling, monthly-compounding interest (OA 2.5%, SA 4%, MA 4%), extra +1% on first $60k.
- **Stamp duty** - 6-tier marginal BSD plus ABSD by buyer profile (citizen / PR / foreigner) and property count.
- **LTV underwriting** - 75% / 45% / 35% caps for first/second/third+ housing loans.
- **MSR enforcement** - mortgage payment <= 30% of monthly income on HDB and EC purchases.
- **TDSR enforcement** - total debt servicing <= 55% of monthly income.
- **Mortgage amortization** - standard principal+interest, monthly payments, 30-year default term, credit-score floor at 400.
- **9 property types**: HDB BTO, HDB Resale, EC, Private Condo, Landed (Terrace/Semi-D/Bungalow), Commercial Shop, Commercial Office.

### Changed
- Engine architecture finalized - `src/engine/` is pure logic, with no React imports and no side effects. `src/game/useGameStore.ts` (Zustand) is the impure shell.
- Save schema bumped to `SAVE_VERSION = 2`.

## [0.3.1]

### Fixed
- Restored amount/term/cost validation guards in actions.
- Made `loanId` monotonic via `turnCount + loans.length` to avoid collisions.

### Added
- Regression test coverage for restored guards and `loanId` uniqueness.
- Seeded PRNG (`rng.ts`) and Vitest harness for deterministic action helpers.

## [0.1.0] - Initial commit

Singapore Property Simulator - first playable build with property catalog, basic mortgage handling, and turn loop.

[Unreleased]: https://github.com/jonathanwxh-cell/singapore-property-simulator/compare/v0.4.1...HEAD
[0.4.1]: https://github.com/jonathanwxh-cell/singapore-property-simulator/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/jonathanwxh-cell/singapore-property-simulator/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/jonathanwxh-cell/singapore-property-simulator/releases/tag/v0.3.1
