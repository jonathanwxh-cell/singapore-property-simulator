# Guided Command Center Playtest

Date: 2026-05-05

## Lens

Modern strategy and management games usually keep the player's current objective, time-advance control, and risk state visible before exposing the full simulation. This pass tested whether a new Singapore-property player can understand the next action without scrolling through every system.

## Browser Flow Tested

- Started a fresh `Modern QA` run from New Game.
- Confirmed New Game no longer shows stale active-run sidebar or `Next Month` controls.
- Landed on `Home Command Center` with `This Month`, one objective, three vital metrics, and a visible `Next Month` CTA.
- Advanced one month from the command-center CTA.
- Advanced again and confirmed active scenario routing goes to `/scenarios` and the shell CTA changes to `Resolve First`.
- Resolved the first-home scenario, then inspected Buy, Own, and Life first screens.

## Findings

- Home now reads like a command screen rather than a wall of systems. The player sees objective, why it matters, action buttons, and Next Month before advanced panels.
- Buy is much less list-heavy after adding the recommended deal, preset chips, hidden advanced filters, and a 12-listing initial cap with `Show All`.
- Own now starts with `Portfolio Health`, so landlord systems are framed as attention/risk rather than raw metrics.
- Life now starts with `Plan This Month` and keeps the month-advance button nearby, which makes the life-sim loop feel connected to the core turn loop.
- Scenario-blocker behavior is readable: unresolved scenarios route to the modal and persistent CTA says `Resolve First`.

## Follow-Up Ideas

- Add an optional first-run tooltip sequence for `This Month`, `Next Month`, and `Buy`.
- Consider moving Dashboard's career/eligibility cards into a compact two-card strip on mobile if screenshots still feel dense.
- Add a `Learn` hub page later so Market, Bank, How to Play, rules, achievements, saves, and settings feel intentionally grouped instead of sharing `/market` as the Learn entry route.
