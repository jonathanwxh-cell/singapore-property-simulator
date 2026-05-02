# Logo Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ornate crest-based game logo with a clean skyline-plus-wordmark brand system that works on the title screen and in the HUD.

**Architecture:** Build the logo as a reusable React component with inline SVG for the skyline mark and live text for the wordmark. Use variant props to support a large title-screen lockup and a compact HUD version. This avoids shipping another heavy raster asset and keeps the mark crisp at all sizes.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, existing Orbitron and Rajdhani font stack, Vite

---

## File Structure

- Create: `src/components/GameLogo.tsx`
  reusable vector-first brand component with `title` and `hud` variants
- Modify: `src/pages/TitleScreen.tsx`
  replace the raster logo image with the new title variant and tighten the subtitle copy
- Modify: `src/components/HUDTopBar.tsx`
  replace the top-bar image and `SGPT` fallback text with the compact HUD logo
- Create: `docs/superpowers/playtests/2026-05-02-logo-refresh-playtest.md`
  capture the title-screen and HUD screenshot verification findings

### Task 1: Build the Reusable Brand Component

**Files:**
- Create: `src/components/GameLogo.tsx`

- [ ] **Step 1: Create the skyline mark and variant API**

```tsx
import { cn } from '@/lib/utils';

type GameLogoVariant = 'title' | 'hud';

interface GameLogoProps {
  variant?: GameLogoVariant;
  className?: string;
}

function SkylineMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={className} aria-hidden="true">
      {/* geometric skyline + roofline paths */}
    </svg>
  );
}

export default function GameLogo({ variant = 'title', className }: GameLogoProps) {
  return variant === 'hud'
    ? <HudLogo className={className} />
    : <TitleLogo className={className} />;
}
```

- [ ] **Step 2: Implement the title-screen lockup**

```tsx
function TitleLogo({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col items-center text-center', className)}>
      <SkylineMark className="w-32 md:w-40 lg:w-44 h-auto" />
      <div className="mt-4">
        <p className="font-rajdhani uppercase tracking-[0.7em] text-cyan-glow text-xs md:text-sm">
          Singapore Property
        </p>
        <h1 className="font-orbitron font-black uppercase tracking-[0.16em] text-white text-5xl md:text-7xl">
          Tycoon
        </h1>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Implement the HUD lockup**

```tsx
function HudLogo({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <SkylineMark className="w-8 h-8 shrink-0" />
      <div className="hidden md:block leading-none">
        <p className="font-rajdhani uppercase tracking-[0.24em] text-[8px] text-cyan-glow">
          Singapore Property
        </p>
        <p className="font-orbitron uppercase tracking-[0.12em] text-white text-sm font-bold">
          Tycoon
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run lint to confirm the component compiles cleanly**

Run: `npm.cmd run lint`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/GameLogo.tsx
git commit -m "feat: add reusable game logo component"
```

### Task 2: Replace the Old Logo on the Title Screen and HUD

**Files:**
- Modify: `src/pages/TitleScreen.tsx`
- Modify: `src/components/HUDTopBar.tsx`
- Test: manual browser verification

- [ ] **Step 1: Replace the raster title logo**

```tsx
import GameLogo from '@/components/GameLogo';

<div ref={logoRef} className="flex flex-col items-center mb-8 opacity-0">
  <GameLogo variant="title" className="drop-shadow-[0_0_30px_rgba(0,240,255,0.22)]" />
</div>
```

- [ ] **Step 2: Adjust the title-screen subtitle so it supports the new lockup**

```tsx
<span className="font-rajdhani text-text-dim text-sm md:text-lg tracking-[4px] uppercase">
  Build wealth across the Lion City
</span>
```

- [ ] **Step 3: Replace the HUD image and `SGPT` text with the compact logo**

```tsx
import GameLogo from '@/components/GameLogo';

<button
  onClick={() => navigate('/dashboard')}
  className="flex items-center gap-2 group shrink-0"
>
  <GameLogo variant="hud" className="opacity-90 group-hover:opacity-100 transition-opacity" />
</button>
```

- [ ] **Step 4: Run the full verification stack**

Run: `npm.cmd test`
Expected: PASS

Run: `npm.cmd run lint`
Expected: PASS

Run: `npm.cmd run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/TitleScreen.tsx src/components/HUDTopBar.tsx
git commit -m "feat: refresh title and hud branding"
```

### Task 3: Verify the Visual Result and Document It

**Files:**
- Create: `docs/superpowers/playtests/2026-05-02-logo-refresh-playtest.md`

- [ ] **Step 1: Start a local preview build**

Run: `npm.cmd run preview -- --host 127.0.0.1 --port 4177`
Expected: local preview available for screenshot checks

- [ ] **Step 2: Capture the two critical states**

Check:

- title screen logo lockup at desktop size
- dashboard HUD logo at desktop size
- optional narrow-width HUD sanity pass

- [ ] **Step 3: Write the playtest note**

Document:

- what changed
- whether readability improved
- any remaining issues in large or small contexts

- [ ] **Step 4: Run final verification**

Run: `npm.cmd test`
Expected: PASS

Run: `npm.cmd run lint`
Expected: PASS

Run: `npm.cmd run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/playtests/2026-05-02-logo-refresh-playtest.md
git commit -m "docs: add logo refresh playtest notes"
```

## Self-Review

- Spec coverage:
  - vector-first skyline mark: Task 1
  - title-screen integration: Task 2
  - HUD integration: Task 2
  - screenshot-based validation: Task 3
- Placeholder scan:
  - no `TODO`, `TBD`, or implied steps remain
- Type consistency:
  - `GameLogo`, `variant`, `title`, and `hud` are used consistently across tasks

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-02-logo-refresh.md`.

Two execution options:

1. Subagent-Driven (recommended) - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. Inline Execution - Execute tasks in this session using executing-plans, batch execution with checkpoints

Because the user asked me to proceed autonomously in-session, this branch should use option `2`.
