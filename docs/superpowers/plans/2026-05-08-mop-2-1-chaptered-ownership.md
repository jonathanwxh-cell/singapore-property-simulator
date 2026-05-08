# MOP 2.1 Chaptered Ownership Plan

## Goal

Make the first `MOP` stretch feel staged and rewarding through chapters, visible progress tracks, rotating monthly intents, and smarter notable-month stopping.

## Tasks

### 1. Ownership Campaign Engine

- Add a derived `ownershipCampaign` engine module for active-MOP runs.
- Define chapter ids, track ids, track labels, chapter ordering, and progress formulas.
- Keep the model lightweight and derivable from player state plus small persisted XP counters.

### 2. Persisted Track Progress

- Extend the life state and save schema with ownership-campaign XP counters.
- Update life-month resolution to add XP and notes based on selected monthly intent track.
- Keep older saves compatible by defaulting missing fields safely.

### 3. Chapter-Aware MOP Intents

- Update monthly intents so active-MOP options rotate by chapter instead of staying fixed.
- Preserve room-rental autopilot and safe home-project autopilot.
- Keep the result capped to a small readable set.

### 4. Dashboard Integration

- Surface chapter, chapter objective, and ordered track bars in the next-home gateway.
- Keep the current quest and recap layout intact while making the campaign state visible.

### 5. Notable-Month Stopping

- Add campaign chapter and track milestone tiers into the notable-month snapshot.
- Stop the skip when chapter or milestone tiers change.

### 6. Verification

- Add focused tests first, run them red, then implement green.
- Run `npm.cmd test`
- Run `npm.cmd run lint`
- Run `npm.cmd run build`
- Run `npm.cmd run test:smoke`
- Run `npm.cmd run test:scroll`
- Do one browser playthrough through first purchase and early MOP.

