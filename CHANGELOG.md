# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- **Repo metadata standardised**: `package.json` updated with proper name (`singapore-property-simulator`), version, description, license, repository, author, keywords, and homepage. Previously inherited the OKComputer scaffolding defaults (`my-app`, `0.0.0`).
- **Single lockfile**: removed `bun.lock`; `package-lock.json` is the canonical lockfile (matches the README's `npm install` instructions).

### Added
- `LICENSE` file (proprietary, all rights reserved per README intent).
- `.github/workflows/ci.yml` running lint (advisory) + test + build on push/PR to `main`.
- `.github/PULL_REQUEST_TEMPLATE.md` with summary, test plan, and changelog hint.
- README badges: CI status, license, version.

## [0.4.1] — 2026-05-01

### Changed
- Replaced live district, property, scenario, and title art with a cohesive grounded painterly game-art set.
- Rebuilt `title-logo.png` as a custom emblem-plus-type composition for cleaner in-game readability.

### Added
- Previously missing referenced assets: `market-trend-bg.jpg`, `scenario-boom.jpg`, and `scenario-market-crash.jpg`.

### Fixed
- Simulator progression and lint gate.

## [0.4.0] — 2026-04-30 — Singapore Realism Model

### Added
- **CPF (Central Provident Fund)** — age-bracket OA/SA/MA contributions, $6,800 wage ceiling, monthly-compounding interest (OA 2.5%, SA 4%, MA 4%), extra +1% on first $60k.
- **Stamp duty** — 6-tier marginal BSD plus ABSD by buyer profile (citizen / PR / foreigner) and property count.
- **LTV underwriting** — 75% / 45% / 35% caps for first/second/third+ housing loans.
- **MSR enforcement** — mortgage payment ≤ 30% of monthly income on HDB and EC purchases.
- **TDSR enforcement** — total debt servicing ≤ 55% of monthly income.
- **Mortgage amortization** — standard principal+interest, monthly payments, 30-year default term, credit-score floor at 400.
- **9 property types**: HDB BTO, HDB Resale, EC, Private Condo, Landed (Terrace/Semi-D/Bungalow), Commercial Shop, Commercial Office.

### Changed
- Engine architecture finalised — `src/engine/` is pure logic, no React imports, no side effects. `src/game/useGameStore.ts` (Zustand) is the impure shell.
- Save schema bumped to `SAVE_VERSION = 2`.

## [0.3.1]

### Fixed
- Restored amount/term/cost validation guards in actions.
- Made `loanId` monotonic via `turnCount + loans.length` to avoid collisions.

### Added
- Regression test coverage for restored guards and `loanId` uniqueness.
- Seeded PRNG (`rng.ts`) and vitest harness for deterministic action helpers.

## [0.1.0] — Initial commit

Singapore Property Simulator — first playable build with property catalogue, basic mortgage handling, and turn loop.

[Unreleased]: https://github.com/jonathanwxh-cell/singapore-property-simulator/compare/v0.4.1...HEAD
[0.4.1]: https://github.com/jonathanwxh-cell/singapore-property-simulator/compare/v0.4.0...v0.4.1
[0.4.0]: https://github.com/jonathanwxh-cell/singapore-property-simulator/compare/v0.3.1...v0.4.0
[0.3.1]: https://github.com/jonathanwxh-cell/singapore-property-simulator/releases/tag/v0.3.1
