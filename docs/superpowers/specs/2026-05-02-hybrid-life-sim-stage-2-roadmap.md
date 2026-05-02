# Hybrid Life-Sim Stage 2 Roadmap

**Date:** 2026-05-02

## Stage Goal

Turn the phase-1 life-sim foundation into a more expressive, more tactical Singapore progression game by making monthly actions visibly change future purchase timelines, career identity, and opportunity flow.

## Recommended Stage 2 Scope

### 1. Predictive Planning Layer

Add preview math to the `Life` page and `PropertyDetail`.

Ship:

- projected next-month cash delta based on currently selected actions
- projected energy and stress change before confirmation
- “if you do this, this listing moves from 15 months to 12 months away” style affordability messaging

Why first:

- it closes the biggest remaining decision gap from the current playtest

### 2. Career-Specific Opportunity Decks

Use the existing life actions as triggers for short, player-driven upside windows.

Ship:

- `Tech`: freelance sprint, certification recruiter ping, startup equity gamble
- `Civil`: scholarship upgrade, stable promotion interview, household support admin shortcut
- `Agent`: referral burst, urgent viewing assignment, premium tenant placement
- `Banking`: bonus surprise, crunch project, client referral
- `Medical`: locum slot, specialist prep, burnout warning

Why second:

- this is the cleanest way to make careers feel distinct without rewriting the whole scenario system

### 3. Better Month Resolution Storytelling

Expand the life-summary panel into a clearer resolution report.

Ship:

- explicit primary and secondary action recap
- before/after stats for cash, energy, stress, and household support
- short narrative callout for the most important effect that month

Why third:

- the engine already has the data, and better storytelling will make the loop feel more satisfying immediately

### 4. First-Home Support and CPF Housing Clarity

Deepen the realism of the path to first purchase.

Ship:

- clearer CPF OA housing context where relevant
- first-home support detail card, not just a hidden progress number
- breakdown between cash requirement and support-adjusted requirement

Why fourth:

- this strengthens the Singapore-specific simulation feel without adding a huge amount of surface area

### 5. Action-Linked Narrative Events

Bridge the gap between deterministic monthly planning and the existing scenario modal system.

Ship:

- action-linked event seeds
- small upside and tradeoff moments triggered by player choices
- fewer pure random interruptions and more “you created this opportunity” moments

Why fifth:

- this is the most powerful long-term game-feel improvement, but it should build on the preview and opportunity layers first

## Suggested Delivery Order

### Milestone A: Decision Clarity

- predictive action previews
- affordability delta previews
- clearer scheme support presentation

### Milestone B: Career Identity

- career-specific opportunity tables
- onboarding hints that explain each career’s real strengths

### Milestone C: Month Drama

- expanded month summary
- action-triggered event hooks

## Risks To Watch

1. Too much complexity on the `Life` page can slow the game back down.

Guardrail:
- keep one primary and one optional secondary action

2. Opportunity cards can become disguised random noise if they are not meaningfully tied to prior choices.

Guardrail:
- trigger from action history and career profile first, randomness second

3. Grant and CPF realism can become opaque if over-simulated.

Guardrail:
- explain the player-facing consequence instead of mirroring every policy rule in full

## Exit Criteria For Stage 2

Stage 2 is successful when:

- a player can see how a chosen action changes their next purchase timeline before ending the month
- at least four careers feel mechanically distinct in the first six turns
- the month summary explains why the run changed instead of only stating that it changed
- player-driven opportunities become as memorable as random scenarios
