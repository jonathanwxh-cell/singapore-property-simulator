# Singapore: A Lifetime — Full Game Design Spec

A multi-generational Singapore life simulator built on a property/finance engine.

---

## 1. Concept & Tagline

**Tagline:** *"Live a Singaporean lifetime. Then live another. And another. Until you understand."*

**Core Concept:** A multi-generational life simulator where property is the lens through which every Singaporean life is lived. Players don't optimize toward a net worth target — they discover what kind of Singaporean they become, measured in homes, decisions, and what they leave their children.

**Tone:** Grounded but irreverent. BitLife-style dark humor for heavy themes (retrenchment, divorce, en bloc displacement). Singlish-flavored writing. Cultural specificity over generic life sim tropes.

---

## 2. The Core Reframe

The current Singapore Property Simulator asks: *"Can you reach $15M net worth?"*
- Players treat it as a financial puzzle. They optimize. They don't feel anything.

The redesign asks: *"What kind of life will your home let you live?"*
- Property stops being numbers and becomes memory.
- The 4-room HDB in Tampines becomes where your kids grew up.
- The en bloc next door becomes a life-changing event.
- The mechanics barely change. The *meaning* changes completely.

This single reframe is what unlocks the jump from financial sim to life sim.

---

## 3. The 5 Design Pillars

### Pillar 1 — Property as Identity
Every district has personality (mechanical AND narrative):
- **Tiong Bahru**: hipster cafés, low ceilings, art-friend visits, +creativity, -space
- **Tampines**: heartland giant, school options, void-deck childhood, +community
- **Bukit Timah**: landed dreams, status pressure, cliquey neighbours, +prestige, -kampung spirit
- **Sembawang**: cheap, far, quiet, +savings, -happiness if young
- **Marine Parade**: aging boomer enclave, sea breeze, -youth network
- **Punggol**: young families, new infrastructure, kid-friendly, +family-fit
- **Geylang**: cheap, mixed reputation, food paradise, complex social signal
- (28 districts total, each with unique events and stat modifiers)

### Pillar 2 — Acts, Not Turns
Six narrative Acts replace the monthly grind. Within each Act, monthly turns still exist (engine unchanged), but each Act ends with a story-defining choice.

| Act | Years | Defining Question | Engine Layer |
|---|---|---|---|
| Heritage | 0–12 | What family did you inherit? | Background generation |
| Streaming | 12–21 | What kind of student were you? | PSLE / school / NS |
| Foundation | 21–30 | First flat, first love, first identity | Existing engine activates |
| Expansion | 30–45 | Upgrade or stay? Kids or no? | Property ladder + family |
| Apex | 45–60 | What's left to prove? | Investment + legacy planning |
| Legacy | 60+ | What do you leave your children? | Retirement + handoff |

### Pillar 3 — Multi-Generational Play (Killer Feature)
When your character dies/retires, you continue as **your child**, inheriting:
- Their property (paid off or with remaining mortgage)
- Their CPF balance (inheritance rules apply)
- Their cash and debts
- Their ancestor "legacy stat" (permanent buff/debuff)
- Their unresolved decisions and reputation

This transforms one life into a **dynasty across 60+ years**. The Crusader Kings model. Massive replay multiplier.

Examples of inheritance mechanics:
- Paid-off condo → kid skips BTO grind, starts at Act 4 wealth
- Gambling debt → kid starts with $0 and family stigma stat
- Kiasu parent's school district → kid gets PSLE bonus
- High-prestige career path → kid gets first-job referral
- Sandwich-generation parents → kid inherits eldercare obligation

### Pillar 4 — Cultural Authenticity as Mechanic
Not flavor. Systems.

- **Kiasu-meter**: competitiveness stat. High = better kid education outcomes, lower happiness, queue-jump events, broken friendships
- **Kampung Spirit**: neighborhood relationships. High = working lifts, BBQ pit access, block parties. Low = noise complaints, theft, council disputes
- **Food Choice as Wellbeing**: hawker / mall / home cooking → daily health/money/happiness deltas. "Regular hawker uncle" becomes recurring NPC
- **Race & Ethnic Quota**: affects HDB block options (real mechanic), cultural events, comfort in different neighbourhoods
- **NS Network**: male players' army friends become a lifelong network — job referrals, business partnerships, financial help during bad times
- **Singlish Mode**: optional toggle for full Singlish dialogue throughout
- **Cultural Calendar**: real Singapore events drive monthly flavor — CNY, Hari Raya, Deepavali, Vesak, NDP, GE, school holidays, monsoon season

### Pillar 5 — Informative Through Living, Not Lecturing
Replace explanation with experience:
- Loan rejected → screen shows: *"Your monthly debt would be $5,200. Bank says max is $4,500. You're $700 short."* — no textbook needed
- ABSD → watch $80k vanish from your account when you buy your second property — the rage IS the lesson
- MOP → the day your 5-year MOP ends, celebration screen pops — feels like a milestone
- COE → real bidding interface, lose, lose, finally win at $120k — you understand car ownership forever
- TDSR → bank rejects your dream condo — you'll never forget what TDSR means

---

## 4. The 14 Named Endings

Each run earns one. Collect them across plays. This is the meta-game that drives return visits.

| Ending | Path Description |
|---|---|
| Heartland Hero | Lifelong HDB, max happiness, hawker every day, kampung spirit maxed |
| En Bloc Millionaire | Got bought out, cashed out big at the right moment |
| FIRE at 45 | Retired early through investments + paid-off home |
| Property Tycoon | 3+ properties, maxed ABSD, lived for the chase |
| Sandwich Generation | Spent life supporting parents AND kids, forgot self |
| Kiasu King / Queen | Top schools, condo, prestige — emotionally bankrupt |
| Retire in JB | Couldn't keep up with SG, crossed the Causeway |
| Migrate | Left Singapore permanently for better life elsewhere |
| Negative Equity | Bought at peak, never recovered |
| Cash King | Rented forever, retired with massive cash, never owned |
| Kena Scam | Lost it all to investment fraud |
| Paper General | Civil service career, scholarship to retirement |
| Ah Beng Made Good | ITE → SME owner → property portfolio, redemption arc |
| Quiet Achiever | Modest life, debt-free, three healthy kids, happy |

Some endings are obvious paths. Some are hidden. Discovering a new ending is its own reward.

---

## 5. The Three-Layer Experience

```
Surface: Story & Drama          ← Why players return
  events, characters, endings, family arc

Middle: Strategic Choices       ← Why players think
  property timing, career, family planning

Foundation: Real SG Mechanics   ← Why it teaches
  CPF, ABSD, TDSR, MOP, BSD, MSR, LTV
```

All three layers operate simultaneously. A player chasing *Heartland Hero* (surface) makes choices about upgrading (middle), confronting ABSD math (foundation) — and learns ABSD without realising it.

---

## 6. What Stays vs. Changes vs. Adds

### STAYS (existing engine — don't touch)
- CPF math: OA/SA/MA, age-bracket contribution rates, wage ceiling, interest tiers
- Mortgage amortization, LTV caps (75/45/35), TDSR (55%), MSR (30%)
- Stamp duties: BSD 6-tier marginal, ABSD by buyer profile
- Property catalog (120+ listings, 28 districts, 9 types)
- Market simulation: price index, rental index, interest rate, volatility, cycles
- Scenario engine: probability branching, multi-outcome resolution
- Career income system, salary growth, take-home math
- Save/load (5 slots, profile transfer, autosave)
- Difficulty modifiers (Easy/Normal/Hard/Tycoon)
- Decision Coach explanation system
- Insolvency strike mechanic (3 strikes = bankruptcy)
- Achievement system (30+ titles)
- Run routes (8 existing arcs)

### CHANGES (reframe, not rewrite)
- **Win condition**: from "hit net worth target" → "complete life with a named ending"
- **Game flow**: from monthly grind → Act-based pacing with monthly grain inside
- **Narrative tone**: from financial-advisor → lived-experience Singlish
- **Difficulty axis**: from "harder targets" → "harder starting conditions" (born poor, born sick, born non-citizen)
- **End-game screen**: from score number → life summary card with ending, key moments, family tree

### ADDS (the new domains)
1. Family & relationships (marriage, kids, parents, divorce)
2. Multi-generational play (continue as your child)
3. Investment beyond property (stocks, REITs, SSB, CPFIS, SRS, crypto)
4. Career depth (15+ paths, retrenchment risk, business ownership, gig economy)
5. Cultural calendar (80+ recurring annual events)
6. Named endings system + run cemetery (family tree of past lives)
7. Challenge mode (themed weekly scenarios)
8. Life stages prologue (PSLE, school, NS, early career)
9. Real backend (Supabase: cloud saves, real leaderboard, share cards)
10. Localization (English, Mandarin, Malay, Tamil)

---

## 7. The 6 Expansion Domains (Scale Map)

Each domain ≈ +60–100 source files, +15–30k LOC. Stack to reach mid-size. Add platform layer for large.

### Domain 1 — Life Stages Prologue
*~70 files, ~18k LOC*
- PSLE mini-game (study vs play decisions over 3 years)
- School tier system → Express / NA / NT / IP
- Post-secondary branching: JC / Poly / ITE
- NS module (males): vocation, rank, IPPT, 2-year career gap
- Family background at birth: race, HDB tier, parents' income, starting cash

### Domain 2 — Family & Relationships System
*~80 files, ~22k LOC*
- Dating → marriage (ROM cost, banquet cost, joint CPF pooling)
- Children system (birth bonus, childcare, school choices, kiasu trap)
- Aging parents (financial support, eldercare, living arrangement)
- Divorce mechanics (property split, CPF clawback, single parent path)
- Family nucleus rules (HDB eligibility, grant amounts)
- Recursive PSLE: your kid plays the game you played

### Domain 3 — Investment Portfolio Beyond Property
*~70 files, ~20k LOC*
- SGX stocks (individual picks or ETFs)
- CPF Investment Scheme (CPFIS) — invest OA into STI ETF
- Singapore-listed REITs (dividend yield mechanics)
- Singapore Savings Bonds (SSB) — low-risk variable rate
- Supplementary Retirement Scheme (SRS) — tax savings for high earners
- Crypto (high volatility, post-2017 SG context)

### Domain 4 — Career & Business Depth
*~80 files, ~25k LOC*
- 15+ career paths (current 7 → add Hawker Owner, Grab Driver, Real Estate Agent, Teacher, SME Founder, Freelancer, Civil Servant tiers, Healthcare, Education, F&B)
- Business ownership: rent shop, hire staff, manage cashflow (mini hawker sim)
- Retrenchment system: triggered by market + industry risk + career stagnation
- Skillsfuture upskill paths: 6-month retraining unlocks new tier
- Gig economy track: never full-time, patch income across platforms

### Domain 5 — Events & Content at Scale
*~60 files, ~15k LOC (mostly data)*
- 80+ new scenarios across all life domains
- Singapore cultural calendar: CNY angpao, NDP rally, GE uncertainty, PSLE results season
- Policy shock events: GST hike, cooling measures, CPF rule changes, HDB classification overhaul
- "Kopi talk" events: zero mechanical impact, pure cultural texture
- Generational events: en bloc offers, lease decay anxiety, void-deck weddings

### Domain 6 — Meta-progression & Social Layer
*~80 files, ~20k LOC*
- Named life endings (14+ Singapore archetypes)
- Run history "cemetery" — family tree of all past lives across generations
- Challenge mode (weekly/seasonal themed runs)
- Real leaderboard (backend required)
- "Share your story" — one-click life summary card for social
- New Game+ mechanics (inherit one trait from last run)

---

## 8. Technical Architecture

### Stack (existing)
- **Frontend**: React + TypeScript
- **State**: Zustand
- **Styling**: Tailwind
- **Animation**: Framer Motion + GSAP
- **Test**: Vitest (329 specs)
- **Persistence**: localStorage (current) → Supabase (future)

### File Structure (target mid-size)

```
src/
  engine/              ← keep as-is, this is the heart
    cpf.ts
    mortgage.ts
    stampDuty.ts
    market.ts
    rng.ts
    scenarios.ts
  domains/             ← NEW: each expansion domain self-contained
    life-stages/       ← Act 1-2 (childhood, school, NS)
    family/            ← marriage, kids, parents
    career/            ← career paths, business, retrenchment
    investments/       ← stocks, REITs, SSB, SRS
    property/          ← existing property logic, refactored
    legacy/            ← inheritance, multi-gen handoff
  acts/                ← NEW: Act-based pacing layer
    act1-heritage.ts
    act2-streaming.ts
    act3-foundation.ts
    act4-expansion.ts
    act5-apex.ts
    act6-legacy.ts
  endings/             ← NEW: named endings system
    detection.ts
    cards.ts
  data/                ← expand existing
    scenarios/         ← 100+ scenarios organized by domain
    districts/         ← 28 districts with personality data
    careers/           ← 15+ career paths
    cultural/          ← calendar events, festivals
  game/
    useGameStore.ts    ← extend existing Zustand store
    slices/            ← per-domain state slices
  pages/               ← extend existing UI
    acts/              ← Act-specific screens
    cemetery/          ← run history / family tree
    challenges/        ← challenge mode
  components/          ← extend existing
  backend/             ← FUTURE: Supabase integration
    auth.ts
    saves.ts
    leaderboard.ts
```

### State Shape Extensions

```typescript
GameState {
  // EXISTING (keep)
  player: Player
  market: MarketState
  currentScenario: string | null

  // NEW
  currentAct: ActId
  actProgress: Record<ActId, ActProgress>
  family: FamilyTree {
    self: Character
    spouse?: Character
    children: Character[]
    parents: Character[]
  }
  ancestry: PastCharacter[]  // multi-gen
  endingsUnlocked: EndingId[]
  challengeProgress: ChallengeState
  investments: {
    stocks: Holding[]
    reits: Holding[]
    ssb: Holding[]
    srs: number
    crypto: Holding[]
  }
}
```

---

## 9. Build Roadmap (Phased)

### Phase 0 — The Reframe (2 weeks, no new content)
1. Replace win condition with named endings system
2. Restructure flow into 6 Acts (existing turns map to Acts 3-5)
3. Rewrite scenario flavor text in Singapore voice
4. Add ending screen with life summary card

**Outcome:** 6.5/10 → 7.5/10 fun. Zero new content needed.

### Phase 1 — Make It Feel Like a Life Game (3–4 months)
- Named endings system (full 14 endings + detection logic)
- Life stages prologue: PSLE → NS → early career
- 40+ new scenarios with Singapore cultural flavor
- Run cemetery / life history screen

### Phase 2 — Deepen Human Stakes (3–4 months)
- Family & relationships system (marriage, kids, parents)
- Career depth + retrenchment risk
- Multi-generational handoff (basic version)
- Cultural calendar implementation

### Phase 3 — Expand Financial Sandbox (2–3 months)
- Investment portfolio domain (stocks, REITs, SSB, CPFIS, SRS)
- Business ownership (hawker stall, SME)
- Crypto subsystem (optional, era-specific)

### Phase 4 — Platform Layer (4–6 months)
- Backend (Supabase: auth, real leaderboard, cloud saves)
- Challenge mode + weekly themed events
- Share your story social cards
- Localization scaffolding

### Phase 5 — Scale to Large (ongoing)
- Content pipeline / admin panel
- Multi-generational play (full dynasty system)
- Mobile app (Capacitor or React Native)
- 4-language localization
- Community features (share challenges, comment scenarios)

**Cumulative scale:**
- End of Phase 1: ~280 files, ~60k LOC
- End of Phase 3: ~600 files, ~140k LOC (solid mid-size)
- End of Phase 5: ~2000+ files, ~400k+ LOC (large)

---

## 10. Game Design Principles (Research-Backed)

### What Makes Life Sims Fun (BitLife, The Sims, CK3, Alter Ego)
1. **Variable-ratio reinforcement**: unpredictable consequences keep players tapping (Skinner box mechanic)
2. **"Living a Thousand Lives" fantasy**: parallel lives without real consequence
3. **Named endings (collection drive)**: every run earns a label; players collect across runs
4. **Emergent storytelling**: characters with traits + relationships + memory generate drama the designer didn't write
5. **Authorship effect**: players feel responsible for digital character outcomes; activates empathy circuits
6. **Tone balance**: minimalist presentation of dark themes creates comic distance, makes heavy content playable

### Core Choice Design Rules
- Both options must be viable (no trap choices)
- Player must be able to partly predict consequences (not pure RNG)
- Choice must reflect values, not just optimization
- Consequences must ripple forward visibly
- **AVOID false choice**: options that look different but converge to same outcome

### The Simulation Dream Principle (Tynan Sylvester)
- You cannot simulate everything; don't try
- Simulate human stakes deeply (money, family, status, time)
- Keep mechanical layers shallow; let imagination fill the rest
- Player's mental model OF the game IS the game

### Pitfalls to Avoid
- Randomness without agency (events feel disconnected from choices)
- Opaque systems (player can't tell why they're unhappy)
- Paywalled depth (kills community trust)
- Repetition cliff (must keep adding goals/content)
- False agency (choices that don't matter)
- Fun over meaning (dopamine mechanics replacing emotional depth)

### Replayability Levers (in order of impact)
1. Variable starting conditions (most impactful)
2. Named endings as collection
3. Challenge mode (creative constraint)
4. Emergent surprise (random events seeded by past choices)
5. Skill ceiling (system mastery rewards multiple runs)
6. Meta-progression across runs (Hades model)

---

## 11. Variable Starting Conditions (Replayability Multiplier)

Each run can roll or be selected with different starting context:

### Family Tier
- **Born Rich**: parents own landed, $100k starting cash, +education, -hunger
- **Born Middle**: 5-room HDB family, $20k starting cash, neutral
- **Born Poor**: rental flat, $0 starting cash, +grit, -education access
- **Born Expat**: PR pathway, parent on EP, no HDB eligibility, $50k cash

### Birth Year (Era)
- **1985 Cohort**: lived through 90s boom, 2008 crisis, current era
- **2000 Cohort**: HDB BTO era, COVID era, current cooling measures
- **2010 Cohort**: cooling measures era, post-pandemic, AI/tech boom
- **2020 Cohort**: future-uncertain, climate-anxious

### Citizenship Status
- **Singapore Citizen** (default): full HDB access, lower ABSD
- **Permanent Resident**: 5% ABSD, restricted HDB
- **Foreigner**: 60% ABSD, no HDB, +career flexibility

### Gender
- **Male**: NS mandatory (2 years), reservist obligations until 40
- **Female**: no NS, earlier career start, different career pressures

### Race (affects HDB ethnic quota, cultural events)
- Chinese / Malay / Indian / Eurasian / Others

**Combinations:** 4 × 4 × 3 × 2 × 5 = 480 distinct starting setups. Combined with 14 endings = essentially infinite replayability.

---

## 12. Singapore-Specific Mechanics That Create Identity

These are the non-negotiables — the mechanics no other life sim has, that make this game distinctly Singaporean:

| Mechanic | What it teaches | Emotional hook |
|---|---|---|
| CPF OA/SA/MA | Forced savings architecture | Watching it grow vs drain |
| BTO Ballot | Queue + luck system | 7-year wait anxiety |
| MOP (5-year) | Patience as wealth | Countdown UI ritual |
| ABSD progressive tiers | Property speculation cost | The $80k vanish moment |
| TDSR/MSR | Debt servicing limits | The rejection moment |
| HDB Ethnic Quota | Racial harmony policy | Block selection friction |
| NS 2-year + reservist | Time as opportunity cost | Career gap reality |
| PSLE T-score | School tier compounding | Recursive parenting |
| COE bidding | Scarcity-priced cars | Auction adrenaline |
| En Bloc | Collective ownership upside | Lottery-like windfall |
| 99-yr Leasehold | Decay anxiety | Time pressure on legacy |
| Skillsfuture | Mid-career reinvention | Second-chance mechanic |
| CPF Top-up | Retirement seriousness | Future-self investment |

---

## 13. Success Criteria

### Functional success (Phase 1 complete)
- Player can complete a full life from age 0 to retirement
- 5+ distinct endings achievable
- 6 Acts each have ≥3 unique decision moments
- Existing property mechanics fully integrated into Act 3-5

### Fun success (research-backed metrics)
- Average run length: 30–60 minutes (sweet spot for life sims)
- 60%+ of players complete a 2nd run within 24 hours
- Players can name their previous run's ending in conversation
- Players share life summary cards organically

### Educational success
- Players who finish 3 runs can correctly explain CPF OA/SA/MA, ABSD tiers, TDSR, MOP without prompting
- Players make better real-world property decisions after playing (anecdotal validation)

### Scale success (mid-size)
- 600+ source files
- 140k+ LOC
- 4–5 interconnected simulation domains
- 100+ scenarios
- 14+ endings
- Backend + cloud saves operational

---

## 14. The Pitch (One Paragraph)

> Singapore: A Lifetime is a multi-generational life simulator where property is the lens through which every Singaporean life is lived. Born into a HDB flat in 1985 or a landed in 2000, you navigate PSLE, NS, BTO ballots, ABSD shocks, en bloc windfalls, and the eternal question of whether to upgrade. When you retire or die, you continue as your child — inheriting your home, your CPF, and your unresolved decisions. Every life ends with a name: Heartland Hero, En Bloc Millionaire, Retire in JB, Kiasu King. There are 14 endings to discover, 480 starting permutations, and one question that takes a thousand lifetimes to answer: what kind of Singaporean will you become?

---

*Version 1.0 — Built on existing Singapore Property Simulator engine*
