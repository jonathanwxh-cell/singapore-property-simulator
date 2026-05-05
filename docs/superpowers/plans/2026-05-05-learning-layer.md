# Learning Layer 1.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a casual-player education layer that explains Singapore property concepts contextually without slowing expert players.

**Architecture:** Extend the existing glossary data as the source of truth, add a small reusable `GlossaryTerm` component for inline explanations, create a dedicated `Learn` route, and update navigation/onboarding surfaces to point players there. Use existing game UI primitives and smoke scripts for verification.

**Tech Stack:** React 19, React Router hash routes, TypeScript, Vitest, Playwright smoke scripts, Tailwind utility classes.

---

### Task 1: Glossary Data And Tests

**Files:**
- Modify: `src/data/ruleGlossary.ts`
- Create: `src/data/__tests__/ruleGlossary.test.ts`

- [ ] Add `whyItMatters` and `example` fields to `RuleGlossaryEntry`.
- [ ] Add a `getRuleGlossaryEntry(id: string)` helper for single-term lookups.
- [ ] Write Vitest coverage proving ABSD has casual-player explanation fields and unknown IDs return `undefined`.
- [ ] Run `npm.cmd test -- src/data/__tests__/ruleGlossary.test.ts`.

### Task 2: Inline Glossary Component

**Files:**
- Create: `src/components/GlossaryTerm.tsx`
- Modify: `src/components/RuleGlossaryPanel.tsx`

- [ ] Build a compact button/popover component for inline terms.
- [ ] Include label, summary, detail, why-it-matters, and example copy.
- [ ] Ensure unknown terms render plain text rather than crashing.
- [ ] Update the glossary panel to show the richer fields.

### Task 3: Learn Hub Route

**Files:**
- Create: `src/pages/Learn.tsx`
- Modify: `src/App.tsx`
- Modify: `src/components/GameLayout.tsx`
- Modify: `src/components/Sidebar.tsx`

- [ ] Add a lazy-loaded `/learn` route.
- [ ] Point desktop and mobile Learn navigation to `/learn`.
- [ ] Build beginner-friendly sections: "Start Here", "Singapore Rules", "Why Your Buy Failed", "Common Mistakes", and full glossary.

### Task 4: Casual Onboarding Copy

**Files:**
- Modify: `src/pages/HowToPlay.tsx`
- Modify: `src/pages/TitleScreen.tsx`
- Modify: `src/pages/NewGame.tsx`

- [ ] Add "Who this game is for" copy.
- [ ] Mention no prior property knowledge is required.
- [ ] Link players toward the Learn hub from the menu/tutorial flow.
- [ ] Replace the most visible acronyms with `GlossaryTerm` where copy density stays readable.

### Task 5: Smoke Test And Verification

**Files:**
- Modify: `scripts/playtest-smoke.mjs`

- [ ] Add smoke assertions for `/learn`, "Who this game is for", "ABSD", and "Additional Buyer's Stamp Duty".
- [ ] Run `npm.cmd test`, `npm.cmd run lint`, `npm.cmd run build`, `npm.cmd run test:smoke`, and a browser playtest through Learn, How to Play, New Game, and an active run.

