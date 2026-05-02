# Logo Refresh Playtest

Date: 2026-05-02
Branch: `feature/logo-refresh`

## Scope

- Verified the new vector-first logo on the title screen.
- Verified the compact HUD logo after starting a fresh game.
- Verified the narrow-width fallback on mobile-sized dashboard layout.

## Test Flow

1. Opened local preview build at `http://127.0.0.1:4177/`.
2. Waited for the title-screen animation to settle.
3. Captured the title-screen lockup at desktop size (`1440x1200`).
4. Started a new game and captured the dashboard HUD at desktop size (`1440x1200`).
5. Resized to a mobile-width viewport (`420x900`) and captured the dashboard header fallback.

## Findings

- The new title logo reads much better than the old crest-based mark. The skyline icon, cyan micro-label, and large `TYCOON` wordmark feel cleaner and more game-like without losing the Singapore/property identity.
- The updated HUD lockup is readable at desktop size and feels more intentional than the old raster thumbnail.
- The mobile header fallback behaves well by collapsing to the icon mark only, which avoids crowding the top bar.
- Removing the unused `public/title-logo.png` asset leaves a single branding path in the app and reduces ambiguity for future UI work.

## Issues

- No functional bugs found in the refreshed logo flow.

## Follow-Up Ideas

- Add the skyline mark to the sidebar footer or browser favicon so the refreshed brand appears in one more persistent location outside the title screen and top bar.
