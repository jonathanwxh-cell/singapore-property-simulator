# Live Playtest - 2026-05-03

Date: 2026-05-03
Environment: local Vite dev server at `http://127.0.0.1:4173`

## Coverage

- Booted the game from the title screen and completed the new-game flow.
- Ran a `Tech Professional / Normal` session through dashboard, life planning, properties, market, bank, portfolio, monthly advancement, and scenario resolution.
- Ran a clean `Property Agent / Easy` session to validate the intended buy -> rent out -> advance-month ownership path without relying on exploits.
- Checked console warnings and errors during the browser session.

## Findings

### High

- The `Bank` page currently allows unlimited unsecured `personal Loan` creation via repeated presses of `Apply for Loan`, even without tying the borrowing to a property purchase.
- Reproduction:
  1. Start any game.
  2. Open `Bank`.
  3. Press `Apply for Loan`.
  4. Press it again.
- Observed result:
  - Outstanding balance increases from `S$100,000` to `S$200,000` and beyond.
  - The player can immediately use the extra cash to bypass the intended early-game progression and buy property far earlier than intended.
- Why it matters:
  - This breaks the core economy, invalidates affordability pacing, and lets the player skip the life-sim/property-ladder loop almost entirely.

### Medium

- The `Bank` page still shows a floating-point formatting leak in live UI: `TDSR (55.00000000000001% cap)`.
- This is easy to reproduce by opening `Bank` on a fresh save.
- Why it matters:
  - It undercuts polish in a financial-sim screen where precision and trust matter.

### Low

- After resolving a scenario, the `Continue` button lands on the `Scenarios` index instead of returning to the dashboard or the previous gameplay context.
- This is not broken, but it feels slightly detached from the monthly loop because the player is left on an encyclopedia-like scenario list rather than back in the game flow.

## Fun and Design Notes

- The new life-planning screen is meaningfully better than the earlier waiting-heavy opening. Choosing `Take Side Gig` and `Claim / Plan Schemes` gave the early game more direction and made the property target feel less abstract.
- The `Closest Property Path` callout is doing good work. It gives the player a concrete goal and a readable shortfall.
- The market and property-detail pages now feel much more alive, especially with district coverage, listing channels, and investment-angle framing.
- The biggest remaining fun risk is still the pre-ownership ramp on realistic starts. Without the bank exploit, `Normal` still feels a bit slow before the player gets their first owned asset.
- Career identity still feels lighter than it could be in play. The system is structurally there, but the moment-to-moment feel between `Tech Professional` and `Property Agent` is not yet dramatic enough.

## Browser Logs

- No browser console warnings or errors were emitted during this playtest pass.
