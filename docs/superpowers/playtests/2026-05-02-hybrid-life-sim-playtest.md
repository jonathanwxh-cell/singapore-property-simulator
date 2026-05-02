# Hybrid Life-Sim Playtest

**Date:** 2026-05-02

**Branch:** `feature/hybrid-life-sim`

## Coverage

Single-session browser playthrough against the local preview build on `http://127.0.0.1:4175/`.

Covered flows:

- title screen to new game flow
- `Tech Professional` on `Normal`
- dashboard review of new household and life-state summary
- `Life` page planning flow
- primary plus secondary action selection
- month advance and last-month summary resolution
- property-detail affordability guidance
- mobile navigation visibility for the new `Life` route

## Outcome

The phase-1 life-sim loop is meaningfully better than the prior passive opening.

- the dashboard now explains where money is going before ownership
- the life page gives the player real monthly verbs
- action resolution produces visible state changes and a cash result
- property detail now turns an upfront wall into a timeline

## Bugs Found

### Fixed During Playtest

1. `Life` route was missing from mobile navigation.

Impact:
- the new feature was reachable from dashboard CTA but not from the bottom nav on smaller screens

Fix:
- added `Life` to the mobile nav list in `src/components/GameLayout.tsx`
- widened the mobile nav layout so seven items still fit cleanly

### Open Blocking Bugs

None found in this playthrough after the mobile-nav fix.

## Design Gaps Observed

These are not shipping blockers, but they are the clearest next improvements.

1. The `Last Month` card does not explicitly show the resolved secondary action.

What happened:
- the notes showed both the side gig and recovery effects
- only the primary action label was surfaced directly

Why it matters:
- players can feel the result but do not get a clean before/after explanation of both chosen actions

2. Affordability guidance is retrospective, not predictive.

What happened:
- selecting `Take Side Gig` or `Claim / Plan Schemes` does not update the “months away” estimate before the month resolves

Why it matters:
- the player still has to mentally simulate whether an action will accelerate their purchase path

3. Career identity is stronger in the engine than in the UI.

What happened:
- the run behaved differently because career modifiers exist
- the onboarding and planning surfaces still mostly describe career fantasy in text rather than exposing concrete advantages

Why it matters:
- the player may not understand why to choose `Tech`, `Civil`, or `Agent` beyond salary and growth

4. The new loop has actions, but not yet enough player-driven opportunity beats.

What happened:
- the month-to-month flow is better
- it still feels mostly linear outside the random scenario system

Why it matters:
- the next level of excitement will come from action-triggered opportunities, not just passive monthly resolution

## Recommendation

Treat this phase as a successful foundation release.

The next stage should focus on:

- predictive planning feedback
- stronger career expression
- player-driven opportunity cards
- clearer month-result storytelling
