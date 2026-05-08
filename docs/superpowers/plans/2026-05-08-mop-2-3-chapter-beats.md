# MOP 2.3 Chapter Beats Plan

## Goal

Make the first 60 MOP months feel less like a wall by adding visible chapter pressure/upside beats, a third signal-driven ownership fork, and smarter notable-month stopping.

## Tasks

### 1. Engine beat layer

- Add a pure `ownershipMoments.ts` module that derives chapter beat cadence, pressure signal, upside signal, and a stable notable key from existing player state.
- Keep the system stateless so no save migration is needed.

### 2. Fork integration

- Extend ownership forks so each chapter keeps its two existing cards and can add a third signal-driven fork when the current beat supports it.
- Route those forks through the existing month-resolution system with cash / stress / XP / property-effect outcomes.

### 3. Dashboard surfaces

- Show `Next chapter beat` inside the next-home gateway panel.
- Add a `What is brewing` section inside the ownership-forks panel.
- Widen the fork grid so the third card still reads well on larger screens.

### 4. Notable-month stopping

- Extend the store snapshot logic to include the ownership beat key.
- Stop `advanceToNextNotableMonth()` when a chapter beat changes.

### 5. Verification

- Add focused tests for `ownershipMoments` and updated `ownershipForks`.
- Run `npm.cmd run lint`
- Run `npm.cmd test`
- Run `npm.cmd run build`
- Run `npm.cmd run test:smoke`
- Run `npm.cmd run test:scroll`
