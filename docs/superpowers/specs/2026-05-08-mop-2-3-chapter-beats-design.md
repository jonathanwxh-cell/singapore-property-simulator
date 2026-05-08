# MOP 2.3 Chapter Beats Design

## Purpose

`MOP 2.1` added chapters. `MOP 2.2` added forks and a shortlist. The next gap is cadence: players can now understand the ownership plan, but the first 60 months can still blur into similar-feeling turns.

This slice adds a lightweight beat system so active-MOP runs surface clearer pressure, clearer upside, and cleaner stopping points for `Next chapter beat`.

## Product Thesis

The first 60 months should feel like:

```txt
I know what is pressuring this chapter.
I know what upside is available this chapter.
I can skip quiet time until the next meaningful beat.
```

## Goals

1. Give each active-MOP chapter a visible `pressure + upside` beat layer.
2. Turn ownership forks from a fixed pair into a more varied three-card chapter surface.
3. Make `Next notable month` smarter by stopping on chapter-beat changes, not only repairs or MOP milestones.
4. Keep the whole system derived from existing state so no new save migration is required.

## Non-Goals

1. Do not build a second full branching scenario engine.
2. Do not add persistent family-story progression trees yet.
3. Do not add new player model fields just to support this slice.

## Scope

Ship `MOP 2.3` with three connected parts:

1. `Ownership beat state`
2. `Signal-driven chapter forks`
3. `Beat-aware notable-month stopping`

## Design

### 1. Ownership beat state

Add a pure derived engine module that reads the current MOP chapter, reserve depth, tenant state, shortlist state, family shape, stress, and remaining MOP timeline.

The module outputs:

- current chapter beat headline
- `pressure` signal
- `upside` signal
- chapter cadence in months
- months until next beat
- a stable `notableKey`

This stays derived so saves remain compatible and the system can evolve without migrations.

### 2. Signal-driven chapter forks

Keep the two existing chapter forks, but add a third fork driven by the current `pressure` signal.

Examples:

- `Reserve Catch-Up`
- `Lease Terms Window`
- `Shortlist Sprint`
- `School Zone Commit`
- `Exit Dry Run`

These forks still resolve through the current life-month and property-effect pipeline, but now the chapter surface feels more varied and more personal to the player profile.

### 3. Beat-aware notable months

Extend the notable-month snapshot logic so `advanceToNextNotableMonth()` stops when the ownership beat key changes.

That means quiet months can still collapse quickly, but the game pauses when:

- a chapter beat rotates
- family/school pressure becomes active
- shortlist pressure activates or clears
- tenant / reserve conditions change the current pressure

## UI Changes

### Next Home panel

Add a compact `Next chapter beat` strip:

- months until next beat
- headline
- one-line summary

The skip CTA label changes from `Next notable month` to `Next chapter beat` when active-MOP is live.

### Ownership forks panel

Add a `What is brewing` section above the shortlist:

- pressure card
- upside card
- next-beat countdown

Then render three fork cards instead of two when the signal-driven fork is available.

## Testing

Add focused tests for:

1. early-MOP reserve pressure
2. prepare-upgrade shortlist pressure
3. late-stage family school pressure
4. fork generation including the new signal-driven third card
5. full regression pass through lint, unit tests, build, smoke, and scroll checks
