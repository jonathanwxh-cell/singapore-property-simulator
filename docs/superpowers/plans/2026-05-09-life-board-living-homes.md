# Life Board Living Homes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make PropSim feel more like a Singapore life/property game by adding a visual life-board scene and living-home diorama layer across the main routes.

**Architecture:** Keep all financial and simulation logic unchanged. Add pure visual-state helpers plus reusable React presentation components that can sit above existing panels, so advanced information remains available but no longer defines the first impression of each page.

**Tech Stack:** React, TypeScript, Tailwind utility classes, existing CSS variables, Vitest server-render tests, Playwright smoke scripts.

---

### Task 1: Visual State Helpers

**Files:**
- Create: `src/engine/visuals.ts`
- Test: `src/engine/__tests__/visuals.test.ts`

- [ ] Add helpers that summarize the current player into display-safe visual state: current owned home, MOP chapter, tenant condition, repair/renovation status, and page hero facts.
- [ ] Cover pre-owner and owner-MOP states with tests so visuals never imply a tenant/home exists when the player owns nothing.

### Task 2: Reusable Visual Components

**Files:**
- Create: `src/components/visuals/LivingHomeDiorama.tsx`
- Create: `src/components/visuals/SingaporeLifeBoardScene.tsx`
- Create: `src/components/visuals/PageSceneHero.tsx`
- Test: `src/components/visuals/__tests__/visualComponents.test.ts`

- [ ] Build CSS-illustrated visuals instead of requiring new binary image assets for this phase.
- [ ] Render skyline, board tiles, avatar token, MOP marker, and living home states from props.
- [ ] Render page-specific hero scenes for market, buy, life, learn, portfolio, and new game pages.

### Task 3: Wire Main Pages

**Files:**
- Modify: `src/pages/dashboard/panels/PlaySurfacePanel.tsx`
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/pages/Portfolio.tsx`
- Modify: `src/components/PropertyDetail/PropertyOperations.tsx`
- Modify: `src/pages/Properties.tsx`
- Modify: `src/pages/Market.tsx`
- Modify: `src/pages/Life.tsx`
- Modify: `src/pages/Learn.tsx`
- Modify: `src/pages/NewGame.tsx`

- [ ] Replace dashboard-first visual hierarchy with the life-board scene.
- [ ] Show living-home diorama wherever the player is managing owned property.
- [ ] Add compact scene headers to other major pages so every route has a visual identity before deeper panels.

### Task 4: Verification

**Files:**
- Modify: `scripts/playtest-smoke.mjs` if needed for stable visual text anchors.

- [ ] Run `npm.cmd test`.
- [ ] Run `npm.cmd run lint`.
- [ ] Run `npm.cmd run build`.
- [ ] Run `npm.cmd run test:smoke`.
- [ ] Browser-check dashboard, portfolio, owned property, market, buy, life, learn, and new game.
