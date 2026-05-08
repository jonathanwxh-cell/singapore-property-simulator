# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Added a structured **Singapore: A Lifetime** roadmap and `Lifetime Shell v1` implementation handoff so the next product direction is documented around named endings, life memories, causal scenarios, cultural texture, and gradual README updates without discarding the current property engine.

## [0.6.0] - 2026-05-08

### Added
- **Beginner clarity and mobile UX pass**: guided focus cards now explain how to read Dashboard, Buy, and Own screens in plain English, while spendable-versus-reserved cash language is surfaced more clearly during early runs and deal reviews.
- **Guidance-first mobile More sheet**: the mobile shell now opens secondary tabs inside a grouped bottom sheet with clearer route purpose text for Market, Bank, Scenarios, Save, Leaderboard, and Settings.
- **Active MOP / Next Home v1**: owner runs now get a Dashboard gateway for Property #2 planning, a readiness tracker with bottleneck callouts, and MOP-specific monthly intents for home projects, income runway, market study, and room-rental setup.
- **MOP 2.0 v1**: first-home owners now carry monthly-intent context through recap generation, get a continuing `First MOP Campaign` after purchase, and can advance to the next notable month instead of blindly blitzing fixed time.
- **MOP 2.1 chaptered ownership**: active-MOP runs now surface `Settle In`, `Stabilise Income`, `Prepare Upgrade`, and `Line Up Exit` chapters with visible ownership-track progress, chapter-aware monthly intent rotation, and notable-month stopping on chapter beats.
- **MOP 2.2 ownership forks and shortlist**: active-MOP runs now get chapter-specific fork cards, players can pin up to three future-home targets from Buy and Property pages, and fork months now leave visible recap and property-state consequences.
- **MOP 2.3 chapter beats**: active-MOP runs now surface visible pressure/upside beats, derive a third signal-driven fork from the current chapter state, and let `Next chapter beat` stop on changing ownership momentum instead of only generic notable-month signals.
- **MOP 2.4 target urgency and payoffs**: active-MOP runs now frame a lead target versus a challenger, surface urgency states like `Window Open` and `Watch Closely`, celebrate payoff milestones such as reserve security and shortlist lock-in, and let skip logic stop when rivalry or payoff state changes.
- **Landlord depth phase**: renovation cards now support budget / balanced / premium contractor routes with ROI previews, tenant months can generate deterministic upside or warning events, and the portfolio shows a landlord-health score with a concrete next-priority callout.
- **Wealth During Wait phase**: the Life screen now tracks side-gig and property-hustle income engines across months, shows a clear income mix, and explains which extra-income moves actually moved the run closer to the next home.
- **Rules correctness pack**: residential sales now model SSD, qualifying married-couple and single-SC-senior replacement runs can track pending ABSD refunds, and short-lease residential buys now surface full / reduced / blocked CPF OA usage.

### Changed
- The title screen and new-game setup now frame the guided run as the cleanest first play, with stronger onboarding language for casual players who do not already know CPF, MOP, or stamp-duty terms.
- Mobile shell spacing now respects safe-area padding more consistently, keeping the bottom nav, floating advance CTA, and More menu from crowding content on narrow phones.
- Monthly Intent recommendations now pivot into an active-MOP planning loop once a player owns an HDB inside MOP, instead of staying on the generic cash/deal/career trio.
- The guided MOP fast path now performs small safe ownership moves for room rental and starter home projects before advancing the month, while recaps describe the chosen MOP track instead of flattening back into generic side-income language.
- Active-MOP dashboard guidance now changes shape as the run matures, promoting room-rental and reserve setup early, then upgrade prep and exit-intel later instead of repeating the same card order for the entire five-year stretch.
- Active-MOP planning is now less abstract: the dashboard can point market-study months at real shortlisted homes, while fork beats such as neighbour referrals or launch previews make the first 60 months feel more like staged ownership chapters.
- Active-MOP panels now explain what is currently brewing inside the chapter, including reserve pressure, shortlist blur, school-zone urgency, valuation tailwinds, and the number of months until the next chapter beat rotates.
- Active-MOP planning now reads more like a real chase than a static savings meter, with lead-target versus challenger framing, fit labels, and visible next-payoff callouts that reward smart realistic play.
- Property Operations now frames upgrades as contractor tradeoffs instead of a single flat renovation path, so owned months teach timing, cash, and yield tension more clearly.
- Life-month recaps now break cash movement down by source so players can see whether progress came from salary focus, side gigs, property hustle, schemes, or expensive household/training choices.
- CI Node runtime upgraded from 20 to 22 LTS.
- Dependabot now ignores major-version bumps for `tailwindcss`, `vite`, `@eslint/js`, and `typescript`, and the unused `deps:locked` label was dropped.

### Fixed
- Purchase-readiness CPF previews now match the real buy action by capping CPF OA usage at the eligible down-payment amount instead of incorrectly offsetting stamp duties or levy.
- Fast residential sales no longer overstate net proceeds by ignoring SSD, and qualifying ABSD refund paths now teach pay-now / recover-later cashflow instead of acting like an instant waiver.
- Dashboard beginner-panel smoke test now uses `expectAnyVisible`, eliminating false positives from minor copy variations.

## [0.5.0] - 2026-05-07

### Added
- **Guidance and longevity route pass**: Dashboard now has a "First 3 Moves" quest rail with reward beats, property detail pages include a non-mutating Practice Purchase simulation, BTO listings show an HFE-to-key-collection timeline, and New Game includes a 55+ Rightsizer route.
- **Senior Singapore realism layer**: added CPF 55, lease-buyback, and Silver Housing Bonus glossary concepts, plus CPF Full Retirement Sum reference checks inside the senior rightsizing readout.
- **Market district drilldown**: Market heatmap cells and opportunity cards now navigate directly into district-filtered Buy listings.
- **Mobile More menu**: mobile navigation now exposes Market, Bank, Save, Scenarios, Leaderboard, and Settings without crowding the primary Home/Life/Buy/Own/Learn bar.
- **Practice deal comparison**: Buy page now includes a "Compare Before You Buy" panel, route-aware suggested shortlist, and listing-card compare toggles so players can rehearse cash, duties, surplus, yield, worst case, and next fixes before committing.
- **First 10 Minutes + Fun Loop 2.0**: research-backed onboarding spec, Dashboard last-month recap, beginner advanced-panel gate, mechanics-reference formulas, and explicit next-fix guidance for blocked purchases.
- **Mega playtest response pass**: accessibility display modes, foreigner-safe deal recommendations, self-employed income volatility, and bank income-haircut explainers based on the 15-persona report.
- **Finance realism priority pass**: HDB concessionary starter-stage financing, CPF OA grant credits, MOP countdown with quiet-month blitzing, compact mode, explicit worst-case listing readouts, and HDB resale-levy explainers.
- **Local profiles and phone transfer saves**: Save / Load now supports multiple player profiles, profile-scoped autosaves and slots, whole-profile export/import files, and copyable transfer bundles for moving runs across iPhone, Android, and desktop browsers.
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
- Replaced the misleading top-bar pause toggle with a Learn/Guide button, because the game is turn-based and time only moves when the player advances the month.
- The Learn hub now frames 55+ rightsizing as a replayable route alongside first-home, PR, foreign-investor, landlord, commercial, and FIRE paths.
- Monthly Intent now separates "Use plan + advance" from "Open first" so beginners can inspect Life/Buy/Own before time moves.
- New Game career cards now show the difficulty-adjusted starting salary so Tycoon and Hard runs no longer look like the career salary changed mysteriously after start.
- ABSD glossary guidance now surfaces the simplified SC/PR/foreigner rate ladder, including PR second-home and foreigner residential friction.
- Entrepreneur and property-agent careers now have variable monthly income, while mortgage checks use a simplified 70% bank-assessable income haircut.
- Housing grant scenarios now credit CPF OA instead of spendable cash, and scenario previews distinguish CPF OA support from cash windfalls.
- Purchase math now exposes explicit ABSD rates, HDB resale-levy estimates, financing mode, and loan interest so property cards teach the blocker instead of hiding it in totals.
- Single-under-35 HDB blockers now name practical alternate routes: private property, family nucleus, or waiting for the 35+ single-buyer resale path.
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
- New guided onboarding pathways now route new profiles through profile-appropriate starter routes and starter listings, while dashboard primer and settings now include "guided mode" controls to reduce first-run overwhelm for casual players.

### Fixed
- v1 save files (shipped in v0.4.0, 2026-04-30) now load and auto-upgrade to the current save version on the next write. Previously v1 saves silently failed validation and the player's auto-save vanished after upgrading to v0.4.x.
- Insolvency detection now compares take-home pay against the full monthly obligation (loans + property maintenance + property tax + household costs), not just loan payments. Previously a player crushed by ownership costs or household burden could remain "solvent" indefinitely as long as their loan alone fit within take-home.
- CPF extra +1% interest now splits between OA and SA per MOM rules: the OA portion is capped at the first $20k of OA balance and accrues to OA; the remainder of the $60k threshold accrues to SA. Previously the entire extra interest was credited to OA only.
- HDB concessionary financing now uses the current 75% LTV / 25% down-payment model throughout purchase validation, decision coaching, glossary copy, and tests.
- Residential ABSD now counts residential holdings only, so commercial shops/offices do not accidentally make the next residential purchase look like a second home.
- HDB resale-levy estimates now require subsidised-housing history instead of any generic first-home history.
- CPF 55 rightsizing copy now separates estimated Retirement Account set-aside from withdrawable CPF above that set-aside.
- Manual Load now promotes the loaded checkpoint into the active autosave, so refreshing after loading a slot does not jump back to newer progress.
- Mobile property-detail pages now show a compact purchase snapshot before the tall image hero, keeping the first Buy action visible on narrow iPhone-style screens.
- Mobile bottom navigation now compresses safely at 320px widths after the More menu addition.
- The first-run quest CTA now scrolls directly to Monthly Intent instead of feeling like a dead-end dashboard action.
- Foreigner profiles are no longer steered toward HDB/EC listings by the best-next-buy recommendation engine when private or commercial paths are more appropriate.
- The marriage scenario now includes a no-cash safe option so low-cash Tycoon players cannot be soft-locked by three unaffordable choices.
- The Buy page hero action buttons now stay above the mobile bottom navigation after the finance-realism additions.
- Mobile scenario dialogs now align from the top and scroll inside the overlay, preventing clipped choices on short iPhone and Android screens.
- Mobile Dashboard and Life advance-month CTAs now stay in the content flow and clear the bottom navigation, including short Android-style viewports.
- Mobile property purchase pages now keep the `Buy Property` CTA in-flow instead of pinning it over purchase math and deal explanations.
- The Buy page hero now uses tighter mobile artwork and spacing so `Review Deal` and `Starter List` remain reachable above the bottom nav.
- Portfolio and Learn no longer show a floating advance-month CTA over bottom content on mobile.
- New Game wizard steps reset scroll position when moving forward, preventing the next step from opening halfway down the screen.
- Lease decisions can now only be made once per property per month, closing a repeat-click tenant satisfaction exploit.
- Title-screen `Continue` is disabled when no autosave exists, and Learn previews opened from setup now include a return path back to setup.
- Title-screen beginner help is now promoted above secondary menu actions, and HUD/filter controls have larger mobile tap targets.
- Desktop Dashboard and Life routes no longer duplicate `Next Month` in both the page hero and sidebar.
- Mobile dashboard now suppresses the duplicate floating `Next Month` CTA when the Command Center hero already provides an inline advance button, keeping Spendable Cash and Monthly Surplus readable on iPhone Safari.
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

[Unreleased]: https://github.com/jonathanwxh-cell/singapore-property-simulator/compare/v0.6.0...HEAD
[0.6.0]: https://github.com/jonathanwxh-cell/singapore-property-simulator/compare/v0.5.0...v0.6.0
[0.5.0]: https://github.com/jonathanwxh-cell/singapore-property-simulator/compare/v0.4.1...v0.5.0
[0.4.1]: https://github.com/jonathanwxh-cell/singapore-property-simulator/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/jonathanwxh-cell/singapore-property-simulator/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/jonathanwxh-cell/singapore-property-simulator/releases/tag/v0.3.1
