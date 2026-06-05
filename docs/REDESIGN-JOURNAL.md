# Property Lah! — Fun Redesign Journal

Running log of the dashboard→game redesign. Newest entries at top.
Branch: `claude/fun-redesign` (worktree `spp-redesign`, off `main` v0.6.1).
Goal: make it genuinely fun while keeping all SG financial realism. Yardstick: 20 persona subagents rate fun+UX **≥ 8/10**.

---

## Checkpoint log

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
