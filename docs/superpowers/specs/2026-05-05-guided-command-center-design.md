# Guided Command Center Design

## Purpose

Recent user feedback says the simulator now has too many visible lists, panels, and systems at once. The depth is valuable, but the first read is overwhelming: Dashboard, Properties, Portfolio, Life, Market, Bank, scenarios, landlord operations, achievements, CPF/rules, cashflow, tenant systems, renovations, and route goals all compete for equal attention.

This spec keeps the existing simulation depth and redesigns the player-facing flow around a **Guided Command Center**. The player should always understand three things quickly:

- What should I do this month?
- Why does it matter?
- How do I proceed to next month?

The main UX change is progressive disclosure: surface the next decision first, keep critical numbers visible, and move detailed systems into contextual panels or drill-down pages.

## Design Principles

- One primary task per screen. Each major page should lead with the next useful action, not a complete list of every available system.
- Keep every system, but reduce equal-weight exposure. Market details, CPF rules, eligibility, landlord ops, renovations, maintenance, achievements, and route scoring stay available behind grouped panels.
- Make time progression obvious. `Next Month` is the heartbeat of the game and must be easy to reach from main game pages.
- Turn blockers into guidance. If the player cannot advance because of an active scenario or required decision, the same CTA should change to `Resolve First` and route to the blocker.
- Use player verbs for navigation. New players understand `Home`, `Life`, `Buy`, `Own`, and `Learn` faster than a long specialist-menu list.
- Preserve expert speed. Experienced players should be able to expand advanced panels and reach detailed pages in one click.

## Recommended Approach

Use the **Guided Command Center** approach.

Alternative 1, a separate beginner mode, would make first-time play simpler but risks splitting the game into two maintained experiences. Alternative 2, a full journey-map-first redesign, has strong long-term appeal but is a larger rewrite. The command-center approach is the best first phase because it layers better hierarchy over the current systems without deleting depth or changing simulation rules.

## Player Experience

Dashboard becomes the `Home` screen and opens with a `This Month` panel:

- One plain-English objective from Decision Coach / Run Director.
- Why it matters in one sentence.
- Two or three direct actions.
- A prominent `Next Month` button.
- Three vital numbers only: spendable cash, monthly surplus, and buying/portfolio readiness.

The rest of the dashboard becomes collapsed or lower-priority:

- Market Pulse becomes a compact expandable panel.
- Cashflow detail becomes an expandable panel.
- CPF/rules glossary becomes contextual help.
- First-home missions and Life Arc merge into the primary guidance stack rather than separate full rails.
- Property Operations appears only when owned properties need attention, with a compact alert state first.
- Achievements move out of the main read path.

## Persistent Next Month CTA

Add a reusable `NextMonthCTA` component used by the game layout and key pages.

Desktop:

- Sidebar shows a persistent `Next Month` button near the bottom, above version/brand text.
- Dashboard `This Month` panel also includes `Next Month` as the main action.
- If a scenario is active, button label becomes `Resolve First` and routes to `/scenarios`.
- If a blocking alert exists, such as required scenario response, button routes to the relevant page instead of silently disabling.

Mobile:

- Use a floating bottom-right `Next Month` button above the bottom nav.
- It should be thumb-reachable and avoid covering important card actions.
- If blocked, it becomes `Resolve First` with a warning tone.

Behavior:

- If no blockers exist, clicking advances one turn.
- If `currentScenario` exists, clicking navigates to `/scenarios`.
- If future blocking systems are added, the CTA should support a ranked blocker model.
- Non-blocking warnings, such as low cash reserve or open maintenance, do not prevent advancing but can appear as a small warning line.

## Navigation Model

Replace the crowded top-level nav vocabulary with player verbs:

- `Home`: Dashboard / command center.
- `Life`: income, stress, living arrangement, career moves, schemes.
- `Buy`: property browser, deal readiness, property detail purchase path.
- `Own`: portfolio, landlord ops, renovations, tenants, maintenance, loans where property-specific.
- `Learn`: market, rules glossary, how-to-play, achievements, leaderboard, save/settings.

This does not remove existing routes. It changes how players discover them.

Suggested mapping:

- `/dashboard` -> Home.
- `/life` -> Life.
- `/properties` and `/property/:id` -> Buy.
- `/portfolio` and property operation flows -> Own.
- `/market`, `/bank`, `/scenarios`, `/leaderboard`, `/how-to-play`, `/settings`, `/saveload` -> Learn or contextual entry points.

Scenarios remain auto-routed when active because unresolved scenario choices are core gameplay.

## Dashboard Architecture

Add or refactor these UI components:

```ts
interface CommandCenterObjective {
  id: string;
  title: string;
  detail: string;
  primaryActionLabel: string;
  primaryRoute?: string;
  secondaryActions: Array<{ label: string; route: string }>;
  urgency: 'critical' | 'warn' | 'good' | 'neutral';
}

interface AdvanceMonthState {
  label: 'Next Month' | 'Resolve First';
  detail: string;
  route?: string;
  disabled?: boolean;
  tone: 'ready' | 'blocked' | 'warn';
}
```

New components:

- `CommandCenterHero`: top dashboard objective with actions and vital numbers.
- `NextMonthCTA`: shared advance/resolve button.
- `ProgressivePanel`: expandable section for advanced detail.
- `GroupedNav`: sidebar/bottom-nav model using `Home`, `Life`, `Buy`, `Own`, `Learn`.
- `VitalMetricStrip`: only the three most important numbers for the current state.

Existing components such as `RunArcPanel`, `RuleGlossaryPanel`, `DecisionMoveCard`, `FirstHomeMissionCard`, and operations cards should be reused where possible but shown inside grouped or collapsed surfaces.

## Page-Level Changes

### Dashboard / Home

Before: many full-width cards and grids compete at the same time.

After:

- First card: `This Month`.
- Second row: three vital metrics.
- Third row: compact action groups for `Earn`, `Buy`, `Own`, `Learn`.
- Advanced panels collapsed by default.
- Property Operations appears expanded only if urgent repairs, weak tenants, expiring leases, or reserve danger exist.

### Properties / Buy

Before: summary stats plus filters plus dense listing cards.

After:

- Lead with a starter recommendation: `Best next buy for you`.
- Add simple filter presets: `Starter-safe`, `High yield`, `Upgrade path`, `Advanced`.
- Keep detailed filters collapsed under `More filters`.
- Listing cards prioritize readiness and one-line reason, with detailed PSF/channel facts secondary.

### Portfolio / Own

Before: metrics, style summary, route ribbon, ops command, holdings, achievements.

After:

- Lead with `Portfolio Health`: one status, one risk, one suggested action.
- Group holdings into `Needs Attention`, `Income Stable`, and `Long-Term Hold`.
- Move achievements to `Learn`.
- Keep landlord ops metrics expandable unless attention is required.

### Life

Before: hero, five stat cards, living arrangement, primary/secondary action grids, multiple side panels.

After:

- Lead with `Plan This Month`: selected primary action, expected impact, and `Next Month`.
- Use a compact three-metric strip: energy, stress, monthly surplus.
- Show primary actions as the default.
- Collapse secondary actions until eligible or requested.
- Keep scheme progress and closest property path as expandable helper panels.

## Data Flow

Existing selectors and engines should remain the source of truth.

New selector or engine helper:

```ts
function getCommandCenterState(player: Player, currentScenario?: string | null): {
  objective: CommandCenterObjective;
  advance: AdvanceMonthState;
  vitalMetrics: VitalMetric[];
  panelDefaults: Record<string, 'open' | 'collapsed'>;
}
```

Priority order:

1. Active scenario or required blocker.
2. Insolvency / negative cash danger.
3. Urgent maintenance or tenant issue.
4. Active route milestone.
5. First-home readiness.
6. Life action planning.
7. Safe advance.

This helper can use existing `getNextBestMoves`, `getRunArc`, selectors, property operations summaries, and scenario state.

## Error Handling And Edge Cases

- If the player has no active game, the CTA should not render.
- If `nextTurn` would be blocked by a scenario, CTA routes to `/scenarios` instead.
- If a route target points to a missing property/listing, fall back to `/dashboard`.
- If old saves lack newer fields, command-center selectors must still produce a safe default objective.
- If there are no recommended actions, show `Advance when ready` rather than an empty state.
- If mobile viewport is small, the floating CTA should collapse to an icon plus `Next` label.

## Testing Plan

Unit tests:

- Command-center state returns active scenario as top blocker.
- Command-center state returns `Next Month` when no blocker exists.
- Low cash, urgent maintenance, and route milestone priorities sort correctly.
- Old/default player state produces a valid objective.

Component tests or smoke tests:

- Dashboard renders `This Month` before advanced panels.
- Sidebar or mobile layout renders persistent `Next Month`.
- Clicking `Next Month` advances turn when no scenario is active.
- Clicking blocked CTA navigates to Scenarios when `currentScenario` exists.
- Properties page still exposes full filters through `More filters`.
- Portfolio still exposes landlord ops details through expansion.

Browser playtest:

- First-time citizen/couple: start a run, understand the suggested next move within 10 seconds, advance a month without scrolling.
- Single 35 route: confirm starter guidance and eligibility language stay understandable.
- Landlord route: confirm owner/tenant/maintenance depth exists but does not dominate the first screen unless urgent.
- Mobile viewport: confirm CTA is visible, reachable, and does not cover bottom nav actions.

## Acceptance Criteria

- A new player can identify the next recommended action from Dashboard without scrolling.
- `Next Month` is visible from the main game shell on desktop and mobile.
- Existing systems remain reachable within one or two clicks.
- Advanced panels are collapsed or grouped by default, except urgent blockers.
- The design does not change financial simulation rules.
- Existing automated test, lint, build, and smoke suites still pass after implementation.

## Non-Goals For First Implementation

- Removing systems from the simulator.
- Creating a separate beginner mode.
- Rewriting the full route/life-arc system.
- Rebalancing property prices, CPF, tax, or tenant mechanics.
- Adding new art assets unless a visual affordance is missing during implementation.

## Implementation Slices

1. Add command-center state helper and tests.
2. Add `NextMonthCTA`, `ProgressivePanel`, and grouped nav components.
3. Refactor Dashboard into `This Month`, vital metrics, grouped actions, and collapsed advanced panels.
4. Simplify Properties, Portfolio, and Life first-read hierarchy without removing their detailed controls.
5. Update smoke/profile/scroll tests and browser playtest the new first 10 minutes.

