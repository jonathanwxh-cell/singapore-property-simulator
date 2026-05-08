# MOP 2.2 Ownership Forks Plan

## Goal

Make the first 60 MOP months less dry by adding chapter-specific fork cards, a concrete next-home shortlist, and fork-aware monthly outcomes.

## Tasks

### 1. Data And Store

- Add shortlist state to the player model.
- Add selected ownership-fork state to life state and month summary.
- Add store actions to toggle shortlist pins and play a fork.

### 2. Engines

- Create ownership-fork derivation based on chapter, household shape, target shortlist, and property state.
- Create shortlist helpers with route and readiness labels.
- Apply fork effects during month resolution / turn advancement.

### 3. UI

- Add an ownership-forks dashboard panel for active-MOP runs.
- Show target shortlist inside that panel.
- Add pin/unpin controls to Buy and Property views.

### 4. Verification

- Add focused tests first and run them red.
- Run `npm.cmd test`
- Run `npm.cmd run lint`
- Run `npm.cmd run build`
- Run `npm.cmd run test:smoke`
- Run one browser playthrough through first purchase, shortlist pinning, and an ownership fork month.

