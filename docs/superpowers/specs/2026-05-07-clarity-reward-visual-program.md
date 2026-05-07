# Beginner Clarity / Reward / Visual Program

## Purpose

This spec defines the next major product program for Singapore Property Simulator after the Active MOP, landlord operations, and life income expansions.

The game now has strong systemic depth, but recent playtests and feedback show a consistent product risk:

- new and casual players can feel overwhelmed by the amount of information
- important decisions are not always obvious at first glance
- monthly progression can feel abstract instead of rewarding
- some screens communicate mechanics better than they communicate goals
- visual polish exists, but it does not yet consistently turn progress into emotion

The goal of this program is not to remove depth. The goal is to **preserve the full simulation while making it easier to understand, more motivating to play, and more visually memorable**.

This should be treated as a coherent UX program, not a grab-bag of polish tickets.

## Product Thesis

The game should make players feel three things:

```txt
I understand what kind of game this is.
I know what to do this month.
I can feel myself progressing.
```

If a player understands the rules but does not feel momentum, the game becomes dry.

If a player sees momentum but does not understand the rules, the game becomes confusing.

If the game adds more features before fixing those two issues, the depth starts to work against the experience.

The right approach is:

```txt
clarity first -> reward feel second -> visual identity third
```

These phases should overlap in spirit, but the implementation order should stay disciplined.

## Why This Program Exists Now

Current strengths:

- strong Singapore-specific systems
- clearer post-purchase property operations than earlier builds
- more meaningful MOP progression than a passive wait loop
- growing identity around life, ownership, and trade-off simulation

Current weaknesses:

- several screens still ask the player to parse too many cards or numbers at once
- beginner understanding depends too much on prior property knowledge
- the game explains outcomes better than it explains decision pathways
- high-value systems like reserve cash, CPF, MOP, ABSD, and landlord health can still feel abstract
- the month-to-month loop needs more emotionally satisfying feedback

This program should solve those weaknesses before major breadth expansions such as overseas property, deep family systems, or a full investment sandbox.

## Goals

1. Make the first 10 minutes of play substantially easier for beginners and casual players.
2. Ensure every major screen has one obvious primary action before showing advanced information.
3. Make monthly progression feel visible, motivating, and game-like.
4. Strengthen the game's visual identity with targeted graphics and better hierarchy.
5. Improve mobile usability and reduce layout friction.
6. Preserve existing simulation depth rather than replacing it with oversimplified rules.

## Non-Goals

- Do not rebuild the simulation around arcade abstractions.
- Do not create a separate "simple mode" that forks the core ruleset.
- Do not add large new backend or live-service requirements as part of this program.
- Do not add decorative images to every screen if they do not improve comprehension or emotional payoff.
- Do not widen the game with multiple new tabs before the current tabs are easier to use.

## Design Principles

### 1. One Primary Action Per Screen

Every major screen should make one action feel most important right now.

Examples:

- Dashboard: what should I do this month?
- Market: can I afford this and why would I buy it?
- Portfolio: which owned property needs attention?
- Life: which income or stability move helps most?
- Next Home Plan: what bottleneck is blocking my target?

Advanced information can still exist, but it should sit below the primary action or behind lightweight disclosure.

### 2. Progressive Disclosure

The game should not hide important rules, but it should stage them.

Show:

- the headline outcome first
- the reason second
- the full breakdown third

Players should never need to read five paragraphs to understand whether a move is good, bad, blocked, or risky.

### 3. Explain Friction At The Point Of Need

If a player cannot buy, rent, upgrade, or invest, the game should say why in plain language at the exact decision point.

Avoid:

- abstract rule walls with no next step
- unexplained acronyms
- hidden prerequisites that only become clear after a failed attempt

### 4. Progress Must Be Felt, Not Just Calculated

Every month should produce at least one of the following:

- clearer readiness
- stronger income
- improved property condition
- a visible milestone
- new information
- a meaningful trade-off

Numbers alone are not enough. The player should feel movement.

### 5. Graphics Should Clarify Or Reward

New graphics should serve one of two jobs:

- improve understanding
- increase emotional payoff

Avoid generic wallpaper art.

### 6. Mobile Is A First-Class Constraint

Cards, sticky CTAs, safe-area handling, scroll restoration, and action density should all be evaluated with iPhone Safari and Android Chrome in mind.

## Program Decision

Three possible directions were considered:

### Option A: Clarity-First

Make the first 10 minutes dramatically easier to understand, then strengthen reward feel, then layer visual identity.

Pros:

- best for retention
- best for beginner feedback
- reduces future support burden
- makes later systems easier to adopt

Cons:

- less immediately flashy than a pure art refresh

### Option B: Delight-First

Focus on art, motion, and polish before simplifying the information architecture.

Pros:

- fastest emotional surface improvement

Cons:

- confusion remains
- can make a complicated game feel prettier but not easier

### Option C: Reward-First

Focus on monthly recap, progression excitement, and milestone feel first.

Pros:

- can increase fun quickly

Cons:

- still leaves first-session comprehension problems unresolved

### Decision

Use **Option A: Clarity-First**.

Reward feel and visual identity should still be improved during each phase, but the rollout should prioritize comprehension and decision confidence before pure polish.

## Program Structure

This work should be shipped in three main phases.

## Phase 1: First 10-Minute Clarity

### Goal

Help a new player understand:

- what kind of game this is
- who it is for
- what the first objective is
- what the current best move is
- why a move is blocked or recommended

### Core Outcomes

- less list fatigue
- less acronym confusion
- stronger first-session confidence
- clearer CTA hierarchy

### Scope

#### A. Start Experience

Improve Title Screen and New Game so the player immediately understands the game frame.

Build:

- a clear "what this game is" statement
- a short "best for" description so casual players know the intended audience
- one recommended starter route
- a guided start CTA that reduces setup anxiety
- short profile summaries that explain trade-offs without jargon overload

#### B. Dashboard As Mission Control

Dashboard should prioritize:

- one primary recommended action
- one visible current bottleneck
- one short explanation of why that move matters

Build:

- a stronger top action rail
- progressive expansion for advanced panels
- cleaner priority ordering between next home, cash flow, property attention, and life systems
- compact mode for dense informational cards when needed

#### C. Inline Education Layer

The game should teach while the player plays.

Build:

- acronym chips with plain-English tooltips for CPF OA, ABSD, MOP, TDSR, MSR, HFE
- short explainer drawers on high-friction decisions
- "why blocked?" summaries at the button level
- beginner-friendly risk summaries on property listings

#### D. Page-Level Clarity Pass

Review and simplify the information hierarchy on:

- Dashboard
- Market
- Property Detail
- Portfolio
- Life
- Next Home Plan

Common rules:

- one primary CTA
- clear section headings
- fewer equal-weight cards above the fold
- more explicit spendable versus reserved resources
- better visibility of tenant/rent status in owned-property views

#### E. Mobile Friction Pass

Phase 1 must also resolve known mobile usability risks.

Build/fix:

- safe-area-aware sticky actions
- predictable tab/route scroll reset to top
- no stat overlap from floating CTAs
- larger, easier-to-hit next-month actions

### Graphics Needed

Targeted additions only:

- route hero cards for beginner start choices
- explainer chips and icon badges
- clearer CTA card states
- compact educational callouts

These graphics should support understanding more than decoration.

### Success Criteria

- a new player can explain their immediate goal within 60 seconds
- a player can identify the recommended monthly move without scanning the whole screen
- acronym confusion drops sharply in playtests
- fewer missed actions caused by buried CTAs

## Phase 2: Progress And Reward Feel

### Goal

Make every month feel satisfying, legible, and motivating.

### Core Outcomes

- stronger month-to-month momentum
- more visible payoff from choices
- better emotional rhythm between effort and reward

### Scope

#### A. Monthly Resolution Recap

Add a clearer recap rhythm after progression.

Show:

- money movement by source
- readiness movement
- property or life highlight
- one risk that increased or decreased

The recap should answer:

```txt
What changed?
Why did it change?
Was that good?
What should I do next?
```

#### B. Milestones And Celebration

Build lightweight celebration states for:

- first property purchase
- first tenant signed
- first renovation completed
- MOP milestone progress
- side-income level-ups
- readiness threshold gains
- landlord reputation improvements

Use small but meaningful visual feedback, not noisy reward spam.

#### C. Persistent Progress Surfaces

Add visible progress meters where helpful for:

- next home readiness
- landlord health
- side-income engine progression
- route milestones
- major property project completion

#### D. Motivation Loop

Ensure that each month has at least one clear positive, caution, or strategic outcome.

Design target:

- quiet months are allowed
- dead months are not

### Graphics Needed

- recap cards
- milestone ribbons or stamps
- progress bars, arcs, or markers with stronger visual states
- upgrade / unlock presentation surfaces

### Motion And Feedback

Use a few high-value animations:

- page-load emphasis on the recommended action
- recap reveal sequencing
- milestone pop or stamp
- progress bar transitions

Avoid over-animating dense financial UI.

### Success Criteria

- players can tell what improved after advancing a month
- more months feel worth advancing
- major achievements feel meaningfully acknowledged

## Phase 3: Visual Identity And Delight

### Goal

Give the game a stronger, more cohesive visual identity without harming clarity.

### Core Outcomes

- more memorable mood
- better page differentiation
- stronger sense that the game is intentionally designed, not just functionally assembled

### Scope

#### A. Visual System Unification

Unify:

- typography hierarchy
- card spacing
- header treatments
- accent usage
- panel contrast
- icon language

Each major section should feel like part of the same game, while still having its own emphasis.

#### B. Singapore-Specific Flavor

Add visual cues that feel locally grounded without relying on real property marketing imagery.

Prefer:

- fictionalized district or estate motifs
- stylized neighborhood scenes
- category illustrations for HDB / resale / EC / condo / commercial
- subtle civic and urban planning flavor

Avoid:

- legal-risk real estate marketing lookalikes
- copying real project branding

#### C. High-Value Illustration Set

Do not attempt unique art for every property.

Instead, add a smaller set of high-value images or illustrations for:

- title / brand anchor
- beginner route selection
- dashboard progression banner
- next home plan hero
- landlord operations / property care
- life income / side hustle systems
- market radar / district watch

#### D. Delight Through Statefulness

Make screens feel more alive by making them reflect player state.

Examples:

- route-aware accents
- milestone-sensitive banners
- property condition states
- readiness states
- positive versus warning presentation tone

### Graphics Strategy

If new images are generated, they should follow one style guide:

- clean, modern, polished
- Singapore-inspired but fictionalized
- readable at small sizes
- useful in card and banner contexts
- supportive of a branded game feel

The art direction should prioritize coherence over quantity.

### Success Criteria

- the game feels more premium and memorable
- images support understanding instead of competing with the UI
- the interface feels more consistent across screens

## Testing Strategy

This program should be validated across multiple player lenses.

### Playtest Personas

1. Casual gamer with little property knowledge
2. Singaporean player with some CPF / housing familiarity
3. Optimizer player who wants numbers and leverage
4. Mobile-first player on a small screen

### Questions To Validate

- Can they tell what the game is trying to teach or simulate?
- Can they identify the best next move quickly?
- Do they understand why a move is blocked?
- Do they feel progress after advancing a month?
- Do visuals help or distract?

### QA Focus

- mobile overlap and sticky action behavior
- scroll restoration between tabs
- CTA hit targets
- recap readability
- tooltip discoverability
- no regressions in property purchase flow
- no regressions in reserve cash or landlord operations visibility

## Suggested Implementation Order

1. Phase 1 core clarity and mobile friction fixes
2. Phase 1 page-level hierarchy pass
3. Phase 2 monthly recap and milestone presentation
4. Phase 2 progress visualization pass
5. Phase 3 visual system unification
6. Phase 3 illustration and identity additions
7. final cross-device playtest and cleanup

Each phase should end with:

- lint
- build
- tests
- smoke playtest
- manual browser playthrough

## Risks

### Risk: Over-Simplifying The Game

Mitigation:

- simplify presentation, not underlying systems
- preserve advanced details behind disclosure

### Risk: Adding More UI Instead Of Less Friction

Mitigation:

- every new surface must justify itself as clarity or reward
- if a card does not help comprehension or motivation, cut it

### Risk: Visual Pass Becomes Asset Sprawl

Mitigation:

- prefer a small, reusable illustration set
- prioritize banners, hero cards, and progress surfaces

### Risk: Mobile Regression

Mitigation:

- test sticky/floating patterns first
- keep mobile-first spacing constraints in every phase

## Final Product Standard

When this program is complete, the game should feel:

- easier to start
- easier to read
- easier to trust
- more satisfying month to month
- more visually distinctive

Most importantly, it should feel like a serious but approachable Singapore property sim, not a spreadsheet buried inside a pretty shell.
