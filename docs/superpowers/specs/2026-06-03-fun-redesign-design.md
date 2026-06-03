# Singapore Property — Fun Redesign Design Doc

**Date:** 2026-06-03
**Branch:** `claude/fun-redesign` (worktree `spp-redesign`, off `main` @ 3b6b502 / v0.6.1)
**Author:** Claude (self-directed, full autonomy granted by owner)

> Owner directive: *"Tear the whole game down — it's too dashboard based. Make it fun. Realism everything in place, but game fun. Yardstick: 20 sub-agents of different profiles find it fun / good UX, rating 8/10. Do game design from scratch if needed."*

---

## 1. Problem statement

The game is mechanically rich and **financially realistic** (CPF, BSD/ABSD, LTV/MSR/TDSR, mortgage amortization, market cycles — all in a pure, 337-test engine) but it is presented as a **cockpit of panels**: 14 routes, a Sidebar + HUD, a "Decision Coach" that pre-chews every move, "Command Center monthly intent state machines," "MOP ownership forks," glossary panels, mission rails. The player operates a spreadsheet that explains itself to death. It is an *educational dashboard*, not a *game*. There is no tension, no identity, no surprise, no juice, no "one more turn."

**Diagnosis:** the *fun* lives in the decisions the realism creates (Can I afford this? ABSD just wrecked my plan! En-bloc lottery! Tenant from hell!) — but the UI buries those moments under ratios and coaching. We don't need new financial depth. We need to **re-present** the existing depth as a story you live, and add a thin **tension/identity/juice layer** on top.

## 2. What we keep vs. tear down

**KEEP (the realism asset — do not weaken):**
- The entire `src/engine/**` pure logic layer and its tests. CPF, stamp duty, LTV/MSR/TDSR, finance, eligibility, turn simulation, selectors, portfolio, scenario resolution.
- `src/game/useGameStore.ts` action surface (`newGame`, `nextTurn`, `buyProperty`, `sellProperty`, `applyLoan`/`payLoan`, `renovate`/`startRenovation`, tenant/maintenance/reserve ops, `resolveScenario`, `currentScenario` blocking).
- `src/game/types.ts`, `savePersistence.ts`, `saveMigrations.ts`.
- Data: `properties`, `propertyExpansion`, `careers`, `districts`, `scenarios`, `runRoutes`, etc.

**TEAR DOWN (the dashboard shell — replace):**
- All of `src/pages/**` (Dashboard, Life, Properties, PropertyDetail, Market, Learn, Portfolio, Bank, Scenarios, Leaderboard and their panel sub-trees).
- Dashboard/Life/CommandCenter/Glossary/Sidebar/HUD components.
- The 14-route map → collapse to a focused flow.

**Net:** engine untouched ⇒ "realism everything in place" is satisfied by construction. Fun is delivered by a new presentation + a new fun-layer.

## 3. The new game: **"PROPERTY LAH! — A Singapore Story"**

A **narrative, card-driven property-life game**. You are a 27-year-old in the world's most expensive city with some savings and one dream: your own place — then maybe an empire. Each **month is a beat**. You swipe through life's decisions, snap up properties, watch your little skyline grow, and race the clock (and your kiasu classmates) to **financial freedom** before the music stops. The real Singapore rules are the *physics* that make every choice bite.

### 3.1 Design pillars (these are the fun yardstick)
1. **Live a story, don't operate a panel** — every turn is a *moment* (event card or a tactile choice), not a dashboard refresh.
2. **Tension & stakes** — a visible goal + life-runway timer, cliffhanger events, real risk of losing the dream.
3. **Identity & fantasy** — you're a *character* with a face and an arc; the portfolio is a pride object that grows.
4. **Meaningful, un-coached choices** — present dilemmas; let the player feel smart or regret. Kill the Decision Coach.
5. **Realism that bites, humanely surfaced** — engine numbers exact; shown as plain consequences + gut-checks, with real ratios one tap away ("why?").
6. **Juice** — count-ups, confetti on keys, coin sounds, card slides, the satisfying month-tick.
7. **One-more-turn pull** — short loop, escalating ambition, near-misses, social comparison.
8. **Instant clarity / mobile-first** — understandable in 10 seconds; thumb-friendly.

### 3.2 Screen architecture — collapse 14 routes → 1 play screen + overlays

```
/            Title — punchy, animated, "Start your story"  (re-skinned)
/new         "Who are you?" — 3-tap life setup (career · who · stakes)  (re-skinned wizard)
/play        THE GAME. Single living screen:
               • slim human status strip (name·age · Cash · Net worth→Freedom bar · date)
               • THE SCENE (center): event/decision card  OR  quiet-month action hub
               • heartbeat CTA: "Next Month ▶" with time-pass sweep + recap toast
             Overlays (never leave /play — modal sheets):
               • Listings DECK (Buy)         — swipeable property cards + gut-check verdicts
               • Buy SHEET                    — human cost story + CPF slider → KEYS! moment
               • Portfolio SHELF (Own)        — growing skyline; tap a unit → manage sheet
               • Bank SHEET                   — loans, pay-down
               • You SHEET                    — stats, achievements, rivals, the "why/rules"
/end         Victory / bankruptcy — dramatic, scored, shareable  (re-skinned)
```
Save/Load + Settings become lightweight sheets reachable from title and a small ⋯ on /play.

### 3.3 The monthly loop (the heartbeat)
1. Open on **The Scene**. If `currentScenario` is set → a **decision card** (headline, art, flavor, 2–3 choices). Choosing calls `resolveScenario(option)`; outcomes animate (cash ka-ching, value pop, reputation hearts), then a one-line consequence.
2. If no scenario → the **quiet-month hub**: 2–4 big tactile actions surfaced by lightweight intent (Browse listings / Manage a flat / Make a money move / Just advance). No coach telling you the "correct" move.
3. **Next Month ▶** → `nextTurn()`. A short time-pass sweep, then a **recap toast**: `+salary`, `+rent`, `−costs`, net cash delta, and a one-line **market mood** headline. Net-worth bar animates toward Freedom.
4. Occasionally a **rival ping** ("Your JC classmate just keyed in a condo at Clementi 🔑") and **milestone beats** (first keys, first tenant, first $1M, MOP cleared) fire as celebratory toasts.

### 3.4 The Buy experience (thrill of the deal)
- **Deck**, not a table: one property card at a time (art, name+district vibe, price, yield, a one-line agent pitch) with a **gut-check verdict chip** computed from the engine: `Steal` / `Comfortable` / `A Stretch` / `Blocked — ABSD 20%` / `Bank says no — TDSR`. Swipe to skip, tap to open.
- **Buy sheet** tells the cost as a *story*: "Downpayment $X (cash $A + CPF $B), stamp duty $C, the bank lends $L over 30 yrs → **$M/month**. After this you'll have $R left." CPF-use slider (bounded by engine rules). Blockers shown in plain English with a "why?" reveal of the true ratio.
- Confirm → **KEYS! 🔑** celebration (confetti, count-up of new net worth), the unit flies into your Shelf.

### 3.5 The Portfolio (visible tycoon fantasy)
- Your holdings as a **shelf of cards / a little growing skyline**, each showing: value with up/down trend, tenant status (a tiny tenant avatar / "vacant"), rent flowing in, a condition pip, MOP/renovation badges. This is the pride object.
- Tap a unit → **manage sheet** (rent it / set tenant strategy / renovate / handle a maintenance issue / sell) — focused, one unit at a time, not a page of panels.

### 3.6 Realism, surfaced humanely (dual-layer)
Default voice is **human**; the **real number is one tap away** for the nerds.
- ABSD 20% → "Second place? The taxman wants **$200k** extra. Ouch." → tap "why?" → "Additional Buyer's Stamp Duty: 20% for a citizen's 2nd property."
- TDSR fail → "🏦 The bank won't lend — your debts are already too heavy (55% rule)." → tap → exact TDSR %.
- CPF → "Your CPF chips in $B of the downpayment." → tap → OA balance + accrued-interest note.
This satisfies *both* the casual-fun and the realism mandates simultaneously. **No `/learn` page, no glossary panels** — explanation is just-in-time and inline.

### 3.7 Tension layer (new fun-layer modules — NO engine-realism changes)
Thin, pure additions under `src/engine/fun/**` (or `src/game/fun/**`), all derived from existing `Player`/`Market` state:
- **`lifeGoal` / freedom runway** — frames the run: "Reach $Xm net worth (your freedom number) by age 65 — or before you burn out." A visible runway meter (age vs target). Difficulty target reused from `difficultySettings`.
- **`rivals`** — 2–3 deterministic kiasu benchmark characters (seeded by RNG) whose net worth/portfolio ticks each year; they ping you ("Auntie next door sold for $1.5M", "classmate upgraded to a condo"). Pure social-comparison pressure & comedy. Derived, no persistence schema change required (recomputable from seed + turn).
- **`endings`** — dramatic win (financial freedom → legacy stinger) and loss (bankruptcy → "back to renting, but you learned…") screens with a **score** and a **shareable one-line result**.
- **Expanded SG event writing** — richer flavor on the existing scenario deck + a handful of new culturally-specific beats (BTO ballot result, en-bloc lottery, cooling-measure cliffhanger, renovation-from-hell, viral-rental-listing). Where new scenarios are added they go through the existing `scenarios` data shape + `resolveScenarioOption` — *no new financial math*, only new content.

### 3.8 Juice & feel
- `framer-motion` (already a dep) for card slides/flips, sheet transitions, the month-tick sweep.
- Number **count-ups** on cash/net-worth changes; **confetti** on keys & milestones (lightweight, no heavy dep — a tiny canvas burst).
- **Sound** hooks behind `settings.soundEnabled` (coin, keys, woosh, fail) — small WebAudio blips, no asset bloat; default on, easily muted.
- Respect `prefers-reduced-motion` and the existing `animationSpeed`/accessibility settings.

## 4. Component & data flow

```
useGameStore (UNCHANGED engine/store)
  │  player, market, currentScenario, settings + actions
  ▼
<PlayScreen>            // /play — orchestrates the loop, owns overlay state
  ├─ <StatusStrip>      // human top strip + Freedom bar (reads selectors)
  ├─ <Scene>            // chooses Decision card vs Quiet hub from currentScenario
  │    ├─ <DecisionCard>   // scenario → resolveScenario(option)
  │    └─ <QuietHub>       // tactile month actions → open overlays / nextTurn
  ├─ <NextMonthButton>  // nextTurn() + recap toast + sweep
  ├─ overlays (lazy):
  │    ├─ <ListingsDeck> + <BuySheet>   // buyProperty(...)
  │    ├─ <PortfolioShelf> + <UnitSheet> // sell/renovate/tenant/maintenance
  │    ├─ <BankSheet>                    // applyLoan/payLoan
  │    └─ <YouSheet>                     // stats/achievements/rivals/why-rules
  └─ <Toasts> / <Confetti> / <SoundFx>  // juice
fun-layer (pure, derived): lifeGoal.ts · rivals.ts · endings.ts · sceneDirector.ts
```
- **`sceneDirector`** (pure): given `player`/`market`/`currentScenario`, decides what The Scene shows and which 2–4 quiet-hub actions are relevant this month (replaces the "Decision Coach" but as *options*, never a single prescribed "correct" move).
- A small **UI kit** replaces GlassCard/HUD: `Card`, `Sheet`, `Stat`, `Verdict`, `Toast`, `CountUp`, `Confetti`, `PrimaryButton` — consistent, juicy, mobile-first.

## 5. Build sequence (each phase stays deployable & green)
- **P1** — New shell: routing collapse, `PlayScreen` skeleton, `StatusStrip`, `QuietHub`, `NextMonthButton` + recap, re-skinned title/new-game/end. Old pages removed. App builds, engine tests green.
- **P2** — `ListingsDeck` + `BuySheet` (gut-check verdicts, CPF slider, KEYS! juice) + `PortfolioShelf` + `UnitSheet`.
- **P3** — `DecisionCard` surfacing the scenario deck dramatically + recap toasts + count-ups/confetti/sound + dual-layer "why?".
- **P4** — fun-layer: `lifeGoal`/freedom runway, `rivals`, `endings` + scored shareable result, expanded SG event content.
- **P5** — onboarding intro, mobile pass, accessibility/sound polish, Vercel deploy.
- **EVAL** — capture real playthrough artifacts; dispatch **20 persona subagents**; aggregate the rubric; iterate to **≥8/10**.

## 6. Realism guardrails (non-negotiable)
- `src/engine/**` financial modules are **edited only for content/wiring, never to change a rule or number**. All existing engine tests stay green every phase (`npm test`).
- Any new fun-layer module is **pure + unit-tested** and reads existing state; it must not alter cash/CPF/loan math.
- Buy/sell/loan/tenant flows route through the existing `*Pure` engine functions via the store — the UI never re-implements finance.

## 7. Success criteria
1. 20 diverse persona subagents rate the experience **avg ≥ 8/10** on fun + UX (rubric in §3.1).
2. The game is understandable in **<10 s**, playable end-to-end on mobile, with a clear goal and dramatic ending.
3. Engine tests remain **100% green**; realism (CPF/ABSD/LTV/MSR/TDSR/amortization) verifiably intact.
4. Checkpointed to GitHub each phase; `docs/REDESIGN-JOURNAL.md` kept current.

## 8. Risks & mitigations
- **Scope creep** → phase gates; each phase ships a playable build.
- **Breaking the engine** → never edit financial logic; tests green every phase.
- **"Fun" is subjective** → the 20-persona rubric makes it measurable; iterate on lowest-scoring pillars.
- **Mobile/perf** → lazy overlays, lightweight juice (no heavy particle libs), reduced-motion respected.
- **Parallel-session git clobber** → isolated worktree; explicit `git add` paths only.
```
```
