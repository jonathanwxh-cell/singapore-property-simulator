# Property Lah! — A Singapore Story

[![CI](https://github.com/jonathanwxh-cell/singapore-property-simulator/actions/workflows/ci.yml/badge.svg)](https://github.com/jonathanwxh-cell/singapore-property-simulator/actions/workflows/ci.yml)
[![License: Proprietary](https://img.shields.io/badge/license-proprietary-lightgrey)](LICENSE)

A warm, mobile-first **property-life game** set in Singapore. You're 27 with some
savings and one dream — your own place in the world's most expensive city. Each
month is a turn: buy homes, collect rent, ride the market, and race to financial
freedom before you go broke. Underneath the friendly surface is a **real Singapore
property finance engine** — CPF, stamp duties (BSD/ABSD), loan limits (LTV/MSR/TDSR),
mortgage amortization, and market cycles all bite for real.

**Built with** React 19 · TypeScript · Vite · Zustand · Tailwind · framer-motion · Vitest

> This is the *Property Lah!* redesign — a from-scratch rebuild of the UI/UX on top of
> the original, battle-tested financial engine. Design notes and the iteration log live in
> [`docs/superpowers/specs/2026-06-03-fun-redesign-design.md`](docs/superpowers/specs/2026-06-03-fun-redesign-design.md)
> and [`docs/REDESIGN-JOURNAL.md`](docs/REDESIGN-JOURNAL.md).

---

## How it plays

One living screen, not a dashboard of panels:

- **Start your story** (or ⚡ Quick start) — pick a career, your life situation
  (household + residency: Citizen / PR / Foreigner), and a difficulty.
- **The month loop** — a slim human status strip (cash, net worth, market mood, a
  near-term goal bar that visibly moves), a living **Strategy Board** with three
  situational plans and a best-fit recommendation, a **life moment** most months (a quick
  SG-flavoured 2-choice beat — angbao season, a surprise bonus, a dripping aircon, your
  kiasu classmate Wei Liang humble-bragging…), the real **decisions on your plate** (rent a
  vacant unit, renovate, handle a lease or repair, deploy idle cash), a consequence recap,
  and a big **Next Month** heartbeat (with a **⏩ Skip** to fast-forward quiet months).
- **The market** — a scannable, sortable list of listings, each with a plain-English
  **gut-check verdict** (🔥 Steal / 👍 Comfortable / 😬 A Stretch / 🚫 with the reason
  in words), the cash you'd need now, and a one-tap **Buy**. "Details" tells the cost as
  a story (cash + CPF + first-timer grant + monthly mortgage + what's left over), with
  tap-to-learn jargon and a **"why these numbers?"** reveal of the real rules.
- **Your places** — manage each unit: rent it out, renovate to lift rent & value, handle
  maintenance, decide an expiring lease, or sell.
- **Events** — Reigns-style decision cards (cooling measures, career reviews, job
  switches) with consequences that move your money, credit, salary, or property values.
- **Stakes** — a cash-runway warning when you bleed money; rate hikes and downturns that
  genuinely threaten an over-leveraged player; insolvency loses the game.
- **Endings** — a route-aware archetype (Heartland Hero, Commercial Baron, Landed Gentry,
  Portfolio Mogul…), a score with a saved personal best, and a final standing against your
  kiasu rivals.

### Win / Lose

| Condition | Result |
|-----------|--------|
| Net worth ≥ difficulty target | **Financial Freedom** 🏆 |
| Cash negative + income < obligations for 3 turns | **Bankrupt** 🌧️ |
| Player reaches age 75 | **Lifetime chapter complete** with a route-aware ending |

---

## Singapore realism model

The financial engine implements a researched, simplified 2026 Singapore property model.
Every buy/sell/loan/event routes through pure, fully-tested functions, while the UI
surfaces consequences in plain English and keeps the exact ratios one tap away.

- **CPF** — age-bracket contribution and allocation rates, PR graduated contribution
  years, no employer CPF for foreigners, the $8k wage ceiling, monthly-compounded
  interest (OA 2.5% / retirement and MediSave accounts 4%), and age-aware extra interest.
- **Stamp duty** — 6-tier marginal **BSD** (1–6%) + **ABSD** by profile (Citizen 0/20/30%,
  PR 5/30/35%, Foreigner 60%). Both deducted in cash on purchase.
- **LTV** caps (75% / 45% / 35% by outstanding housing loans, reduced to
  55% / 25% / 15% when tenure or borrower-age limits apply), with 5%, 10%, or 25%
  mandatory cash down payment depending on the loan situation.
- **TDSR** (all debt ≤ 55% of income) and **MSR** (mortgage ≤ 30%, HDB/EC only). Both must
  pass at the simplified mortgage assessment rate, not only the offered interest rate.
- **Mortgages** — standard amortization, 30-year default, difficulty-set rates, credit-score
  gating, early repayment.
- **HDB** specifics — eligibility by household/residency, up to 80% concessionary LTV,
  25-year term, MOP lock-in, and room rental while whole-flat rental is restricted.

See the in-game **"Singapore rules in plain English"** sheet (with a *simplified 2026
rule-set, not financial advice* note) for the player-facing glossary.

---

## Architecture

```text
src/
├─ engine/        # Pure financial engine — no React, no side effects, fully tested
│                 # CPF · stamp duty · LTV/MSR/TDSR · finance · turn · selectors ·
│                 # portfolio · scenarios · property operations · …
├─ game/          # Zustand store (thin wrapper over the engine) + save persistence
├─ data/          # 120+ listings · 28 districts · 7 careers · scenarios · renovations · …
├─ game-ui/       # Pure presentation-layer helpers (no engine-rule changes):
│                 #   derive · property · goals · actionsThisMonth · moments · rivals · ending
├─ ui/            # UI kit — Button · Card · Sheet · Toast · Verdict · Money · confetti · sound
└─ screens/       # Title · NewGame · Play (+ play/* hub, decision card, sheets) · End
```

**Design principles**

- **Pure engine, impure shell** — `engine/` is rule-bearing and testable in isolation; the
  presentation layer stays thin, and policy changes are backed by focused tests and
  dated official-source notes.
- **Realism surfaced humanely** — plain-language consequences by default, the exact
  CPF/ABSD/TDSR figures revealed on demand.
- **Fun layer is pure & derived** — goals, life-moments, rivals, and endings live in
  `game-ui/` and only read existing state (moments touch soft stats — cash/stress — never
  the financial rules).
- **Deterministic replays** — a seeded PRNG drives the market, events, and the life-moment
  sequence, so a seed reproduces a run and different runs differ.

---

## Develop

```bash
npm install
npm run dev       # http://localhost:3000 (or -- --host 127.0.0.1 --port 3000)
npm run build     # tsc -b && vite build
npm test          # vitest — engine + data suites
```

The current playable surface is compact: `/`, `/new`, `/play`, and `/end` are
the only first-class routes. Market, places, bank, and player details open as
bottom sheets inside `/play`; smoke tests should follow that model.

---

## License

Proprietary — all rights reserved. See [LICENSE](LICENSE).
