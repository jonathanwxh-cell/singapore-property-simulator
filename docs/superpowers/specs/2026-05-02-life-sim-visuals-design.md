# Life-Sim Visuals Design

**Date:** 2026-05-02

## Goal

Make the new life-sim loop feel more alive by adding grounded, Singapore-specific imagery to the `Life` page, dashboard life summary, and month-resolution surface without bloating the asset footprint or complicating the game state model.

## Problem

The phase-1 life systems improved the opening loop mechanically, but they still read as text-first panels surrounded by property art. The result is a mismatch:

- the player now makes meaningful pre-property life choices
- the UI still looks like those choices are secondary
- the most repeated life actions have no visual personality of their own

This pass should make the life loop feel like a first-class part of the game.

## Scope

This design covers:

- reusable art for the seven life actions
- reusable art for month-result states
- action-card thumbnails on the `Life` page
- a selected-action hero scene on the `Life` page
- a more visual `Life Planning` card on the dashboard
- a richer `Last Month` summary that shows both actions and the month tone
- a follow-up playtest and findings document after implementation

This design does not cover:

- new property imagery
- a full event-illustration system for all scenarios
- new engine mechanics beyond what is needed to classify month outcomes for visuals

## Visual Direction

Use a compact, code-native illustration pack with a unified editorial look rather than a pile of large raster assets.

Style rules:

- wide-scene SVG illustrations for lightweight shipping
- layered gradients, skyline silhouettes, transit and HDB motifs, laptop and paperwork props
- grounded Singapore references instead of generic stock-business visuals
- bright but controlled palette that matches the current neon-glass UI
- readable at both thumbnail and hero sizes

The scenes should feel like:

- `Focus at Work`: office tower glow, laptop, commuter skyline
- `Take Side Gig`: after-hours freelance or tuition scene
- `Property Hustle`: viewing folder, keys, district skyline, agent route energy
- `Upskill`: study desk, course notes, certification mood
- `Support Household`: HDB corridor or dining-table family support moment
- `Claim / Plan Schemes`: forms, civic counters, digital paperwork, support planning
- `Recover`: rain, greenery, quiet home interior, reset energy
- `Outcome Positive`: confident upward month
- `Outcome Balanced`: steady but mixed month
- `Outcome Stressed`: overload and tradeoff month

## Asset Strategy

Store the visuals in `public/life-scenes/` as SVGs.

Initial asset pack:

- `focus-at-work.svg`
- `take-side-gig.svg`
- `property-hustle.svg`
- `upskill.svg`
- `support-household.svg`
- `plan-schemes.svg`
- `recover.svg`
- `month-positive.svg`
- `month-balanced.svg`
- `month-stressed.svg`

Why SVG:

- small bundle cost
- deterministic versioned assets in git
- easy to tweak without rerunning image generation
- consistent rendering across thumbnail, card, and hero use cases

## Data Model

Keep visuals out of game save state.

Extend `src/data/lifeActions.ts` so each action carries presentational metadata:

- `image`
- `imageAlt`
- `visualLabel`
- optional `heroHint`

Create a new `src/data/lifeVisuals.ts` module for month-result visuals and shared lookup helpers. That file should expose:

- a visual record for each month-result tone
- a pure helper that maps `LifeMonthSummary` to `positive`, `balanced`, or `stressed`
- fallback-safe metadata for cards and summary surfaces

This keeps the logic deterministic and testable without touching stored player data.

## UI Changes

### Life Page

Add a hero card above the planning grids that reflects the currently selected primary action.

The hero should include:

- a large scene image
- the selected action label
- a short supporting line based on existing action copy
- quick stat chips for current energy, stress, and monthly surplus

Each primary and secondary action card should gain:

- a top thumbnail image
- stronger accent treatment driven by the action color
- a small visual label or category chip

This keeps the action grid legible while making repeated monthly choices feel distinct.

### Dashboard

Upgrade the `Life Planning` card into a visual summary card that shows:

- the current primary action image
- current primary and secondary labels
- life-state quick rows
- a direct CTA to the `Life` page

The dashboard should feel like the player is managing a life track, not just a stat block.

### Last Month Summary

Add a result banner using the month-outcome visual.

The summary should explicitly show:

- primary action
- secondary action if any
- month tone visual
- key deltas for cash, energy, and stress
- existing notes underneath

The visual tone should be based on the life summary:

- `positive`: positive cash result and manageable stress delta
- `balanced`: mixed month without overload
- `stressed`: stress-heavy or strongly negative month

## Shared UI Building Blocks

Add one small reusable image component for game scenes so fallback behavior stays centralized.

Responsibilities:

- render scene images for life visuals and existing future art slots
- preserve rounded corners and cover behavior
- fall back to a known-safe life visual when an image path fails

This avoids duplicating error handling between hero, card, and summary surfaces.

## Responsive Behavior

Design for mobile first:

- life hero stacks text below image on narrow screens
- card thumbnails stay shallow and wide instead of tall
- last-month banner stays readable without pushing key deltas below the fold
- dashboard summary remains compact inside the existing column layout

## Testing and Verification

Add pure tests around the new visual helpers:

- action-to-image lookup
- month-summary tone classification
- fallback-safe outcome selection

After implementation:

- run `npm.cmd test`
- run `npm.cmd run lint`
- run `npm.cmd run build`
- play through multiple runs in-browser

## Playtest Requirement

After the visuals ship, run at least:

- one `Tech Professional` / `Normal` run
- one lower-cash or higher-volatility run such as `Fresh Graduate` or `Hard`
- a quick mobile-width pass on navigation and `Life` page readability

Document:

- bugs found and fixed
- any remaining UX confusion
- suggestions that would make the game more fun in the next stage

## Success Criteria

This pass is successful when:

- the `Life` page reads as a visual planning surface instead of a text dashboard
- every life action has distinct imagery
- the dashboard reinforces the current life strategy at a glance
- the month-resolution panel tells a more memorable story
- the new visuals do not break mobile layout or the existing verification stack
