# Singapore Property Simulator

[![CI](https://github.com/jonathanwxh-cell/singapore-property-simulator/actions/workflows/ci.yml/badge.svg)](https://github.com/jonathanwxh-cell/singapore-property-simulator/actions/workflows/ci.yml)
[![Version](https://img.shields.io/badge/version-0.4.0-green.svg)](CHANGELOG.md)
[![License: Proprietary](https://img.shields.io/badge/license-proprietary-lightgrey)](LICENSE)

A single-player turn-based property investment game set in Singapore's real estate market. Buy HDB flats, executive condos, private condos, landed homes, and commercial shophouses — while navigating CPF rules, stamp duties, mortgage underwriting, cooling measures, and market cycles.

**Built with** React 19 · TypeScript · Vite · Zustand · Tailwind CSS · Vitest

---

## Gameplay

You start with a career, modest savings, and a selectable buyer profile: Singapore Citizen, Singapore PR, foreigner, couple/family, single 35+, single under 35, or foreign-investor style. Each turn is one month. Your goal: reach the target net worth before insolvency strikes you out.

### Core Loop

The current build includes a Decision Coach layer across the dashboard, property browser, property detail, scenarios, and life-planning screens. It explains the next sensible move, deal blockers, expected life-action effects, and scenario upside/downside before players commit.

The dashboard also includes a first-home mission rail and a plain-English rule glossary so players can understand CPF OA, ABSD, MOP, room rental, MSR, TDSR, and reserves without leaving the game flow.

1. **Earn** — Monthly salary (career-dependent) flows in after CPF deductions
2. **Buy** — Browse 120+ fictional live listings across 9 property types, 28 districts, and 6 listing channels
3. **Finance** — Take mortgages, manage LTV caps and TDSR/MSR limits
4. **Collect Rent** — Tenant income from rented properties
5. **Advance Turn** — Market moves, loans amortize, CPF compounds, ownership costs hit, and portfolio-aware events fire
6. **React** — Scenario events (market crashes, cooling measures, tenant defaults, leasehold pressure, renovation opportunities) present choices with probabilistic outcomes

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
| HDB BTO | $265k–$520k | 4.8–5.9% | Woodlands North Grove |
| HDB Resale | $295k–$850k | 4.0–5.5% | Bukit Merah View |
| Executive Condo | $1.0M–$1.42M | 3.5–4.1% | Canberra Grove EC |
| Private Condo | $980k–$4.2M | 2.4–4.3% | Marina Green Residences |
| Landed Terrace | $2.95M–$4.3M | 2.0–2.4% | East Coast Garden Terrace |
| Landed Semi-D | $5.8M–$7.6M | 1.6–1.8% | Holland Grove |
| Landed Bungalow | $22M–$45M | 1.0–1.5% | Sentosa Cove |
| Commercial Shop | $3.2M–$12M | 3.0–4.3% | Amoy Street Shophouse |
| Commercial Office | $1.85M–$6.8M | 3.4–5.0% | Jurong Gateway Office |

The market now spans all 28 defined districts with at least 2 live listings each. Inventory is grouped into `New Launch`, `Resale`, `Auction`, `Distressed`, `Off-Market`, and `Signature` channels so the browser feels more like a live market than a flat spreadsheet.

### Simulation Naming & Data Disclaimer

Property, development, tenant, and listing names are fictional. The simulator intentionally keeps real Singapore geography, district structure, MRT context, CPF-style mechanics, stamp duty concepts, and simplified affordability rules for educational realism, but it is not affiliated with HDB, URA, CPF Board, MAS, any developer, agency, or listing platform. Pricing, yields, floor plans, and scenarios are simplified game data, not investment advice or real listings.

### Portfolio Depth

- Owned properties now track occupancy state, vacancy streaks, maintenance drag, and property tax.
- HDB flats default to owner-occupied status, allow explicit room-rental strategies during MOP, and keep whole-flat rental locked until the MOP path is clear in the simplified model.
- Portfolio summaries surface investor routes such as `Heartland Landlord` and `Commercial Cashflow Operator`.
- Contextual scenarios now key off what you actually own, whether it is rented, and whether you are holding aging leasehold stock.
- Guided-playability surfaces now translate complex mechanics into plain-English next moves, blocker labels, and expected effects so new players can keep momentum.

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

```
src/
├── engine/               # Pure-logic game engine (no UI, no side effects)
│   ├── actions.ts        # Buy/sell/renovate/pay-loan (pure functions)
│   ├── turn.ts           # advanceTurn — single-month simulation
│   ├── cpf.ts            # CPF contribution + interest + age brackets
│   ├── stampDuty.ts      # BSD/ABSD calculation
│   ├── ltv.ts            # LTV cap, MSR check, max-borrowable
│   ├── finance.ts        # Amortization, monthly payment, TDSR calc
│   ├── selectors.ts      # Derived state: net worth, rental income, expenses
│   ├── listings.ts       # Listing enrichment, district coverage, market mover helpers
│   ├── portfolio.ts      # Carrying costs, occupancy state, investor-route summaries
│   ├── scenarioContext.ts# Portfolio-aware scenario gating
│   ├── constants.ts      # All tunable parameters in one place
│   ├── rng.ts            # Seeded PRNG for deterministic replays
│   ├── results.ts        # ActionResult<T> discriminated union
│   └── __tests__/        # 185+ tests (vitest)
├── game/
│   ├── types.ts          # Player, Loan, Property, MarketState, GameState
│   └── useGameStore.ts   # Zustand store — thin wrapper around engine actions
├── data/
│   ├── properties.ts     # Base catalog plus expansion hook for the live market
│   ├── propertyExpansion.ts # Expanded listing pack to reach full district coverage
│   ├── propertyArchetypes.ts # Strategy labels and reusable listing archetypes
│   ├── listingChannels.ts # Market channels, rarity metadata, and badges
│   ├── careers.ts        # 7 career paths
│   ├── districts.ts      # 28 Singapore districts
│   ├── eras.ts           # Game era definitions
│   ├── scenarios.ts      # Event deck with branching choices
│   └── saveSchema.ts     # Zod schema for save validation
├── pages/                # Route-level React components
└── components/           # Shared UI (GlassCard, HUDTopBar, Sidebar, PropertyImage)
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
