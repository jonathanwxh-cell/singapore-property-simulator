# Singapore Property Simulator

[![CI](https://github.com/jonathanwxh-cell/singapore-property-simulator/actions/workflows/ci.yml/badge.svg)](https://github.com/jonathanwxh-cell/singapore-property-simulator/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-0.6.0-green.svg)](CHANGELOG.md)
[![License: Proprietary](https://img.shields.io/badge/license-proprietary-lightgrey)](LICENSE)

A single-player turn-based property investment game set in Singapore's real estate market. Buy HDB flats, executive condos, private condos, landed homes, and commercial shophouses — while navigating CPF rules, stamp duties, mortgage underwriting, cooling measures, and market cycles.

**Built with** React 19 · TypeScript · Vite · Zustand · Tailwind CSS · Vitest

---

## Gameplay

You start with a career, modest savings, a selectable buyer profile, and a guided life arc such as BTO Upgrader, Single 35 Resale Buyer, PR Private-Market Climber, Heartland Landlord, Commercial Operator, or FIRE Homeowner. Each turn is one month. Your goal: reach the target net worth before insolvency strikes you out.

### Product Direction

The long-term direction is **Singapore: A Lifetime**: a realistic Singapore life tycoon built on top of the current property and finance engine. The simulator is not being rewritten; CPF, loans, stamp duties, MOP, buyer profiles, landlord operations, and market cycles remain the foundation while future phases add named endings, life memories, cultural texture, and replay identity.

The detailed roadmap lives in [docs/roadmap/singapore-a-lifetime-roadmap.md](docs/roadmap/singapore-a-lifetime-roadmap.md), and the first implementation handoff is [docs/superpowers/plans/2026-05-08-lifetime-shell-v1.md](docs/superpowers/plans/2026-05-08-lifetime-shell-v1.md). README gameplay sections should continue to describe only shipped behavior as each phase lands.

### Core Loop

The current build includes a Decision Coach layer across the dashboard, property browser, property detail, scenarios, and life-planning screens. It explains the next sensible move, deal blockers, expected life-action effects, and scenario upside/downside before players commit.

The dashboard also includes a first-home mission rail and a plain-English rule glossary so players can understand CPF OA, ABSD, MOP, room rental, MSR, TDSR, and reserves without leaving the game flow. A dedicated Learn hub and inline glossary chips make the sim approachable for casual tycoon players with no prior Singapore property knowledge.

The latest guidance pass adds a "First 3 Moves" quest rail, celebratory reward beats, a practice-purchase simulation on property detail pages, BTO/HFE timeline cards, mobile More navigation, and a 55+ Rightsizer route for CPF-after-55 and retirement-runway playthroughs.

The latest MOP 2.2 pass adds chapter-specific ownership forks and a concrete next-home shortlist. Players can now pin future targets from Buy or Property pages, see them inside the dashboard's active-MOP flow, and play focused beats such as `Neighbour Referral`, `Starter Works Window`, and `Launch Preview Weekend` so the first 60 months feel more like a property campaign than a long wait.

The latest MOP 2.3 pass adds visible chapter beats on top of that flow. Active-MOP owners now see what pressure is building, what upside is opening, how many months remain until the next beat rotates, and a third signal-driven fork such as `Reserve Catch-Up`, `Shortlist Sprint`, or `School Zone Commit` so the first 60 months feel more alive even when no giant scenario fires.

The latest MOP 2.4 pass turns that into a clearer chase. The dashboard now frames a `lead target` versus a `challenger`, marks urgency states such as `Window Open` or `Watch Closely`, and celebrates realistic payoff moments like `Reserve secured`, `Shortlist locked`, and `Lead target reachable` so MOP progress feels more satisfying without abandoning Singapore-flavoured realism.

1. **Earn** — Monthly salary (career-dependent) flows in after CPF deductions
2. **Buy** — Browse 120+ fictional live listings across 9 property types, 28 districts, and 6 listing channels
3. **Finance** — Take mortgages, manage LTV caps and TDSR/MSR limits
4. **Operate** — Sign tenants, renew or reprice leases, manage repairs, protect reserves, and choose upgrade plans
5. **Advance Turn** — Market moves, loans amortize, CPF compounds, ownership costs hit, and portfolio-aware events fire
6. **React** — Scenario events (market crashes, cooling measures, tenant defaults, leasehold pressure, renovation opportunities) present choices with probabilistic outcomes

### Save Profiles & Phone Transfer

The Save / Load hub supports multiple local player profiles on the same device. Each profile has its own autosave and five manual slots, so different people can play without overwriting each other.

Cross-device continuation is supported through manual profile transfer:

1. Open **Save / Load Game** on the old phone.
2. Choose the player profile.
3. Use **Download Profile** or **Copy Code** under Cloud / Phone Transfer.
4. Send the file or code through iCloud Drive, Google Drive, AirDrop, WhatsApp, email, or another trusted channel.
5. Open the game on the new phone and use **Import Profile**.

This is not account-based cloud sync yet. It is a cloud-drive-friendly transfer bundle that works across iPhone, Android, and desktop browsers without a login.

### Guided Life Arcs

Run Director turns each playthrough into a clearer Singapore property story. Routes guide what the Decision Coach prioritizes, how milestones are framed, which scenario themes get extra weight, and what the endgame recap recommends for the next replay. Routes are advisory rather than restrictive: the simulator still lets players make any purchase or operating move that passes the underlying eligibility and affordability rules.

Beginner-friendly routes include `BTO-to-Condo Upgrader`, `Single 35 Resale Buyer`, and `55+ Rightsizer`. More advanced routes include `PR Private-Market Climber`, `Foreign Investor`, `Heartland Landlord`, `Commercial Operator`, and `FIRE / Debt-Free Homeowner`.

### Win / Lose

| Condition | Result |
|-----------|--------|
| Net worth ≥ difficulty target | **Win** |
| Cash negative + income < debt for 3 consecutive turns | **Bankrupt** |

---

## Difficulty Levels

| Difficulty | Starting Cash | Salary Mod | Volatility | Interest | Target Net Worth |
|------------|--------------|------------|------------|----------|-----------------|
| Easy | $200k | 1.5× | Low (8%) | 1.5% | $5M |
| Normal | $50k | 1.0× | Medium (12%) | 2.5% | $15M |
| Hard | $10k | 0.8× | High (20%) | 3.5% | $30M |
| Tycoon | $0 | 0.6× | Extreme (25%) | 4.5% | $50M |

---

## Careers

| Career | Starting Salary | Growth | Risk |
|--------|---------------|--------|------|
| Fresh Graduate | $3,500 | 4% | Low |
| Civil Service | $4,000 | 3.5% | Very Low |
| Tech Professional | $5,500 | 7% | Low |
| Banking & Finance | $6,000 | 6% | Medium |
| Medical Professional | $6,500 | 5% | Very Low |
| Property Agent | $2,500 | 10% | High |
| Entrepreneur | $2,000 | 12% | Very High |

---

## Property Types (120+ fictional listings)

| Type | Price Range | Rental Yield | Example |
|------|------------|-------------|---------|
| HDB BTO | $265k–$520k | 4.8–5.9% | Northstar Grove |
| HDB Resale | $295k–$850k | 4.0–5.5% | Bukit Merah View |
| Executive Condo | $1.0M–$1.42M | 3.5–4.1% | Beacon Grove EC |
| Private Condo | $980k–$4.2M | 2.4–4.3% | Moonrail Grove Residences |
| Landed Terrace | $2.95M–$4.3M | 2.0–2.4% | East Coast Garden Terrace |
| Landed Semi-D | $5.8M–$7.6M | 1.6–1.8% | Holland Grove |
| Landed Bungalow | $22M–$45M | 1.0–1.5% | Sentosa Cove |
| Commercial Shop | $3.2M–$12M | 3.0–4.3% | Palmcrest Grove Retail House |
| Commercial Office | $1.85M–$6.8M | 3.4–5.0% | Jurong Gateway Office |

The market now spans all 28 defined districts with at least 2 live listings each. Inventory is grouped into `New Launch`, `Resale`, `Auction`, `Distressed`, `Off-Market`, and `Signature` channels so the browser feels more like a live market than a flat spreadsheet.

### Simulation Naming & Data Disclaimer

Property, development, tenant, and listing names are fictional/composite. The simulator intentionally keeps real Singapore geography, district structure, MRT context, CPF-style mechanics, stamp duty concepts, and simplified affordability rules for educational realism, but it is not affiliated with HDB, URA, CPF Board, MAS, any developer, agency, or listing platform. Pricing, yields, floor plans, and scenarios are simplified game data, not investment advice or real listings.

### Portfolio Depth

- Owned properties now track occupancy state, vacancy streaks, maintenance drag, and property tax.
- HDB flats default to owner-occupied status, allow explicit room-rental strategies during MOP, and keep whole-flat rental locked until the MOP path is clear in the simplified model.
- Active-MOP runs now support a `Next Home` shortlist plus chapter-specific ownership forks, so market-intel and ownership months can point at real target listings instead of only abstract readiness percentages.
- Landlord Ops 2.0 adds lease renewal decisions, rent-push vacancy risk, tenant satisfaction, emergency reserve gaps, and maintenance issue queues inspired by common Singapore ownership surprises.
- Portfolio summaries surface portfolio styles such as `Heartland Landlord` and `Commercial Cashflow Operator`.
- Contextual scenarios now key off what you actually own, whether it is rented, whether you are holding aging leasehold stock, and which life arc is guiding the run.
- Guided-playability surfaces now translate complex mechanics into plain-English next moves, blocker labels, and expected effects so new players can keep momentum.
- Property detail pages now support practice purchase readouts that show cash after CPF, available cash after reserves, projected monthly surplus, BTO/HFE milestones, and 55+ rightsizing warnings before a real buy mutates the save.

---

## Singapore Realism Model (v0.4.0)

The financial engine implements actual Singapore property regulations:

### CPF (Central Provident Fund)

- **Age-bracket contributions**: OA/SA/MA rates shift at 55, 60, 65, 70
- **Wage ceiling**: CPF capped at $8,000/month salary in the 2026 rule set
- **Interest**: OA 2.5%, SA 4%, MA 4% — compounded monthly
- **Extra interest**: Additional 1% on first $60k across OA+SA (credited to OA)
- CPF balances count toward net worth

### Stamp Duty

**BSD** (Buyer's Stamp Duty) — 6-tier marginal:

| Price Band | Rate |
|-----------|------|
| First $180k | 1% |
| Next $180k | 2% |
| Next $640k | 3% |
| Next $500k | 4% |
| Next $1.5M | 5% |
| Above $3M | 6% |

**ABSD** (Additional Buyer's Stamp Duty):

| Profile | 1st Property | 2nd Property | 3rd+ |
|---------|-------------|-------------|------|
| Citizen | 0% | 20% | 30% |
| PR | 5% | 30% | 35% |
| Foreigner | 60% | 60% | 60% |

The selected buyer profile now drives purchase validation and ABSD. The default profile is still a Singapore Citizen couple/family route because it keeps the first-home learning path most approachable.

Both BSD and ABSD are deducted from cash on purchase.

### LTV (Loan-to-Value) Caps

| Housing Loans | Max LTV |
|---------------|---------|
| First | 75% |
| Second | 45% |
| Third+ | 35% |

Down payment must cover (1 − LTV) + stamp duties in cash.

### TDSR & MSR

- **TDSR** (Total Debt Servicing Ratio): All debt payments ≤ 55% of monthly income
- **MSR** (Mortgage Servicing Ratio): Mortgage payment ≤ 30% of monthly income — **enforced only on HDB and EC purchases**

Both checks must pass before a purchase or loan is approved.

### Mortgages

- Standard amortization (principal + interest)
- Monthly payments, 30-year default term
- Interest rate set by difficulty level
- Credit score affects loan eligibility (floor: 400)
- Loans can be paid off early with cash

---

## Engine Architecture

```text
src/
|- engine/                     # Pure-logic game engine (no UI, no side effects)
|  |- actions.ts               # Buy/sell/renovate/pay-loan (pure functions)
|  |- purchase.ts              # Centralized purchase validation + financing math
|  |- turn.ts                  # advanceTurn - single-month simulation
|  |- turnRecap.ts             # Last-month recap surfaced on the dashboard
|  |- cpf.ts                   # CPF contribution + interest + age brackets
|  |- stampDuty.ts             # BSD/ABSD calculation
|  |- ltv.ts                   # LTV cap, MSR check, max-borrowable
|  |- finance.ts               # Amortization, monthly payment, TDSR calc
|  |- income.ts                # Take-home pay, variable income, bank haircut
|  |- eligibility.ts           # HDB/EC eligibility and buyer-profile rules
|  |- selectors.ts             # Derived state: net worth, rental income, expenses
|  |- listings.ts              # Listing enrichment, district coverage, market mover helpers
|  |- marketNews.ts            # Deterministic per-turn market signals
|  |- portfolio.ts             # Carrying costs, occupancy state, investor-route summaries
|  |- scenarioContext.ts       # Portfolio-aware scenario gating
|  |- propertyOperations.ts    # Top-level renovation/tenant/reserve/repair entry points
|  |- tenantOperations.ts      # Lease, rent-push, vacancy, and tenant-satisfaction logic
|  |- reserveOperations.ts     # Emergency reserve top-ups and gap calculations
|  |- maintenanceOperations.ts # Maintenance issue catalog and repair decisions
|  |- operationsShared.ts      # Shared helpers used across operations modules
|  |- decisionCoach.ts         # Plain-English next-move guidance
|  |- commandCenter.ts         # Home Command Center monthly intent state machine
|  |- monthlyIntents.ts        # Cash / deal / recovery / landlord stance options
|  |- practicePurchase.ts      # Non-mutating property-detail purchase simulation
|  |- dealComparison.ts        # "Compare Before You Buy" math
|  |- firstHomeMissions.ts     # First-home mission rail logic
|  |- firstHomeStarter.ts      # One-click beginner Singapore Citizen run
|  |- runDirector.ts           # Run Director route weighting and milestones
|  |- runQuest.ts              # "First 3 Moves" quest rail
|  |- ownershipCampaign.ts     # Chaptered MOP campaign progress and track state
|  |- ownershipForks.ts        # MOP chapter forks and next-home shortlist helpers
|  |- ownershipMoments.ts      # Pressure/upside beats and next-chapter-beat cadence
|  |- ownershipPayoffs.ts      # Derived MOP payoff milestones and recap transitions
|  |- ownershipTargets.ts      # Lead-target vs challenger rivalry derivation
|  |- careerProgression.ts     # Annual career review + job-switch flow
|  |- life.ts                  # Hybrid life-sim layer (energy/stress/actions)
|  |- lifeCampaign.ts          # Life campaign panel state
|  |- achievements.ts          # Achievement evaluation
|  |- achievementRules.ts      # Achievement rule definitions
|  |- constants.ts             # All tunable parameters in one place
|  |- rng.ts                   # Seeded PRNG for deterministic replays
|  |- results.ts               # ActionResult<T> discriminated union
|  `- __tests__/               # 337 vitest specs covering the modules above
|- game/
|  |- types.ts                 # Player, Loan, Property, MarketState, GameState
|  |- useGameStore.ts          # Zustand store - thin wrapper around engine actions
|  |- savePersistence.ts       # Local save/load + profile transfer bundle
|  `- saveMigrations.ts        # Forward-compatible save version upgrades
|- data/
|  |- properties.ts            # Base catalog plus expansion hook for the live market
|  |- propertyExpansion.ts     # Expanded listing pack to reach full district coverage
|  |- propertyArchetypes.ts    # Strategy labels and reusable listing archetypes
|  |- listingChannels.ts       # Market channels, rarity metadata, and badges
|  |- careers.ts               # 7 career paths
|  |- districts.ts             # 28 Singapore districts
|  |- eras.ts                  # Game era definitions
|  |- scenarios.ts             # Event deck with branching choices
|  |- runRoutes.ts             # Run Director life-arc route definitions
|  |- ruleGlossary.ts          # Inline glossary entries (CPF OA, ABSD, MOP, MSR, TDSR...)
|  |- tenantProfiles.ts        # Tenant archetypes for landlord ops
|  |- maintenanceEvents.ts     # Maintenance issue catalog
|  |- renovations.ts           # Renovation packages
|  |- lifeActions.ts           # Hybrid life-sim action catalog
|  |- lifeVisuals.ts           # Life-scene art bindings
|  |- achievements.ts          # Achievement metadata
|  |- buyerOptions.ts          # New-game household / residency / age option lists
|  `- saveSchema.ts            # Zod schema for save validation
|- pages/                      # Route-level React components (Dashboard, Buy, Own, Life, Learn...)
|  |- dashboard/               # Dashboard subcomponents, panels, motion variants
|  `- property/                # Property listing card and Buy-page panels
|- components/                 # Shared UI (GlassCard, HUDTopBar, Sidebar, CommandCenterHero...)
|- hooks/                      # use-mobile, useSaveLoad
`- lib/                        # format helpers and small UI utilities
```

### Design Principles

- **Pure engine, impure shell** — `engine/` has zero React imports and zero side effects. All functions take state in and return new state out. This makes the entire game logic testable without rendering a single component.
- **Deterministic replays** — The seeded PRNG (`rng.ts`) ensures identical seeds produce identical games. Given the same seed, the same sequence of market movements, scenario triggers, and resolution outcomes will fire.
- **Discriminated unions** — `ActionResult<T>` is `{ ok: true; value: T } | { ok: false; reason; message }`. Callers narrow with `if (result.ok)` and get type-safe access to data or error.
- **Constants over magic numbers** — Every tunable parameter (CPF rates, BSD tiers, LTV caps, volatility, credit deltas) lives in `constants.ts`. Changing a rule is a one-line edit.
- **Save versioning** — `SAVE_VERSION` (currently `2`) supports future migration. Old saves can be upgraded on load.

### Key Functions

```typescript
// Buy a property — validates cash, LTV cap, TDSR, credit score, deducts BSD+ABSD
buyPropertyPure(player, propertyId, downPayment): ActionResult<{ player }>

// Single-month simulation — CPF, salary, rental, amortization, market, scenarios
advanceTurn({ player, market, settings, rng }): AdvanceTurnOutput

// CPF contribution for a given age and salary
contributeCpf(balances, monthlySalary, age): CpfBalances

// BSD + ABSD for a purchase
calculateTotalStampDuty(price, propertyCount, isCitizen, isPr): number

// Maximum loan based on LTV cap
maxBorrowable(propertyPrice, existingHousingLoans): number
```

---

## Testing

```bash
npm test           # Run the full vitest suite
npm run test:smoke # Scripted first-home browser smoke test
npm run test:profiles # Browser checks for SC, PR, foreigner, and single-buyer profile rules
npm run test:scroll # Browser check that route changes reset page scroll
npm run test:watch # Watch mode
npm run test:ui    # Vitest UI
```

Tests cover: CPF allocation and interest, buyer-profile ABSD, HDB/EC eligibility, LTV caps, MSR checks, TDSR enforcement, buy and sell flows, shortfall math, mortgage creation, net worth calculations, carrying costs, route progression, scenario eligibility, turn advancement, amortization, profile browser flows, insolvency detection, and win or lose conditions.

---

## Getting Started

```bash
git clone https://github.com/jonathanwxh-cell/singapore-property-simulator.git
cd singapore-property-simulator
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## License

Proprietary — all rights reserved. See [LICENSE](LICENSE).
