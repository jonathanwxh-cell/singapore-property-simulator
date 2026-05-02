# Life-Sim Visuals Playtest

**Date:** 2026-05-02

**Branch:** `feature/life-sim-visuals`

## Coverage

Structured browser-game QA using a local preview build on `http://127.0.0.1:4176/`.

Because the in-app local browser bridge was not exposed in this session, the pass used Playwright with local Edge in headless mode plus screenshot review.

Covered flows:

- title screen to `New Game`
- `Tech Professional` on `Normal`
- dashboard life-summary visual card
- `Life` page hero scene and action-card imagery
- primary action selection visual update
- month resolution with outcome art
- desktop smoke pass on `Properties`, `Market`, and `Bank`
- mobile-width pass on dashboard and `Life`
- comparison runs for:
  - `Fresh Graduate` on `Hard`
  - `Property Agent` on `Normal`

## Outcome

The image pass materially improves the feel of the life-sim loop.

What landed well:

- the dashboard now makes life planning feel like part of the fantasy instead of a side stat block
- the `Life` page reads as a real planning surface, not a form
- action cards are easier to scan because the art and visual labels separate them at a glance
- the month-result banner gives the life loop a stronger emotional payoff

Representative outcomes:

1. `Tech Professional` / `Normal`
   - `Take Side Gig + Recover`
   - `Strong Month`
   - cash delta: `+S$728`
   - closest-property timeline improved from about `9` months to about `8` months

2. `Fresh Graduate` / `Hard`
   - `Upskill + Recover`
   - `Heavy Month`
   - cash delta: `-S$450`
   - closest-property timeline remained very long at about `45` months

3. `Property Agent` / `Normal`
   - `Property Hustle + Recover`
   - `Strong Month`
   - cash delta: `+S$525`
   - closest-property timeline sat around `23` months

## Bugs Found

### Blocking Bugs

None found in this pass.

### Non-Blocking UX Issues

1. Mobile bottom-nav discoverability is still weak for the last tab.

What happened:

- on a `390px` wide viewport, the bottom navigation remains usable and horizontally scrollable
- the final tab is still off-screen by default, so a player may not realize more destinations exist

Why it matters:

- the earlier mobile-nav fix made the route reachable, but the affordance is still subtle

Likely owner:

- `src/components/GameLayout.tsx`

## Visual QA Notes

- all new life-scene assets rendered correctly in tested flows
- hero art swapped correctly when changing the selected primary action
- month-outcome art changed correctly between `Strong Month` and `Heavy Month`
- no fallback-image state was observed during the pass
- the mobile hero stack remained readable and did not obscure controls

## Gameplay Gaps Made More Obvious

The new visuals improved clarity enough that remaining design gaps stand out more clearly.

1. Action planning is still retrospective, not predictive.

What the player feels:

- the UI now makes actions look important
- the player still cannot see a forward preview like “this choice cuts 9 months to 7”

Why it matters:

- the visuals increase excitement, but the math feedback still lags one turn behind

2. Hard-mode first-home pacing is still extremely slow.

What the player feels:

- the `Fresh Graduate` / `Hard` run looks good
- the actual property path still feels too distant to be exciting in the opening turns

Why it matters:

- better presentation cannot fully solve a loop that still takes dozens of months to reach its first major milestone

3. Career identity is clearer, but not yet dramatic enough in the first few turns.

What the player feels:

- `Property Hustle` looks different and resolves differently
- the run still needs more action-linked opportunities to make careers memorable beyond cashflow flavor

## Recommendations

### Next Stage

1. Add predictive action previews directly on the `Life` page.
2. Introduce image-backed opportunity cards tied to repeated action patterns and careers.
3. Add a small mobile affordance for the horizontally scrolling bottom nav.
4. Shorten the first satisfying milestone on hard starts with a smaller pre-property win state, not just a long path to first purchase.

### Keep

- reusable SVG scene system
- action-card thumbnails
- outcome-art summary card
- dashboard life visual summary

## Verification

Implementation verification passed before and after the playtest flow:

- `npm.cmd test`
- `npm.cmd run lint`
- `npm.cmd run build`
