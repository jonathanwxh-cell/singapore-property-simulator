# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **UX rescue pass**: Monthly Intent cards on the Home Command Center let players pick a cash, deal-hunting, recovery, or landlord-ops stance before advancing the month.
- **First Owner Checklist**: owned property detail pages now surface MOP-safe room rental, reserve protection, and return-to-plan actions immediately after purchase.
- **Dynamic market signals**: the Buy page now rotates deterministic district-heat, quiet-value, and expiring-lead cards by turn so browsing feels less static.
- **Singapore realism glossary expansion**: added HFE, COV, SORA, commercial BSD, and CPF refund explainers for first-home and commercial-property learning paths.
- **One-click beginner start**: title and New Game now offer a recommended Singapore Citizen BTO-upgrader run that lands directly in the Home Command Center.
- **Learning Layer 1.0**: a dedicated Learn hub, casual-player prerequisite framing, richer Singapore rule glossary entries, and inline glossary chips for ABSD, BSD, CPF OA, MOP, MSR, and TDSR.
- **Guided Command Center UX**: a tested monthly objective helper, `This Month` dashboard hero, persistent desktop/mobile `Next Month` CTA, grouped Home/Life/Buy/Own/Learn navigation, and progressive-detail panels that keep advanced systems available without overwhelming first-time players.
- **Run Director life arcs**: route-based new-game choices, dashboard Life Arc milestones, route-aware Decision Coach guidance, scenario weighting, portfolio route ribbons, and game-over replay recaps.
- `npm run test:scroll` browser regression test covering route-change scroll reset after navigating from long pages.
- **Singapore profile playability phase**: new-game buyer profiles for Singapore Citizens, PRs, foreigners, family/single/foreign-investor paths, and profile-aware first-home mission guidance.
- **First-home mission rail and rule glossary**: dashboard and property-detail surfaces now explain ABSD, CPF OA, MOP, room rental, MSR, TDSR, and reserves in plain English.
- `npm run test:profiles` browser automation covering Singapore Citizen, PR, foreigner, and young-single profile rule paths.
- **Guided playability coach phase**: dashboard next-best-move guidance, deal-readiness verdicts, property-card buy clarity, scenario impact previews, and life-action planning feedback.
- **Career & Eligibility Lite phase**: annual career reviews, job-switch scenarios, persistent first-home and private-home progression flags, and simplified executive condo eligibility rules.
- **Progression UI**: dashboard Career Review and Eligibility Summary surfaces, property-browser/detail eligibility badges, and a game-over progression recap.
- **Custom progression art**: dedicated `career-review-key-art.png` illustration for the career milestone flow.
- `How to Play` tutorial page with quickstart instructions and first-property guidance.
- Scripted Playwright smoke test covering tutorial routing, early scenario trigger, market feed visibility, and a first affordable purchase.
- `LICENSE` file for the repository.
- `.github/workflows/ci.yml` to run lint, test, and build on push and pull request.
- `.github/PULL_REQUEST_TEMPLATE.md` with summary, test-plan, and changelog prompts.
- README badges for CI status, license, and version.
- Hybrid life-planning systems including monthly actions, energy, stress, household load, career momentum, side gigs, and scheme-planning decisions.
- Reusable life-scene artwork for life planning surfaces, action cards, and month-outcome storytelling.
- Vector-first skyline-and-wordmark logo component retained as a reusable brand option.
- Expanded live Singapore market from 34 properties to 120+ fictional listings across all 28 districts, with full district coverage and six listing channels.
- Owned-property operating state including occupancy, vacancy streaks, maintenance drag, property tax, portfolio-aware scenarios, and the `Commercial Operator` progression path.
- Fictionalized real-estate development names while preserving Singapore districts, towns, MRT context, and policy realism.
- Expanded the market again to 120+ fictional listings so every district has deeper HDB, condo, landed, and commercial inventory.
- **Landlord Ops 2.0**: lease renewal decisions, rent-push vacancy risk, reserve-gap milestones, richer maintenance events, and new landlord/repair visual cards.

### Changed
- Property detail rule cheatsheets now show only terms relevant to the current property type, including commercial BSD for commercial assets instead of residential ABSD framing.
- Decision Coach now prioritizes MOP-safe room-rental setup immediately after buying an owner-occupied HDB, before generic route or cash-grind goals.
- New Game now treats the guided beginner run as the primary action, with the full setup wizard framed as customization.
- The Dashboard Learn tile now opens the Learn hub instead of the market page.
- The `Learn` navigation item now opens a beginner-friendly education hub instead of sending players to the market page.
- Dashboard, Buy, Own, and Life pages now lead with one modern-game-style decision surface before exposing detailed finance, market, landlord, and rule systems.
- Public property listing names are now fully fictional/composite while retaining real Singapore district, town, MRT, and policy context separately.
- Purchase eligibility and ABSD now follow the selected buyer profile instead of always assuming a Singapore Citizen.
- HDB ownership now presents as owner-occupied by default, with MOP-safe room-rental language separated from whole-flat rental.
- Updated the CPF wage ceiling and PR ABSD constants to the 2026/current Singapore rule table while keeping the default player profile as Singapore citizen.
- Property purchase flows now name the main blocker directly, such as TDSR, MSR, cash shortfall, or eligibility, instead of collapsing everything into a generic insufficient-funds state.
- **PropSim logo refresh**: kept the cleaned `PropSim Singapore` brand direction, restored the refreshed transparent logo asset, and updated visible brand labels.
- Standardized repository metadata in `package.json` with the proper package name, version, description, license, repository, author, keywords, and homepage.
- Removed `bun.lock`; `package-lock.json` is now the canonical lockfile.
- Added CI, version, and license badges to the README while preserving the updated gameplay and systems documentation.
- Replaced the old `Property Tycoon` title treatment with the cleaner `PropSim Singapore` title and HUD branding.
- Upgraded the property browser, market, portfolio, property detail, dashboard, and life-planning surfaces to expose listing channels, market context, affordability guidance, carrying costs, and life-state storytelling more clearly.
- Added visible simulation disclaimers in the tutorial and README to clarify that listing names, floor plans, yields, and scenarios are fictional educational game data.
- Property browsing now explains first-timer friendliness, upgrader tiers, EC eligibility, and salary-ceiling blockers.
- Purchase validation now supports CPF OA for eligible residential upfront costs and enforces simplified EC salary-ceiling and private-home-history rules.
- Early-game pacing now makes first purchases more reachable through starter homes and a first-home scenario.
- Smoke coverage now checks career review art and eligibility summary surfaces on top of the earlier pacing flow.
- Portfolio and property-detail surfaces now expose lease pressure, repair exposure, reserve gaps, and tenant-satisfaction tradeoffs as explicit landlord decisions.

### Fixed
- Mobile transaction pages no longer show the floating `Next Month` CTA over the buy action.
- Scenario `Continue` now returns players to the Home Command Center instead of leaving them on the long scenario library page.
- HDB homes still inside MOP now block sale attempts with explicit MOP copy.
- Commercial purchases now avoid residential ABSD and use simplified non-residential BSD tiers.
- The Learn hub bottom `Start Beginner Run` button now starts the guided run directly instead of routing to setup.
- The title screen can scroll on shorter screens so secondary onboarding actions remain reachable.
- Active scenarios can no longer be dismissed without choosing an outcome.
- Save slots are disabled until a run is active, preventing blank default saves.
- Life planning no longer allows the same action to be selected as both primary and secondary.
- Portfolio quick-rent now explains MOP-locked HDBs and opens the property detail room-rental path instead of silently no-oping.
- Bank TDSR cap display now rounds cleanly to `55%`.
- First residential purchases now become owner-occupied by default, while MOP-active public-housing homes block second residential buys with clear MOP-specific copy.
- Game-layout route changes now reset the scroll position so switching tabs/pages starts at the top instead of retaining the previous page's scroll depth.
- Blocked the legacy whole-flat rental shortcut for HDB flats still inside MOP, while keeping the explicit room-rental tenant strategy available.
- HDB room-rental leases now stay owner-occupied across monthly advancement instead of drifting into generic tenanted status.
- Portfolio now labels owner-occupied HDB holdings correctly, and room-rental lease resets no longer jump to whole-flat market rent.
- Disruptive renovations on HDB homes still inside MOP now return to owner-occupied status after completion instead of creating fake vacancy drag.
- Fixed CPF OA rounding in purchase actions so fractional starting CPF balances can no longer make a UI-ready buy fail internally by less than S$1.
- Mobile property-detail pages now keep the primary purchase action visible above the bottom navigation so first-time buying is not hidden below a long finance breakdown.
- Scenario pacing now guarantees an early first-home scenario and then fires scenarios on a stable cadence, preventing long droughts with no events.
- `How to Play` now opens a dedicated tutorial page instead of sending players to Settings.
- Dashboard and market views now show real monthly price, rental, and rate moves with matching headlines instead of hardcoded repeating percentage text.
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
