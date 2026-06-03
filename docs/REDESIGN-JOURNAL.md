# Property Lah! — Fun Redesign Journal

Running log of the dashboard→game redesign. Newest entries at top.
Branch: `claude/fun-redesign` (worktree `spp-redesign`, off `main` v0.6.1).
Goal: make it genuinely fun while keeping all SG financial realism. Yardstick: 20 persona subagents rate fun+UX **≥ 8/10**.

---

## Checkpoint log

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
