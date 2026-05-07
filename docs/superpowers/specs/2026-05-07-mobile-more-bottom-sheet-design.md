# Mobile More Bottom Sheet Design

## Purpose

This spec refreshes the mobile `More` navigation in the game shell so it feels modern, clearer, and more helpful to casual players.

The current mobile `More` interaction works, but it still feels like an older floating utility tray. It exposes useful secondary tabs, yet the presentation is cramped and does not explain why a player would open each destination.

The new experience should feel like a guidance-first bottom sheet:

- easier to scan
- easier to tap
- more aligned with modern mobile app patterns
- more educational for players who do not already know the simulator's information architecture

## Problem

Today the mobile `More` menu:

- opens as a compact floating card instead of a deliberate sheet
- looks visually older than the rest of the shell
- makes secondary tabs feel miscellaneous rather than curated
- prioritizes density over explanation
- does not reinforce which tabs are most useful for planning versus setup

That makes the interaction feel dated even though the rest of the game has moved toward clearer, more guided UX.

## Goal

Replace the existing mobile `More` tray with a bottom sheet that teaches and routes at the same time.

Players should understand:

- these are secondary tools, not the main monthly loop
- which group each tool belongs to
- what each tool is for before tapping into it
- whether they are already on one of those destinations

## Non-Goals

- Do not redesign the desktop sidebar.
- Do not rename or re-route existing tabs.
- Do not create a new standalone page for secondary navigation.
- Do not reduce the number of mobile secondary tabs in this pass.
- Do not introduce a new graphics asset requirement for this feature.

## UX Decision

Use a guidance-first bottom sheet instead of a compact popover or a full-screen hub.

Why:

- it preserves fast access
- it feels more current on mobile
- it creates room for explanations without overwhelming the shell
- it still keeps the main Home / Life / Buy / Own / Learn tabs as the primary navigation layer

## Experience

When the user taps `More` on mobile:

1. the background dims
2. a sheet slides up from the bottom
3. the sheet shows a handle, title, and one-line guidance copy
4. the destinations are grouped into simple sections
5. each destination appears as a larger card with icon, title, short explanation, and active-state treatment
6. tapping a destination closes the sheet and navigates
7. tapping outside the sheet closes it

## Information Architecture

Two sections:

### Plan & Learn

- Market
- Bank
- Scenarios

These are tools that help players understand timing, financing, and current decision beats.

### Progress & Setup

- Save
- Leaderboard
- Settings

These are tools that support continuity, replay, and comfort rather than the current monthly decision itself.

## Visual Direction

The sheet should feel native to the game shell, not like a default mobile menu.

Direction:

- deep-space backdrop with blur and strong contrast
- rounded top corners only
- compact glow accents, not loud neon overload
- larger tap cards with clearer spacing than the current tray
- small helper chips where useful, especially for the active route
- headline copy that guides the player toward the main tabs first

## Behavioral Requirements

- Mobile-only behavior remains unchanged on desktop.
- The `More` button should stay highlighted while the sheet is open.
- Any route included in the secondary set should also highlight the `More` button.
- The sheet should close on route change.
- The sheet should close on backdrop tap.
- The sheet should fit small phones and respect safe-area padding.
- The sheet should be scrollable if vertical space becomes constrained.

## Code Structure

Keep the shell cleaner by separating concerns:

- `GameLayout.tsx` should own open/close state and route integration
- a dedicated mobile sheet component should own presentation
- section/item metadata should live in a small pure helper module that can be tested without DOM rendering

## Testing Strategy

Because the current Vitest setup is node-only and does not include a DOM rendering harness for TSX surfaces, this pass should verify behavior in two layers:

1. unit coverage for the extracted mobile secondary-nav structure and grouping helper
2. app verification for lint, build, tests, and a browser/mobile-style playtest pass

## Success Criteria

- The mobile `More` interaction feels like a modern bottom sheet rather than a floating tray.
- Casual players can understand what each secondary tab is for before tapping.
- The sheet is visually cleaner and easier to tap on narrow phones.
- The existing mobile shell remains stable, with no route or safe-area regressions.
