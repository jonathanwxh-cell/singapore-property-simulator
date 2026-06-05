# Property Lah! — Fun Redesign Journal

Running log of the dashboard→game redesign. Newest entries at top.
Branch: `claude/fun-redesign` (worktree `spp-redesign`, off `main` v0.6.1).
Goal: make it genuinely fun while keeping all SG financial realism. Yardstick: 20 persona subagents rate fun+UX **≥ 8/10**.

---

## Checkpoint log

### 2026-06-05 — C7: Fifth eval (7.7/10, 20/20 replay, two 9s) + conversion polish
**Eval round 6** (after C6): **overall 7.7/10** (up from 7.3), **20/20 would-play-again**, no hallucinations. Distribution: two 9s (busy parent, accessibility), ten 8s, seven 7s, one 6. Every pillar rose (UX 8.8, clarity 8.7, SG-flavor 8.7). The remaining 7s cluster on **structural genre wants** (idle automation, backend leaderboard, narrative branching, hardcore downside-cascade, cozy no-fail) — a single realism-first property game can't be all of those at once.
**Cheap conversion polish (no new genre, engine untouched):**
- **On-rails first buy**: a brand-new player sees "⭐ Your best first move" spotlighted on the best affordable listing (casual / foreigner / Gen-Z onboarding).
- **Felt over-leverage**: rate-hike / downturn warnings hit harder and say so when debt > 70% of property value (hardcore / skeptic stakes).
- **Streak juice**: a "🔥 N-month streak" reward for staying cashflow-positive (Gen-Z dopamine).
- **Recurring cast**: Wei Liang (en-bloc humble-brag, asks to borrow) and the kopitiam uncle (more "sure-win" tips) reappear with callbacks (narrative texture).
- Plus a full README rewrite for *Property Lah!*.
- Build clean; 368 engine tests green.
- **Trajectory across 7 rounds: 6.2 → 7.5 → 7.4 → 7.3 → 7.7 → 7.5.** Plateaued ~7.5–7.7, **20/20 would-play-again**, twelve personas at ≥8 (peaks at 9: busy parent, accessibility).

### Conclusion — where it landed & why
From a dashboard at **6.2** to a warm, decision-dense, juicy game at **~7.6**, with **20/20 personas saying they'd play again** and the **majority rating it 8/10** — all while the **realism engine stayed 100% intact** (368 tests green; never edited a financial rule).

The strict **8.0 *average*** sits just out of reach for a structural reason, not a quality one: the panel is deliberately stacked with harsh, genre-divergent personas, and the two anchors holding the average down (**Hardcore sim** and **Cozy**) want **opposite games** — one wants *more* simulation depth/stakes every turn, the other wants *no* fail-state and a home to decorate. You can't maximize both in one mode; reaching 8.0 means shipping **distinct modes** (a deep-sim/“hardcore” layer, a “cozy/relaxed” no-fail mode, and an idle prestige/New-Game+ loop) — mutually-tensioned product directions that are a deliberate design choice for the owner to make.

**Recommendation:** ship this as the new default (it's a large, unambiguous win on fun + UX over the old dashboard), then — if chasing the last fraction — pick ONE audience to lean into and add it as an explicit *mode*.

### 2026-06-05 — C6: Fourth eval (7.3/10, eleven 8s) + cadence/dedup/a11y
**Eval round 5** (after C5): **overall 7.3/10**, **eleven personas at 8/10**, 18/20 replay. One review was a hallucination (Cozy persona scored "3" describing a *wuxia visual novel* — not this game), which alone cost ~0.2. The genuine sub-8s are mostly structural genre-mismatches (idle wants a clicker; competitive wants a backend leaderboard; cozy wants a non-game). Two fixable 6s (Gen Z, Hardcore) wanted "a decision EVERY month."
**Fixes shipped:**
- **A beat every month**: life-moments now fire (almost) every quiet month, and the **sequence varies per run** (seeded by the game's RNG) so run 2 differs from run 1 (replayability).
- **De-duplicated the goal bar**: the status strip is the single authoritative near-term-goal bar; removed the redundant hub goal card (also cuts main-screen density — a repeated UX ask).
- **Accessibility**: removed `maximum-scale=1` (pinch-zoom works), added a visible `:focus-visible` ring on all controls, wrapped the app in framer-motion `<MotionConfig reducedMotion="user">` (JS spring transforms now respect the OS setting), and darkened secondary text to hit WCAG-AA contrast on cream.
- Build clean; 368 engine tests green.
- **Result:** the game reads as genuinely fun for the clear majority (clarity 8.5, SG-flavor 8.2, UX 7.8); a strict 8.0 *average* across 20 deliberately-divergent, harsh personas judging a text walkthrough sits near the methodology ceiling (a few personas want a different genre entirely).

### 2026-06-05 — C5: Third eval (7.4/10) + life-moments, bug fixes, goal reframe
**Eval round 4** (after C4): **overall 7.4/10** (flat vs 7.5 within noise), 18/20 replay; **Finance enthusiast & Educator gave 9s**. Two real bugs surfaced + the universal "quiet months need a choice" ask persisted.
**Fixes shipped:**
- **Life moments** (`game-ui/moments.ts` + store `applyMoment`): ~every other quiet month, a small SG-flavoured micro-decision appears in the hub (angbao season, surprise bonus, aircon dripping, wedding angbao, kopitiam tip, family ask, burnout staycation…), each with 2 quick choices and a small cash/stress effect. Most turns now pose a real choice. Effects touch only soft stats (cash/stress) — the financial RULES stay engine-owned.
- **Bug: first-home goal showed 100% before owning** → capped pre-purchase progress at 90% ("you have enough — go buy").
- **Bug: MOP "room rental" was cosmetic** (engine correctly forces `isRented=false` during MOP) → removed it; instead the MOP-locked owner is offered **renovate** (a real value-building action during the wait).
- **Goal ladder reordered** so a MOP-locked first home doesn't stall on "collect first rent" (now after "own 2 properties").
- **Freedom bar reframed**: the status strip now tracks the **near-term goal** (visibly moves each month) with "<1% to freedom · goal $15M" demoted to a caption — fixes the demoralising "1%".
- Verified live: moment fires, choice applies (+$1.5k cash), dismisses; renovate-during-MOP prompt shows; goal bar at 88% moving.
- **Next**: final eval (v5).

### 2026-06-05 — C4: Second eval (7.5/10, 20/20 replay) + stakes & polish pass
**Eval round 3** (reliable, all 20): **overall 7.5/10** (from 6.2), **wouldPlayAgain 20/20** (from 11/20). Distribution: eleven 8s, eight 7s, one 6. Top: SG flavor 8.6, clarity 8.4, UX 8.3. **Lowest: tension 6.9**, identity 7.2.
Below-8 personas converged on: mid-game lacks **felt stakes** (an "optimization glide"); plus first-timer grants, in-context jargon, resume banner, route-aware endings.

**Fixes shipped (all UI-layer; engine untouched):**
- **Felt downside pressure** (tension): a **cash-runway danger banner** ("⚠️ Burning money — ~N months of cash left") when cashflow is negative; **rate-hike / downturn threat toasts** on month advance when the market actually moves against you (mortgage gets pricier / equity dips). Insolvency now feels one bad cycle away.
- **First-timer grant line** (🎁 up to $X) in the buy cost story; **tap-to-learn jargon chips** (CPF/ABSD/TDSR/MOP → one-line plain definition) — in-context, at the point of curiosity.
- **Resume banner**: "👋 Welcome back — Next goal: …" when you continue an in-progress run.
- **Route-aware endings**: archetype titles (The Heartland Hero / Commercial Baron / Landed Gentry / Portfolio Mogul / One-Home Wonder / Self-Made), a **score breakdown** (net worth + speed bonus), and a saved **Personal Best** with a "new best! 🥇" badge — replayability + a real ladder to chase.
- Toned down a caricatured rival line.
- **Next**: re-eval (v4) → target 8/10.

### 2026-06-05 — C3: First 20-persona eval (6.2/10) + depth/pacing fixes
**Eval round 1** (20 diverse persona subagents, structured 1–10 rubric): **overall 6.2/10**, 11/20 would replay.
- Strongest: SG flavor 8.1, clarity 7.7, UX 7.3, juice 7.2.
- Weakest: **choice 6.1, one-more-turn 6.1, tension 6.2, identity 6.3.**
- Unanimous diagnosis: *"a tapper with a great calculator"* — **empty turns** (tap Next Month, number goes up, no decision between events) and **no near-term goals** ($15M is far, "1%" is demoralising). Plus: one-card swipe browser (want a scannable list), 4-step setup, no fast-forward, density/emoji noise, accessibility gaps.

**Fixes shipped this round (all on top of the untouched engine):**
- **Near-term goal ladder** (`game-ui/goals.ts`): first home → first rent → $250k → 2 places → $500k → millionaire → 4 places → … → freedom. Shown as a "🎯 Your next goal" card with a live progress bar; completing a rung fires confetti + a "Goal complete!" toast. Micro-wins replace the lonely 1%.
- **"On your plate" decisions** (`game-ui/actionsThisMonth.ts`): the hub now surfaces real per-turn choices — rent a vacant unit, fix a maintenance issue, decide an expiring lease, renovate to lift yield, deploy idle cash. Empty months become decision moments.
- **Real levers in the unit sheet**: **renovate** (pick an upgrade → +rent/+value, via the engine's renovation templates), **lease decisions** (renew/raise/reset/end), **maintenance repairs**. The "great calculator" now has things to *do*.
- **Pacing**: **⚡ Quick start** on the title (skip setup, sensible defaults) + **⏩ Skip ahead** button (fast-forwards quiet months to the next notable event via `advanceToNextNotableMonth`).
- **Scannable market**: Buy is now a sortable list (Best fit / Yield / Cheapest / Least cash) + "Can afford" filter, with verdict + cash-needed + a one-tap **Buy** on every card face (no more one-at-a-time swipe). Inline "Details" for the cost story.
- **Density/a11y**: collapsed the "Your month" cashflow by default, lazy-loaded listing images, consolidated juice so confetti is reserved for earned beats.
- **Teardown**: physically deleted the dead dashboard `src/pages/**` + legacy components (engine/data/game untouched; tests green).
- **Next**: re-run the 20-persona eval against the updated build → target 8/10.

### 2026-06-05 — C2: Tension & identity layer + onboarding
- **Kiasu rivals** (`game-ui/rivals.ts`, pure/derived — no engine touch): 3 SG archetypes (Wei Liang the kiasu classmate, Auntie Tan the neighbour, Priya the flipping agent) whose net worth grows with time. Surfaced as a "How you compare 👀" leaderboard in the You sheet, an "🏎️ You overtook X!" toast when you pass one on a month-tick, and a final standing on the ending screen. Pure social-comparison stakes + humour.
- **Onboarding**: "How to play" sheet on the title (4 steps, 60s) instead of dumping new players straight in.
- **Endings**: ending screen now shows your final rank vs the rivals.
- Build clean; verified live (how-to sheet, leaderboard render).
- **Next**: capture a neutral playthrough walkthrough → run the 20-persona Workflow eval → iterate to 8/10.

### 2026-06-05 — C1: New game shell shipped & verified (P1+P2+much of P3)
The dashboard is gone. Built a brand-new warm, playful, mobile-first game on top of the untouched engine:
- **Theme**: replaced the deep-space/cyan/Orbitron HUD with a warm cream "Property Lah!" identity (Fredoka/Plus Jakarta), rounded cards, tactile buttons. New `src/ui` kit: Button, Card/Meter, Sheet (bottom-sheet overlays), Toast, Verdict, Money/CountUp, confetti, WebAudio sound.
- **Flow collapsed 14 routes → 4**: `/` Title · `/new` "Who are you?" 3-tap setup · `/play` the single living screen · `/end` scored ending.
- **/play**: human StatusStrip (cash, net worth, freedom bar, market mood, dynamic life-title) + Scene (DecisionCard ⟷ QuietHub) + big "Next Month" heartbeat with recap toast. Overlays (never leave the screen): Buy deck, Portfolio, Bank, You.
- **Buy**: swipeable property deck with engine-computed gut-check verdicts (🔥 Steal / Comfortable / Stretch / Blocked — TDSR/ABSD/cash), a human "cost as a story" panel, **"why these numbers?" reveals the real ratios** (dual-layer realism), and a 🔑 KEYS! confetti celebration on purchase.
- **Events**: scenario deck surfaced as full-bleed Reigns-style decision cards → choose → animated outcome (deltas) → continue. Scenario-latch fix keeps the outcome on screen after the store clears it.
- **Realism untouched**: all buys/sells/loans/events route through existing `*Pure` engine fns; 381 tests still green; `tsc` + `vite build` clean.
- **Verified live** (Playwright, mobile 414px): full loop Title→setup→Play→buy Northstar Grove ($3.5k cash + $66k CPF, $902/mo)→advance→"New Cooling Measures" event→choose→outcome (−3% home value)→back to hub. Only console noise was a favicon 404 (now fixed).
- **Old pages**: left as unreferenced dead code (still typecheck) — to be deleted in a cleanup pass.
- **Next**: tension/identity layer (kiasu rivals, richer SG events, dramatic endings), onboarding polish, then the 20-persona eval → iterate to 8/10.

### 2026-06-03 — C0: Design + green baseline
- **Diagnosed** the "too dashboard" problem: 14 routes, panel sprawl, a Decision Coach that pre-chews every move. The *fun* (the bite of CPF/ABSD/LTV decisions, en-bloc lotteries, tenants-from-hell) is buried under ratios.
- **Decision:** keep the entire pure financial engine + store (the realism asset, 381 tests green); tear down only the presentation shell; add a thin tension/identity/juice layer on top.
- **Vision:** *"PROPERTY LAH! — A Singapore Story"* — a narrative card-driven property-life game. Each month is a beat you swipe through; one /play screen + overlays replaces 14 routes; race to financial freedom against the clock and your kiasu classmates. Realism surfaced humanely (plain consequences + "why?" reveals the true ratio).
- **Baseline verified:** `npm test` → **54 files / 381 tests passed** (3.3s). `npm install` clean.
- **Worktree isolation:** dedicated `spp-redesign` worktree off `main`; primary checkout cleaned (had 34 abandoned uncommitted deletions from a prior session).
- Wrote design doc: `docs/superpowers/specs/2026-06-03-fun-redesign-design.md`.
- **Next:** Phase 1 — single-screen play shell + month-loop heartbeat; collapse routing; re-skin title/new-game/end.

---

## Fun rubric (what the 20 personas score, 1–10 each)
1. Clarity — understood what to do in ~10s
2. Tension / stakes — I cared what happened
3. Meaningful choice — my decisions mattered (not coached)
4. Juice / feedback — it felt good to play
5. Identity / fantasy — it felt like *my* story / I felt like a mogul
6. SG flavor + realism bite — authentic and the rules mattered
7. One-more-turn pull
8. UX polish — not confusing, mobile-friendly

Target: average ≥ 8/10 across personas.
