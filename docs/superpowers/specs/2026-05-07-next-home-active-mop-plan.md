# Next Home / Active MOP Plan

## Purpose

This spec turns the MOP wall into a playable five-year campaign phase.

The MOP deep-dive feedback shows a consistent player problem: after buying the first HDB / first home, the player can hit a 60-month period where residential purchase progression is blocked and the game risks becoming dead-clicking. The requested features differ by persona, but the common pattern is clear: MOP months need to feel productive, strategic, and connected to the next property decision.

This document is the reference plan for future agents. Do not implement the feedback as 80 disconnected mini-features. Build a coherent UX spine and progression engine first, then slot feature tracks into that spine.

## Product Thesis

MOP should become a **Next Home campaign**, not a timer.

Current loop:

```txt
Buy first home -> wait 60 months -> occasionally handle events -> buy next property
```

Target loop:

```txt
Buy first home -> open Next Home Plan -> choose monthly focus -> progress tracks -> handle property/life events -> reach MOP exit with a strategy
```

The player should always know:

```txt
What am I working toward?
What can I do this month?
How did this move me closer to Property #2?
What risk did I create?
```

Every MOP feature must connect back to the next property decision:

- Renovation improves resale value, rent potential, condition, or sale readiness.
- Tenant operations improve cashflow, reserve safety, or landlord reputation.
- Side business improves cash savings but costs energy and stress.
- Career progression improves salary, TDSR headroom, job resilience, and loan size.
- Investing can improve or damage the down-payment runway.
- Family systems clarify space needs, school timing, childcare costs, and upgrade urgency.
- Market intel improves target selection, timing confidence, and district knowledge.
- Community affects estate quality, neighbour support, disputes, and property desirability.
- Overseas scouting creates an alternative allocation path, but should remain secondary until the Singapore MOP loop is fun.

## UX Strategy

Do not add nine new tabs.

Add one new route:

```txt
/next-home
```

UI label:

```txt
Next Home Plan
```

Prefer `Next Home Plan` over `MOP Plan`. MOP is the constraint; the next home is the goal.

### Dashboard Role

Dashboard remains the command center. It should show a gateway card into the deeper MOP system:

```txt
Next Home Plan

42 MOP months left
Readiness: 38%
Current bottleneck: cash buffer
Best move this month: grow side income

[Open Plan] [Do Recommended Move]
```

Do not place all MOP systems on Dashboard. Dashboard is already responsible for the first-read command center, campaign status, monthly intent, market pulse, property attention, decision guidance, and stats. More full-size cards will make the UX worse.

Dashboard should summarize and route. `/next-home` should manage.

### Next Home Plan Page

The `/next-home` page should be mobile-first and organized as:

1. Next Property Goal
2. This Month's Focus
3. Progress Tracks
4. Timeline
5. Event Inbox
6. Latest Recap

### 1. Next Property Goal Hero

Example:

```txt
Target
4-room resale / EC / private condo / selected target

Readiness
38%

Need
S$220K cash + CPF
You have S$71K usable

MOP
42 months left

Projection
At current pace: ready 6 months after MOP

Main bottleneck
Cash buffer / income / loan limit / family space / market timing
```

This widget is the emotional anchor. Every subsystem should feed it.

### 2. This Month's Focus

Show three choices max.

```txt
Recommended
Grow Side Business
Expected: +S$700 cash, +Business XP
Cost: -8 energy
Why: cash buffer is the current bottleneck

Alternative
Kitchen Upgrade
Expected: +7% rent potential, +value uplift
Cost: S$18K, 2 months
Risk: contractor delay

Alternative
Study District Trends
Expected: +Market Intel XP
Cost: no cash, 1 month
Why: improves MOP exit timing
```

Use and extend the existing monthly intent model rather than creating a separate monthly-choice system. The existing model already has label, detail, upside, risk, primary action, secondary action, route, recommendation, and tone.

### 3. Progress Track Cards

Example grid:

```txt
Home Projects        Level 2   45%
Tenant & Landlord    Level 3   71%
Side Business        Level 1   20%
Career               Level 2   55%
Investing            Level 1   10%
Family               Level 1   35%
Market Intel         Level 2   40%
Community            Level 1   15%
Overseas             Locked
```

Each card shows:

```txt
Current project
Next unlock
Effect on Next Home Plan
Risk / upkeep
CTA
```

Example:

```txt
Side Business
Level 2: Repeatable Income

Current: Freelance marketing retainers
Income: S$650/month average
Next unlock: Hire helper
Effect: improves cash readiness by +4%
Risk: stress rising

[Manage]
```

### 4. Timeline

Use a 60-month MOP timeline.

```txt
Month 18 / 60

Now
↓
Kitchen renovation completes
↓
Childcare decision
↓
Lease renewal
↓
MOP ends
↓
Upgrade window
```

MOP is about time. If time is invisible, waiting feels dead. Make time strategic.

### 5. Event Inbox

Do not turn every event into a modal.

Use severity:

```txt
Critical — must resolve before advancing
Important — recommended
FYI — auto-logged
```

Example:

```txt
Critical
Tenant reports water leak
Resolve before next month

Important
Headhunter offers interview
Can improve salary path

FYI
District 15 resale prices cooled 1.2%
Market Intel updated
```

This gives the world life without modal fatigue.

### 6. Month Recap Drawer

After advancing month:

```txt
May 2027 Recap

Cash +S$1,420
CPF +S$840
Side business +S$650
Tenant satisfaction -3
Kitchen renovation: 1 month remaining
Next Home readiness: 38% -> 40%

Best next move: protect energy
```

Players need clear cause/effect.

## UX Components

Add:

```txt
src/pages/NextHomePlan.tsx

src/components/nextHome/
  NextHomeGatewayCard.tsx
  NextHomeHero.tsx
  PropertyGoalProgress.tsx
  MonthlyFocusCards.tsx
  ProgressionTrackGrid.tsx
  ProgressionTrackCard.tsx
  NextHomeTimeline.tsx
  EventInbox.tsx
  ImpactPreview.tsx
  MonthRecapDrawer.tsx
  BottleneckBadge.tsx
  TrackLevelBadge.tsx
```

Update:

```txt
src/App.tsx
src/components/GameLayout.tsx
src/pages/Dashboard.tsx
src/engine/monthlyIntents.ts
```

Add route:

```tsx
<Route path="/next-home" element={<NextHomePlan />} />
```

Dashboard gateway example:

```tsx
<NextHomeGatewayCard
  goal={nextHomeGoal}
  recommendation={recommendedFocus}
  onOpen={() => navigate('/next-home')}
  onDoRecommended={() => handleSelectIntent(recommendedFocus)}
/>
```

## Code Architecture

Add a progression layer. Keep it pure-engine-first, not React-first.

```txt
src/engine/progression/
  types.ts
  tracks.ts
  goals.ts
  events.ts
  projects.ts
  resolveProgressionMonth.ts
  selectors.ts
  bottlenecks.ts
  timeline.ts
  __tests__/
```

Do not bury progression rules inside UI components.

## Core Types

Add to `src/game/types.ts` or `src/engine/progression/types.ts` and re-export as needed:

```ts
export type ProgressionTrackId =
  | 'home-projects'
  | 'landlord'
  | 'side-business'
  | 'career'
  | 'investing'
  | 'family'
  | 'market-intel'
  | 'community'
  | 'overseas';

export type ProgressionDecisionSeverity = 'critical' | 'important' | 'info';

export type ProgressionProjectStatus =
  | 'planned'
  | 'active'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface ProgressionTrackState {
  id: ProgressionTrackId;
  level: number;
  xp: number;
  unlocked: boolean;
  activeProjectIds: string[];
  completedProjectIds: string[];
  lastEventTurn?: number;
}

export interface ProgressionProjectState {
  id: string;
  templateId: string;
  trackId: ProgressionTrackId;
  label: string;
  status: ProgressionProjectStatus;
  startedTurn: number;
  durationMonths: number;
  remainingMonths: number;
  cashCost: number;
  energyCost?: number;
  riskPct: number;
  relatedPropertyId?: string;
}

export interface ProgressionDecision {
  id: string;
  trackId: ProgressionTrackId;
  severity: ProgressionDecisionSeverity;
  title: string;
  detail: string;
  createdTurn: number;
  expiresTurn?: number;
  options: ProgressionDecisionOption[];
}

export interface ProgressionDecisionOption {
  id: string;
  label: string;
  detail: string;
  cashDelta?: number;
  energyDelta?: number;
  stressDelta?: number;
  xpDelta?: Partial<Record<ProgressionTrackId, number>>;
  effects?: ProgressionEffect[];
}

export interface ProgressionLogEntry {
  id: string;
  turn: number;
  trackId: ProgressionTrackId;
  title: string;
  detail: string;
  tone: 'good' | 'warn' | 'bad' | 'neutral';
  relatedPropertyId?: string;
}

export interface NextPropertyGoal {
  targetPropertyType: string;
  targetDistrictId?: string;
  estimatedPrice: number;
  requiredCashAndCpf: number;
  usableCashAndCpf: number;
  readinessPct: number;
  monthsUntilMopEnds: number;
  projectedReadyTurn: number;
  bottleneck: NextHomeBottleneck;
}

export type NextHomeBottleneck =
  | 'mop'
  | 'cash'
  | 'cpf'
  | 'income'
  | 'loan-limit'
  | 'family-space'
  | 'market-timing'
  | 'risk-buffer'
  | 'none';

export interface PlayerProgressionState {
  tracks: Record<ProgressionTrackId, ProgressionTrackState>;
  projects: ProgressionProjectState[];
  decisions: ProgressionDecision[];
  log: ProgressionLogEntry[];
  nextPropertyGoal?: NextPropertyGoal;
}
```

Add to `Player`:

```ts
progression?: PlayerProgressionState;
```

Keep this nested under `player.progression`. Do not add dozens of top-level `Player` fields.

## Save Schema And Hydration

Update `src/data/saveSchema.ts`.

Recommended migration path:

1. Add `progression` as optional.
2. Hydrate missing progression in `finalizePlayer`.
3. Bump `SAVE_VERSION` only when migration support is in place.
4. Keep old saves safe.
5. After enough releases, treat progression as required internally.

Hydrator example:

```ts
function withProgressionDefaults(player: Player): Player {
  return {
    ...player,
    progression: normalizeProgressionState(player.progression, player),
  };
}
```

Then update `finalizePlayer`:

```ts
function finalizePlayer(player: Player): Player {
  const hydrated = withRunRouteDefaults(
    withBuyerProfileDefaults(
      withLifeDefaults(
        withPortfolioDefaults(
          withProgressionDefaults(
            withCareerDefaults(player)
          )
        )
      )
    )
  );

  return withEvaluatedAchievements(withNetWorth(hydrated));
}
```

## Monthly Turn Integration

Integrate progression inside `advanceTurn` after life/portfolio resolution and before scenario selection.

```ts
const progressionStep = resolveProgressionMonth({
  player,
  market,
  rng,
  lifeResolution,
  portfolioStep,
  newTurnCount,
});
```

Then include in `newPlayer`:

```ts
progression: progressionStep.progression,
cash: newCash + progressionStep.cashDelta,
life: progressionStep.life ?? lifeResolution.nextLife,
```

Keep a dedicated `progression.log`. Do not overload `operationHistory` with all MOP events.

## Store Actions

Add generic progression actions to `useGameStore`:

```ts
setNextPropertyGoal: (goalInput: Partial<NextPropertyGoal>) => void;
selectMonthlyFocus: (focusId: MonthlyIntentId) => ActionResult;
startProgressionProject: (templateId: string) => ActionResult;
resolveProgressionDecision: (decisionId: string, optionId: string) => ActionResult;
dismissProgressionDecision: (decisionId: string) => ActionResult;
```

Avoid one store action per feature. Track-specific logic belongs in the engine.

## Progression Engine Modules

### `tracks.ts`

Define track metadata.

```ts
export const progressionTracks: Record<ProgressionTrackId, ProgressionTrackDefinition> = {
  'home-projects': {
    label: 'Home Projects',
    description: 'Renovate, furnish, and improve resale/rent potential.',
    unlock: 'owned-first-home',
  },
  landlord: {
    label: 'Landlord',
    description: 'Manage tenants, room rental, repairs, and reputation.',
    unlock: 'owned-rentable-home',
  },
  'side-business': {
    label: 'Side Business',
    description: 'Build income streams during MOP.',
    unlock: 'always',
  },
  career: {
    label: 'Career',
    description: 'Improve salary, loan eligibility, and job resilience.',
    unlock: 'always',
  },
  investing: {
    label: 'Investing',
    description: 'Deploy surplus cash with risk.',
    unlock: 'cash-buffer',
  },
  family: {
    label: 'Family',
    description: 'Manage household needs, childcare, and space pressure.',
    unlock: 'family-profile',
  },
  'market-intel': {
    label: 'Market Intel',
    description: 'Research districts and plan MOP exit.',
    unlock: 'always',
  },
  community: {
    label: 'Community',
    description: 'Build neighbour relationships and estate quality.',
    unlock: 'hdb-owner',
  },
  overseas: {
    label: 'Overseas',
    description: 'Scout foreign markets and FX exposure.',
    unlock: 'advanced',
  },
};
```

### `goals.ts`

Computes `NextPropertyGoal`.

Selectors:

```ts
getNextPropertyGoal(player, market): NextPropertyGoal
getUpgradeReadiness(player, goal): number
getNextHomeBottleneck(player, goal): NextHomeBottleneck
getMopMonthsRemaining(player): number
```

### `bottlenecks.ts`

Turns numeric state into UX explanation.

Example logic:

```ts
if (mopRemaining > 0 && readinessPct >= 90) return 'mop';
if (usableCashAndCpf < required * 0.6) return 'cash';
if (tdsrHeadroom < requiredPayment) return 'income';
if (familySpaceScore < 40) return 'family-space';
if (marketCycleScore < 35) return 'market-timing';
```

### `resolveProgressionMonth.ts`

Owns monthly ticking.

```ts
export function resolveProgressionMonth(input: ProgressionMonthInput): ProgressionMonthOutput {
  let progression = normalizeProgressionState(input.player.progression, input.player);

  progression = advanceProjects(progression, input);
  progression = awardMonthlyXp(progression, input);
  progression = maybeCreateProgressionEvents(progression, input);
  progression = refreshNextPropertyGoal(progression, input);

  return {
    progression,
    cashDelta,
    lifePatch,
    logEntries,
  };
}
```

Progression events must use the seeded RNG pattern so playthroughs remain deterministic.

## Feature Roadmap

### Phase 0 — UX Shell And Goal Spine

**PR 1: `feat: add Next Home Plan UX shell`**

Files:

```txt
src/App.tsx
src/pages/NextHomePlan.tsx
src/pages/Dashboard.tsx
src/components/nextHome/*
src/engine/progression/goals.ts
src/engine/progression/bottlenecks.ts
src/engine/progression/selectors.ts
```

Ships:

- `/next-home`
- Dashboard gateway card
- Next Property Goal hero
- readiness percentage
- MOP months remaining
- bottleneck label
- placeholder track cards
- no deep gameplay yet

This is first because it lets us validate the new MOP flow before building many systems.

### Phase 1 — Progression State Foundation

**PR 2: `feat: add progression state and save migration`**

Files:

```txt
src/game/types.ts
src/data/saveSchema.ts
src/game/useGameStore.ts
src/engine/progression/types.ts
src/engine/progression/tracks.ts
src/engine/progression/selectors.ts
src/engine/progression/__tests__/progressionState.test.ts
```

Ships:

- `PlayerProgressionState`
- default hydration
- track unlock logic
- save schema update
- no major gameplay yet

### Phase 2 — Monthly Focus System

**PR 3: `feat: add next-home monthly focus loop`**

Files:

```txt
src/engine/monthlyIntents.ts
src/engine/progression/resolveProgressionMonth.ts
src/components/nextHome/MonthlyFocusCards.tsx
src/components/nextHome/ImpactPreview.tsx
src/components/nextHome/MonthRecapDrawer.tsx
src/game/useGameStore.ts
```

Ships:

- choose monthly focus
- preview impact
- advance month from focus
- recap drawer
- recommendation logic based on bottleneck

### Phase 3 — Home Projects

**PR 4: `feat: add room renovation projects`**

Why first: existing code already has renovation, tenant, maintenance, reserve, MOP, condition score, and operation history mechanics.

Files:

```txt
src/data/homeProjects.ts
src/engine/progression/homeProjects.ts
src/components/nextHome/HomeProjectsPanel.tsx
src/components/nextHome/ProjectTimeline.tsx
src/components/nextHome/ContractorChoice.tsx
src/engine/progression/__tests__/homeProjects.test.ts
```

Features:

- room-by-room projects
- kitchen, bathroom, flooring, smart home, layout
- contractor choice: Budget / Standard / Premium
- duration and overrun risk
- rent/value/condition impact
- progress shown in timeline
- before/after stat cards

Skip initially:

- drag-and-drop floorplans
- furniture catalog
- generated room visuals
- Pinterest-style boards

### Phase 4 — Landlord / Tenant Depth

**PR 5: `feat: add tenant personalities and landlord events`**

Files:

```txt
src/data/tenantPersonalities.ts
src/data/landlordEvents.ts
src/engine/progression/landlord.ts
src/components/nextHome/LandlordTrackPanel.tsx
src/engine/progression/__tests__/landlordTrack.test.ts
```

Features:

- tenant personality types
- tenant life events
- renewal / dispute / neighbour complaint events
- landlord reputation
- tenant referral probability

Initial tenant types:

```txt
Student
Professional
Family
Problematic
```

Each has:

```ts
rentTolerance
satisfactionDrift
defaultRisk
turnoverRisk
damageRisk
referralChance
```

### Phase 5 — Side Business

**PR 6: `feat: add side business progression`**

Replace generic side gig with a real progression track.

Files:

```txt
src/data/sideBusinesses.ts
src/engine/progression/sideBusiness.ts
src/components/nextHome/SideBusinessPanel.tsx
src/engine/progression/__tests__/sideBusiness.test.ts
```

Gig types:

```txt
Freelance
Tutoring
Content creation
Food delivery
E-commerce
Property agent part-time
F&B stall
Car detailing
```

Levels:

```txt
Starter -> Repeatable -> Established -> Delegated
```

State:

```ts
businessType
level
monthlyIncomeMean
monthlyIncomeVolatility
energyCost
stressCost
failureRisk
networkingScore
```

Hard balance rule:

> Side business can accelerate Property #2, but cannot dominate salary + property investment on Normal/Hard.

### Phase 6 — Career RPG

**PR 7: `feat: add career certifications and negotiation events`**

Files:

```txt
src/data/careerCertifications.ts
src/engine/progression/career.ts
src/components/nextHome/CareerTrackPanel.tsx
src/engine/progression/__tests__/careerProgressionTrack.test.ts
```

Features:

- certifications
- skill XP
- annual review modifiers
- job offer events
- salary negotiation choices

Example certs:

```txt
PMP
AWS
CFA-lite
RES
MBA
```

Effects:

```ts
salaryGrowthModifier
jobOfferChance
careerRiskModifier
loanReadinessImpact
```

### Phase 7 — Market Intel

**PR 8: `feat: add market intel and district trend planning`**

Files:

```txt
src/engine/progression/marketIntel.ts
src/data/districtTrends.ts
src/components/nextHome/MarketIntelPanel.tsx
src/components/charts/*
src/engine/progression/__tests__/marketIntel.test.ts
```

Features:

- district trend history from simulated data
- market cycle indicator
- buy window forecast
- target district comparison
- MOP exit timing recommendation

Keep this deterministic and game-native first. Do not depend on external property APIs.

### Phase 8 — Investing

**PR 9: `feat: add simulated investment portfolio`**

Files:

```txt
src/data/investmentAssets.ts
src/engine/progression/investing.ts
src/components/nextHome/InvestingPanel.tsx
src/engine/progression/__tests__/investing.test.ts
```

Use synthetic assets first:

```txt
SG Bank Basket
Industrial REIT Basket
T-Bill Ladder
Global Tech ETF
Crypto Basket
```

Avoid real securities at launch. Keep it educational and game-native.

State:

```ts
holdings
cashInvested
unrealizedGain
monthlyDividend
riskLevel
```

### Phase 9 — Family

**PR 10: `feat: add family progression and space needs`**

Files:

```txt
src/data/familyEvents.ts
src/engine/progression/family.ts
src/components/nextHome/FamilyTrackPanel.tsx
src/engine/progression/__tests__/familyTrack.test.ts
```

Features:

- baby/toddler milestones
- childcare choices
- family budget pressure
- space satisfaction
- upgrade urgency advisor

Extend the existing life state rather than creating a disconnected family simulator.

### Phase 10 — Community

**PR 11: `feat: add community and neighbour relationships`**

Files:

```txt
src/data/communityEvents.ts
src/engine/progression/community.ts
src/components/nextHome/CommunityPanel.tsx
src/engine/progression/__tests__/communityTrack.test.ts
```

Features:

- neighbour relationship score
- community events
- estate quality
- neighbour help network
- dispute mediation

Keep it relationship + estate quality + event choices, not a full town-council simulator.

### Phase 11 — Overseas

**PR 12: `feat: add overseas scouting track`**

Do this last.

Files:

```txt
src/data/overseasMarkets.ts
src/engine/progression/overseas.ts
src/components/nextHome/OverseasPanel.tsx
src/engine/progression/__tests__/overseasTrack.test.ts
```

Start with scouting, not full purchase mechanics.

Markets:

```txt
JB
Bangkok
Melbourne
London
```

Initial features:

- scouting trips
- FX exposure preview
- SG vs overseas ROI calculator
- overseas market event feed
- overseas purchase feasibility unlock

Do not let overseas become the main game before the Singapore MOP loop is fun.

## Event Cadence

Do not implement 1–2 major events every turn. That will create fatigue.

Use this cadence:

```txt
Every turn:
  at least one visible progress update

Every 2–3 turns:
  one minor event or project milestone

Every 4–6 turns:
  one meaningful decision

Rare:
  major life/career/market event
```

Implementation:

```ts
export function maybeCreateProgressionEvents(input): ProgressionDecision[] {
  const eventBudget = getMonthlyEventBudget(input.player);

  const candidates = [
    ...getLandlordEventCandidates(input),
    ...getSideBusinessEventCandidates(input),
    ...getFamilyEventCandidates(input),
    ...getCareerEventCandidates(input),
    ...getMarketIntelEventCandidates(input),
  ];

  return pickEventsBySeverityAndCooldown(candidates, eventBudget, input.rng);
}
```

Rules:

```txt
critical max: 1 active
important max: 3 active
info can be logged without blocking
same track cooldown: 2 months
same exact event cooldown: 12 months
```

## Recommendation Engine

Recommendations should be bottleneck-driven.

```ts
export function getRecommendedMonthlyFocus(player: Player): MonthlyIntentOption {
  const goal = getNextPropertyGoal(player, market);
  const bottleneck = getNextHomeBottleneck(player, goal);

  switch (bottleneck) {
    case 'cash':
      return sideBusinessOrCareer(player);
    case 'income':
    case 'loan-limit':
      return careerPush(player);
    case 'risk-buffer':
      return buildReserve(player);
    case 'family-space':
      return familyPlanning(player);
    case 'market-timing':
      return marketIntel(player);
    case 'mop':
      return homeProjectOrTenantOps(player);
    default:
      return balancedProgress(player);
  }
}
```

UX copy should explain the recommendation:

```txt
Recommended because your loan limit, not MOP, is now the blocker.
```

## Balancing Rules

### Side Business

```txt
Starter: S$200-800/month
Repeatable: S$600-1,500/month
Established: S$1,200-3,000/month
Delegated: S$800-2,500/month passive but requires capital
```

Costs:

```txt
Energy drain
Stress increase
Career momentum penalty if overused
Business failure events
```

### Investing

```txt
T-bills: low return, low risk
REITs: moderate return, drawdown risk
Bank basket: cyclical
Global tech: high volatility
Crypto basket: extreme volatility
```

Hard rule:

> Investments can improve the MOP story, but must also create regret stories.

### Renovation

Every renovation should have:

```txt
cash cost
duration
value impact
rent impact
condition impact
delay risk
overrun risk
tenant disruption risk
```

### Family

Family systems should not just punish the player.

They should create trade-offs:

```txt
higher household cost
stress pressure
space pressure
but support, motivation, grants, and planning clarity
```

## Testing Plan

Add:

```txt
npm run test:mop
```

New tests:

```txt
progressionState.test.ts
nextPropertyGoal.test.ts
mopMeaningfulTurns.test.ts
homeProjects.test.ts
landlordTrack.test.ts
sideBusiness.test.ts
careerTrack.test.ts
marketIntel.test.ts
investing.test.ts
familyTrack.test.ts
communityTrack.test.ts
overseasTrack.test.ts
```

Core MOP regression:

```ts
it('keeps MOP from becoming dead-clicking', () => {
  const result = simulateMopRun({
    persona: 'bto-upgrader',
    months: 60,
    seed: 123,
  });

  expect(result.meaningfulTurnRate).toBeGreaterThanOrEqual(0.8);
  expect(result.maxDeadTurnStreak).toBeLessThanOrEqual(2);
});
```

Define meaningful turn:

```ts
meaningfulTurn =
  hasPlayerChoice ||
  hasProjectProgress ||
  hasGoalProgress ||
  hasTrackLevelProgress ||
  hasEventLog ||
  hasRelationshipChange ||
  hasMarketIntelUnlock;
```

Also test:

```txt
MOP still blocks illegal purchase
MOP months decrement correctly
Next Home readiness updates after cash/career/reno changes
side business cannot make Tycoon trivial
investment losses can happen
renovation can overrun
tenant events affect satisfaction/reputation
family space pressure changes recommended target
```

## Playtest Harness

Add:

```txt
scripts/playtest-mop-personas.mjs
```

Personas:

```txt
Darius — renovation
Nadya — side business
Wei Ming — career
Farah — landlord
Gavin — investing
Aisyah — community
Jing Xuan — market intel
Brandon — flip planning
Cheryl — family
Amir — overseas
```

Output shape:

```json
{
  "persona": "Nadya",
  "monthsPlayed": 60,
  "meaningfulTurnRate": 0.87,
  "maxDeadTurnStreak": 2,
  "readinessStart": 18,
  "readinessEnd": 74,
  "choicesShown": 21,
  "criticalEvents": 3,
  "trackLevelsGained": 5
}
```

Use this as CI smoke for the MOP loop.

## Agent Coordination Boundaries

Do not let all agents edit core files simultaneously.

### Core owner only

```txt
src/game/types.ts
src/data/saveSchema.ts
src/game/useGameStore.ts
src/engine/turn.ts
src/engine/constants.ts
src/App.tsx
```

### UX owner

```txt
src/pages/NextHomePlan.tsx
src/components/nextHome/*
src/pages/Dashboard.tsx
src/components/GameLayout.tsx
```

### Feature agents

```txt
src/data/<feature>.ts
src/engine/progression/<feature>.ts
src/components/nextHome/<FeaturePanel>.tsx
src/engine/progression/__tests__/<feature>.test.ts
```

### Test owner

```txt
src/engine/progression/__tests__/*
scripts/playtest-mop-personas.mjs
```

## Suggested PR Stack

```txt
PR 1  feat: add Next Home Plan UX shell
PR 2  feat: add next-property goal and readiness selectors
PR 3  feat: add progression state, hydration, and save migration
PR 4  feat: add monthly focus preview and recap loop
PR 5  feat: add home projects track
PR 6  feat: add tenant personality and landlord track
PR 7  feat: add side business progression
PR 8  feat: add career certifications track
PR 9  feat: add market intel track
PR 10 feat: add simulated investment portfolio
PR 11 feat: add family progression and space pressure
PR 12 feat: add community relationships
PR 13 feat: add overseas scouting
PR 14 chore: add MOP persona playtest harness
PR 15 polish: add visual progression, empty states, mobile tuning
```

## MVP Cut

Smallest version that proves the concept:

```txt
1. /next-home page
2. next property goal / readiness
3. monthly focus choices
4. home projects
5. tenant events
6. side business track
7. recap drawer
8. MOP meaningful-turn tests
```

Do not include in MVP:

```txt
stock trading
overseas markets
family school planning
community politics
furniture catalog
visual floorplan editor
Monte Carlo optimizer
crypto
```

These can come later, but they should not delay the spine.

## Success Metrics

Track these in playtests:

```txt
MOP engagement score
meaningful turn rate
max dead-turn streak
voluntary turns advanced
track interactions per MOP year
Next Home page visits per MOP year
feature abandonment rate
average time on /next-home
readiness progression clarity
```

Hard targets:

```txt
meaningfulTurnRate >= 0.8
maxDeadTurnStreak <= 2
player can explain current bottleneck in one sentence
player has at least 3 viable MOP activities by month 6
no player needs to open more than 2 pages to choose a monthly action
```

## Final Product Shape

The final game loop should feel like:

```txt
Dashboard:
  Here is your current situation.

Next Home Plan:
  Here is your five-year plan.

Monthly Focus:
  Choose how this month moves you forward.

Tracks:
  Build different forms of advantage.

Events:
  Life happens. Adapt.

Recap:
  Your choices changed the trajectory.
```

This is the difference between adding features and fixing the MOP wall.
