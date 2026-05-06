# First 10 Minutes + Fun Loop 2.0

## Goal

Reduce beginner overwhelm without deleting depth. The game should make the first session feel like a guided tycoon loop: choose one plan, see what happened, understand why a buy is blocked, and only open advanced sim detail when ready.

## Research Inputs

- Apple HIG onboarding guidance: onboarding should be fast, fun, optional, and teach through interaction rather than memorization.
- Roblox Creator Hub FTUE guidance: onboarding should teach the core loop in the first few minutes and end with a visible win.
- W3C WCAG 2.2 target-size guidance: mobile controls should be easy to activate, with 24 CSS pixels as a minimum and larger targets for primary controls.
- Parallel playtest review: the strongest low-risk fixes are a post-month recap, less surprising Monthly Intent behavior, and clearer next-step guidance on blocked purchases.

## MVP Implementation

- Split Monthly Intent into two explicit actions: "Use plan + advance" and "Open first". This keeps one-tap play while avoiding accidental month advances.
- Add a Dashboard "Last Month Recap" derived from existing life, market, scenario, and career state. No save migration is needed.
- Gate detailed Dashboard panels during the first six propertyless turns behind one "Open advanced sim panels" card.
- Add a purchase "Next best fix" line based on the primary blocker so failed buys feel educational instead of punitive.
- Add a Learn-page "Mechanics Reference" for formulas and simplified-realism notes.

## Non-Goals

- No new persistent onboarding state in this pass.
- No changes to purchase math, CPF math, or loan validation.
- No full BTO construction timeline or senior-retiree route yet.

## Acceptance Criteria

- A new player sees one primary objective, vital stats, monthly intent, and action tiles before advanced panels.
- A player can open a Monthly Intent's relevant page without advancing time.
- After advancing a month, Dashboard explains cash/life/market changes in a compact recap.
- Blocked purchases include a specific next fix.
- Existing tests, lint, build, and smoke/profile scripts pass.
