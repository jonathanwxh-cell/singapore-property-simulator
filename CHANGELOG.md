# Changelog

All notable changes to Property Tycoon: Singapore are documented here.

## 2026-05-02

### Added

- Expanded the live Singapore market from 34 to 80 listings across all 28 districts, with every district now carrying at least two browsable opportunities.
- Introduced listing channels and rarity metadata covering `New Launch`, `Resale`, `Auction`, `Distressed`, `Off-Market`, and `Signature` inventory.
- Added market intelligence helpers for district opportunity summaries, inventory coverage stats, and market mover callouts on the market page.
- Added owned-property operating state including occupancy status, vacancy streaks, maintenance drag, and property tax carrying costs.
- Added portfolio-aware scenario requirements so events can react to rented homes, aging leasehold assets, and real ownership posture.
- Added a new `Commercial Operator` achievement plus investor-route summaries such as `Heartland Landlord` and `Commercial Cashflow Operator`.

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
- Upgraded the property browser, property detail, portfolio, and market pages to surface channel tags, market context, carrying costs, and district coverage more clearly.

## 2026-05-01

- Replaced the live district, property, scenario, and title art used by the app with a cohesive grounded painterly game-art set.
- Added the previously missing referenced assets `market-trend-bg.jpg`, `scenario-boom.jpg`, and `scenario-market-crash.jpg`.
- Rebuilt `title-logo.png` as a custom emblem-plus-type composition for cleaner in-game readability.
