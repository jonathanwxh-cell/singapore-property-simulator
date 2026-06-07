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
  near-term goal bar that visibly moves), a **life moment** most months (a quick
  SG-flavoured 2-choice beat — angbao season, a surprise bonus, a dripping aircon, your
  kiasu classmate Wei Liang humble-bragging…), the real **decisions on your plate** (rent a
  vacant unit, renovate, handle a lease or repair, deploy idle cash), and a big **Next
  Month** heartbeat (with a **⏩ Skip** to fast-forward quiet months).
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

---

## Singapore realism model

The financial engine implements real Singapore property rules. It is **untouched** by
the redesign — every buy/sell/loan/event routes through the same pure, fully-tested
functions; the new UI only changes how they're *surfaced* (plain-English by default, the
exact ratios one tap away).

- **CPF** — age-bracket OA/SA/MA contributions, $8k wage ceiling, monthly-compounded
  interest (OA 2.5% / SA 4% / MA 4%, +1% extra), and CPF counts toward net worth.
- **Stamp duty** — 6-tier marginal **BSD** (1–6%) + **ABSD** by profile (Citizen 0/20/30%,
  PR 5/30/35%, Foreigner 60%). Both deducted in cash on purchase.
- **LTV** caps (75% first loan, 45% second, 35% third+); the down payment must cover the
  rest plus duties in cash/CPF.
- **TDSR** (all debt ≤ 55% of income) and **MSR** (mortgage ≤ 30%, HDB/EC only). Both must
  pass or the bank says no.
- **Mortgages** — standard amortization, 30-year default, difficulty-set rates, credit-score
  gating, early repayment.
- **HDB** specifics — eligibility by household/residency, MOP lock-in.

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
  redesign never edits a rule or a number, only the presentation.
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
