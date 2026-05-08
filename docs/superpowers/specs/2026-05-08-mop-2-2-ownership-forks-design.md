# MOP 2.2 Ownership Forks Design

## Purpose

`MOP 2.1` made the first 60 months clearer and more staged. The next gap is experiential: the player can understand the plan, but not enough specific moments happen inside the plan.

This slice adds lightweight chapter forks and a target shortlist so active-MOP runs feel more personal, more dynamic, and less abstract.

## Product Thesis

The first 60 months should feel like:

```txt
I have a concrete future target.
This month has a specific fork.
That fork has a visible consequence.
```

## Goals

1. Give active-MOP runs chapter-specific fork cards instead of only repeating intent cards.
2. Add a lightweight shortlist of future homes so market months point at real targets.
3. Make fork choices pay off through real monthly consequences, not just flavor.
4. Keep the system small enough to live inside the current dashboard flow.

## Non-Goals

1. Do not build a second full scenario modal system.
2. Do not add a giant watchlist, alerts engine, or district simulator yet.
3. Do not build deep family, school, or childcare simulation in this slice.

## Scope

Ship `MOP 2.2` with three connected parts:

1. `Ownership forks`
2. `Next-home shortlist`
3. `Fork-aware monthly outcomes`

## Design

### 1. Ownership Forks

Active-MOP runs get a small fork panel on the dashboard with two cards tailored to the current ownership chapter.

Forks are not full modal scenarios. They are light monthly prompts with:

- title
- stake
- payoff preview
- linked monthly intent
- route target

Examples:

- `Neighbour Referral`
- `Starter Works Window`
- `Bonus Season`
- `Household Budget Talk`
- `Launch Preview Weekend`
- `Space Planning Talk`
- `Valuation Window`
- `School Radius Pressure`

### 2. Next-Home Shortlist

Add a player-owned shortlist of up to three next-home targets.

The shortlist should:

- be pinnable from Buy and Property pages
- surface inside the MOP dashboard flow
- show quick readiness labels such as `Reachable`, `Stretch`, or `Later`

The first shortlist target should also give market-intel forks a concrete property to point at.

### 3. Fork-Aware Monthly Outcomes

Choosing a fork should do more than select an intent.

Each fork should apply a small real consequence when the month resolves, such as:

- extra cash
- small condition bump
- small value bump
- tenant satisfaction lift
- extra ownership-campaign XP
- fork-specific note in recap

## UX

### Dashboard

Add a new panel below the next-home plan for active-MOP runs:

- top row: target shortlist
- main body: two current chapter forks

Each fork gets:

- tone badge
- title
- one-sentence setup
- payoff line
- `Play this fork`
- `Open target`

### Buy And Property Pages

Allow pinning and unpinning a listing to the shortlist.

The action should be quick and visible, not buried in advanced controls.

## Testing

Add tests for:

1. chapter-aware fork selection
2. shortlist pinning and cap behavior
3. fork-driven monthly resolution notes/effects
4. active-MOP dashboard smoke visibility

## Success Criteria

This slice is successful if:

1. active-MOP runs show concrete monthly forks instead of only repeated intent cards
2. market-intel months point at real shortlisted homes
3. playing a fork leaves a visible trace in recap, cash, property state, or campaign progress
4. the first 60 months feel more like a lived season and less like a timer

