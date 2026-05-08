# MOP 2.4 Target Urgency Design

## Purpose

`MOP 2.3` made the first 60 months more readable by adding chapter beats and better skip stops. The next gap is emotional and motivational: players can see the plan, but the next home still does not feel urgent or personal enough.

This slice adds a lightweight target-rivalry layer plus payoff moments so MOP months feel like they are building toward a real chase, not just a better percentage.

## Product Thesis

The MOP loop should feel like:

```txt
I am chasing a specific next home.
I know what rival option could replace it.
Smart realistic progress creates visible payoff moments.
```

## Goals

1. Make shortlisted homes feel more personal and competitive.
2. Add payoff moments for real milestones such as reserve secured, shortlist locked, or lead target becoming reachable.
3. Improve skip logic so quiet time collapses until rivalry or payoff state changes.
4. Keep the system grounded in existing Singapore-sim rules, not arcade randomness.

## Non-Goals

1. Do not build a full branching story campaign.
2. Do not add persistent new save-state fields if derivation is enough.
3. Do not replace the existing chapter beats or ownership forks.

## Scope

Ship `MOP 2.4` with three connected parts:

1. `Target rivalry`
2. `Chapter payoff moments`
3. `Rivalry-aware notable-month stopping`

## Design

### 1. Target rivalry

Add a pure engine module that derives:

- lead target
- challenger target
- urgency label
- fit reason
- rivalry summary
- stable notable key

The system should prefer the existing shortlist first, then fall back to plausible nearby alternatives from the current next-home plan.

### 2. Chapter payoff moments

Add derived milestone states such as:

- reserve secured
- rental loop stabilized
- shortlist locked
- lead target reachable
- exit route on pace

These should be compared before and after turn resolution so the recap can celebrate real progress and the dashboard can surface the next payoff.

### 3. Rivalry-aware notable months

Extend the existing notable-month snapshot so `Next chapter beat` also stops when:

- lead target changes
- challenger changes
- urgency changes
- payoff milestone changes

## UI Changes

### Next Home panel

Add:

- lead target card
- challenger card
- urgency + fit labels
- next payoff callout

### Ownership beat flow

Use target rivalry to make chapter pressure/upside and market-study months feel more specific.

## Testing

Add focused tests for:

1. rivalry derivation from shortlist
2. fallback challenger derivation when shortlist is thin
3. payoff milestone detection
4. notable-month snapshot reacting to rivalry changes
5. full lint, unit, build, smoke, and scroll verification
