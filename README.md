# Singapore Property Simulator

A single-player turn-based property investment game set in Singapore's real estate market. Buy HDB flats, executive condos, private condos, landed homes, and commercial shophouses — while navigating CPF rules, stamp duties, mortgage underwriting, cooling measures, and market cycles.

**Built with** React 19 · TypeScript · Vite · Zustand · Tailwind CSS · Vitest

---

## Gameplay

You start as a 27-year-old Singaporean with a career and modest savings. Each turn is one month. Your goal: reach the target net worth before insolvency strikes you out.

### Core Loop

1. **Earn** — Monthly salary (career-dependent) flows in after CPF deductions
2. **Buy** — Purchase properties across 9 property types and 28 districts
3. **Finance** — Take mortgages, manage LTV caps and TDSR/MSR limits
4. **Collect Rent** — Tenant income from rented properties
5. **Advance Turn** — Market moves, loans amortize, CPF compounds, events fire
6. **React** — Scenario events (market crashes, cooling measures, renovation opportunities) present choices with probabilistic outcomes

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

## Property Types (34 properties)

| Type | Price Range | Rental Yield | Example |
|------|------------|-------------|---------|
| HDB BTO | $310k–$520k | 4.8–5.8% | Tampines GreenVerde |
| HDB Resale | $480k–$750k | 4.2–5.0% | Ang Mo Kio EM |
| Executive Condo | $1.1M–$1.35M | 3.5–3.9% | Parc Canberra |
| Private Condo | $1.1M–$4.2M | 2.4–4.0% | Marina One Residences |
| Landed Terrace | $3.5M–$4.2M | 2.0–2.2% | Joo Chiat Conservation |
| Landed Semi-D | $5.8M–$7.2M | 1.6–1.8% | Holland Grove |
| Landed Bungalow | $22M–$45M | 1.0–1.5% | Sentosa Cove |
| Commercial Shop | $4.8M–$12M | 2.8–3.3% | Amoy Street Shophouse |
| Commercial Office | $2.8M–$5.5M | 3.5–4.2% | Raffles Place Office |

---

## Singapore Realism Model (v0.4.0)

The financial engine implements actual Singapore property regulations:

### CPF (Central Provident Fund)

- **Age-bracket contributions**: OA/SA/MA rates shift at 55, 60, 65, 70
- **Wage ceiling**: CPF capped at $6,800/month salary
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
| PR | 0% | 20% | 30% |
| Foreigner | 60% | 60% | 60% |

> The player is currently always treated as a Singapore citizen. PR rates in `stampDuty.ts` are placeholder (matching citizen rates) until a profile system is added; real SG PR rates are 5% / 30% / 35%. Foreigner rates already match the real 60% rule.

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
│   ├── constants.ts      # All tunable parameters in one place
│   ├── rng.ts            # Seeded PRNG for deterministic replays
│   ├── results.ts        # ActionResult<T> discriminated union
│   └── __tests__/        # 90+ tests (vitest)
├── game/
│   ├── types.ts          # Player, Loan, Property, MarketState, GameState
│   └── useGameStore.ts   # Zustand store — thin wrapper around engine actions
├── data/
│   ├── properties.ts     # 34 properties across 9 types
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
npm run test:watch # Watch mode
npm run test:ui    # Vitest UI
```

Tests cover: CPF allocation & interest, BSD/ABSD tiers, LTV caps, MSR checks, TDSR enforcement, buy/sell/renovate/pay-loan actions, turn advancement, amortization, insolvency detection, and win/lose conditions.

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

Private repository. All rights reserved.
