# MOP 2.1 Chaptered Ownership Design

## Purpose

This slice follows `MOP 2.0 v1` and focuses on the next remaining pain point: early ownership is now understandable, but it can still feel like a long middle stretch with too many similar-looking months.

The fix is not more tabs or more deep systems. The fix is to turn `MOP` into a short campaign with visible chapters, visible progress tracks, and chapter-specific monthly recommendations.

## Product Thesis

`MOP` should feel like a guided ownership season:

```txt
Settle the home.
Stabilise the cash engine.
Prepare the upgrade.
Line up the exit.
```

Every chapter should change what the dashboard emphasizes, what the best month looks like, and what counts as a notable beat.

## Goals

1. Make the first `MOP` stretch feel less like a wall and more like a staged campaign.
2. Keep only three meaningful ownership tracks visible at a time.
3. Let repeated MOP months accumulate durable track progress.
4. Make `Next notable month` stop on chapter and track milestones, not only repairs or scenarios.
5. Preserve the current dashboard structure and avoid adding a new major screen.

## Non-Goals

1. Do not build family, school, or community simulation yet.
2. Do not add a deep market-watchlist system yet.
3. Do not replace the current property ops or next-home plan systems.
4. Do not build a giant new event engine in this slice.

## Scope

Ship `MOP 2.1` as one coherent pass with four parts:

1. `Chaptered ownership campaign`
2. `Durable MOP track progress`
3. `Chapter-aware monthly intent rotation`
4. `Notable-month chapter stopping`

## Design

### 1. Chaptered Ownership Campaign

Add a derived ownership campaign model for active-MOP runs with four chapters:

1. `Settle In`
2. `Stabilise Income`
3. `Prepare Upgrade`
4. `Line Up Exit`

The active chapter should be derived from current state, not from a separate scripted quest engine.

Each chapter needs:

- label
- objective summary
- progress percentage
- chapter milestone label
- ordered active tracks

The dashboard should surface the active chapter near the `Next Home Plan` so the player can immediately understand what kind of month they are in.

### 2. Durable MOP Track Progress

Add a lightweight ownership-campaign progress state to the player life model with three persistent tracks:

1. `incomeRunwayXp`
2. `homeReadinessXp`
3. `exitIntelXp`

These are not the same as cash or value. They are simple planning momentum meters that reward repeated chapter-relevant months.

Selected monthly intents should feed the tracks like this:

- `tenant` and `home-project` -> `homeReadinessXp`
- `income` and `career` -> `incomeRunwayXp`
- `market` -> `exitIntelXp`
- `recovery` -> no direct chapter XP

Track percentages shown in UI should combine:

- persistent XP
- current real sim state such as reserve, tenant setup, condition, readiness, and MOP timeline

That keeps the bars honest while still making every good month visibly move something.

### 3. Chapter-Aware Monthly Intents

Active-MOP intent selection should stop showing the same set in the same shape forever.

The card set should rotate by chapter:

- `Settle In`
  - landlord ops or home project
  - income runway
  - recovery if strained
- `Stabilise Income`
  - income runway
  - home project / landlord ops
  - market intel
- `Prepare Upgrade`
  - home project
  - market intel
  - income runway
- `Line Up Exit`
  - market intel
  - home project
  - income runway

This keeps only the most relevant choices in view while preserving the rest of the game in the deeper panels and pages.

### 4. Notable-Month Chapter Stopping

`Next notable month` should also stop when ownership-campaign state changes meaningfully.

Add campaign state to the notable-month snapshot:

- active chapter
- visible track milestone tiers

The skip should stop when:

- chapter changes
- a track crosses a milestone tier
- existing repair / tenant / renovation / scenario signals fire

This makes fast-forwarding feel smart instead of blind.

## UI Changes

### Next Home Gateway

Extend the panel to show:

- current chapter badge
- chapter objective text
- three ordered ownership tracks with progress bars

This should sit alongside the existing readiness and target guidance rather than replacing it.

### Recap

Life-month notes should mention ownership-track gains when the run is in active `MOP`.

Example tone:

- `Home readiness +2: the room-rental setup made the flat more productive.`
- `Exit intel +2: you spent the month sharpening the upgrade shortlist.`

### Quest Panel

Keep the current quest shell, but let it read as part of the wider chapter campaign instead of the whole story.

## Testing

Add or extend tests for:

1. chapter derivation for early and late `MOP`
2. chapter-aware monthly intent rotation
3. ownership-track XP gain from MOP months
4. notable-month stopping on chapter or track milestone changes
5. dashboard-compatible ownership campaign data shape

## Success Criteria

This slice is successful if:

1. active-MOP intent cards clearly change as the run matures
2. the dashboard always shows one chapter objective and three visible progress tracks
3. repeated useful months visibly grow campaign progress
4. `Next notable month` stops on campaign beats instead of skipping through them

