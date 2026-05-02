# Life-Sim Visuals Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a lightweight illustration system for the life-sim loop and wire it into the `Life` page, dashboard, and month-resolution summary.

**Architecture:** Keep all new visuals presentational. Ship a small SVG scene pack in `public/life-scenes/`, attach image metadata to `lifeActions`, classify month results through a pure helper module, and render everything through one reusable scene-image component. This keeps saves unchanged and makes the visual logic easy to test.

**Tech Stack:** React 19, TypeScript, Zustand, Vite, Vitest, Tailwind CSS, static SVG assets

---

## File Structure

- Modify: `src/data/lifeActions.ts`
  add image metadata for each action
- Create: `src/data/lifeVisuals.ts`
  define month-result visuals and pure lookup helpers
- Create: `src/components/SceneImage.tsx`
  centralize image rendering and fallback behavior for life scenes
- Modify: `src/pages/Life.tsx`
  add hero scene, image-backed action cards, and richer month summary
- Modify: `src/pages/Dashboard.tsx`
  upgrade the life summary card with the selected action image
- Create: `src/data/__tests__/lifeVisuals.test.ts`
  cover action/outcome visual helpers
- Create: `public/life-scenes/*.svg`
  add the life illustration pack
- Create: `docs/superpowers/playtests/2026-05-02-life-sim-visuals-playtest.md`
  capture playtest findings and next-stage suggestions

### Task 1: Add Visual Metadata and Testable Life Visual Helpers

**Files:**
- Modify: `src/data/lifeActions.ts`
- Create: `src/data/lifeVisuals.ts`
- Create: `src/data/__tests__/lifeVisuals.test.ts`

- [ ] **Step 1: Write the failing visual-helper tests**

```ts
import { describe, expect, it } from 'vitest';
import { lifeActionsById } from '@/data/lifeActions';
import { getLifeOutcomeTone, lifeOutcomeVisuals } from '@/data/lifeVisuals';

describe('life visual metadata', () => {
  it('provides an image for every life action', () => {
    expect(lifeActionsById['focus-at-work'].image).toBe('/life-scenes/focus-at-work.svg');
    expect(lifeActionsById['recover'].image).toBe('/life-scenes/recover.svg');
  });

  it('classifies a clearly positive month as positive', () => {
    expect(getLifeOutcomeTone({
      primaryActionId: 'take-side-gig',
      secondaryActionId: null,
      cashDelta: 700,
      energyDelta: -4,
      stressDelta: 1,
      reputationDelta: 1,
      careerMomentumDelta: 0,
      householdSupportDelta: 0,
      notes: [],
    })).toBe('positive');
  });

  it('classifies a stress-heavy month as stressed', () => {
    expect(getLifeOutcomeTone({
      primaryActionId: 'focus-at-work',
      secondaryActionId: 'take-side-gig',
      cashDelta: 150,
      energyDelta: -12,
      stressDelta: 9,
      reputationDelta: 2,
      careerMomentumDelta: 3,
      householdSupportDelta: 0,
      notes: [],
    })).toBe('stressed');
  });

  it('keeps a balanced month mapped to the balanced outcome art', () => {
    expect(lifeOutcomeVisuals.balanced.image).toBe('/life-scenes/month-balanced.svg');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- src/data/__tests__/lifeVisuals.test.ts`
Expected: FAIL with missing `image` metadata and missing `lifeVisuals.ts`

- [ ] **Step 3: Write the minimal visual metadata and helper module**

```ts
export interface LifeActionDefinition {
  id: LifeActionId;
  label: string;
  description: string;
  accent: string;
  category: 'career' | 'income' | 'household' | 'recovery';
  image: string;
  imageAlt: string;
  visualLabel: string;
}

export type LifeOutcomeTone = 'positive' | 'balanced' | 'stressed';

export const lifeOutcomeVisuals: Record<LifeOutcomeTone, {
  image: string;
  label: string;
  description: string;
}> = {
  positive: {
    image: '/life-scenes/month-positive.svg',
    label: 'Strong Month',
    description: 'Cash moved up and pressure stayed manageable.',
  },
  balanced: {
    image: '/life-scenes/month-balanced.svg',
    label: 'Steady Month',
    description: 'Tradeoffs landed without pushing life too far off balance.',
  },
  stressed: {
    image: '/life-scenes/month-stressed.svg',
    label: 'Heavy Month',
    description: 'You made progress, but the month came with real strain.',
  },
};

export function getLifeOutcomeTone(summary: LifeMonthSummary): LifeOutcomeTone {
  if (summary.stressDelta >= 6 || summary.energyDelta <= -10 || summary.cashDelta <= -350) {
    return 'stressed';
  }
  if (summary.cashDelta >= 250 && summary.stressDelta <= 4) {
    return 'positive';
  }
  return 'balanced';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test -- src/data/__tests__/lifeVisuals.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/data/lifeActions.ts src/data/lifeVisuals.ts src/data/__tests__/lifeVisuals.test.ts
git commit -m "feat: add life visual metadata and outcome helpers"
```

### Task 2: Create the SVG Scene Pack and Reusable Scene Image Component

**Files:**
- Create: `public/life-scenes/focus-at-work.svg`
- Create: `public/life-scenes/take-side-gig.svg`
- Create: `public/life-scenes/property-hustle.svg`
- Create: `public/life-scenes/upskill.svg`
- Create: `public/life-scenes/support-household.svg`
- Create: `public/life-scenes/plan-schemes.svg`
- Create: `public/life-scenes/recover.svg`
- Create: `public/life-scenes/month-positive.svg`
- Create: `public/life-scenes/month-balanced.svg`
- Create: `public/life-scenes/month-stressed.svg`
- Create: `src/components/SceneImage.tsx`

- [ ] **Step 1: Add the scene-image component with fallback behavior**

```tsx
import { useState } from 'react';
import { ImageOff } from 'lucide-react';

const fallbackScene = '/life-scenes/month-balanced.svg';

export default function SceneImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div className={`${className} bg-void-navy flex items-center justify-center`}>
        <ImageOff size={20} className="text-text-dim" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(event) => {
        const img = event.target as HTMLImageElement;
        if (!img.dataset.fallbackApplied) {
          img.dataset.fallbackApplied = 'true';
          img.src = fallbackScene;
          img.alt = 'Fallback life scene';
          return;
        }
        setError(true);
      }}
    />
  );
}
```

- [ ] **Step 2: Add the SVG scene files**

Use static SVG files with:

- `viewBox="0 0 1200 720"`
- layered gradients
- skyline or HDB silhouettes
- foreground props for the specific action
- no external fonts or linked assets

Example scene skeleton:

```svg
<svg width="1200" height="720" viewBox="0 0 1200 720" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="120" y1="80" x2="980" y2="640" gradientUnits="userSpaceOnUse">
      <stop stop-color="#06162E" />
      <stop offset="1" stop-color="#102B52" />
    </linearGradient>
  </defs>
  <rect width="1200" height="720" fill="url(#bg)" />
  <rect x="72" y="520" width="1056" height="120" rx="32" fill="#07111F" fill-opacity="0.72" />
  <circle cx="930" cy="142" r="72" fill="#00F0FF" fill-opacity="0.24" />
  <path d="M92 566H1112" stroke="#9FD7FF" stroke-opacity="0.22" stroke-width="2" />
</svg>
```

- [ ] **Step 3: Run build to verify the static assets and component compile cleanly**

Run: `npm.cmd run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add public/life-scenes src/components/SceneImage.tsx
git commit -m "feat: add life scene illustration pack"
```

### Task 3: Wire the Visual System into the Life Page and Dashboard

**Files:**
- Modify: `src/pages/Life.tsx`
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/data/lifeActions.ts`
- Modify: `src/data/lifeVisuals.ts`
- Modify: `src/components/SceneImage.tsx`

- [ ] **Step 1: Replace text-only action cards with image-backed cards on the Life page**

```tsx
const selectedPrimaryAction =
  lifeActions.find((action) => action.id === selectedPrimaryActionId) ?? lifeActionsById['focus-at-work'];

<GlassCard accentColor={selectedPrimaryAction.accent} className="overflow-hidden">
  <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-4 items-center">
    <SceneImage
      src={selectedPrimaryAction.image}
      alt={selectedPrimaryAction.imageAlt}
      className="h-52 w-full rounded-2xl object-cover"
    />
    <div>
      <p className="text-[10px] font-mono uppercase tracking-[0.24em]" style={{ color: selectedPrimaryAction.accent }}>
        {selectedPrimaryAction.visualLabel}
      </p>
      <h2 className="section-title text-white mt-2">{selectedPrimaryAction.label}</h2>
      <p className="text-text-secondary text-sm mt-2">{selectedPrimaryAction.description}</p>
    </div>
  </div>
</GlassCard>

<SceneImage
  src={action.image}
  alt={action.imageAlt}
  className="h-28 w-full rounded-lg object-cover mb-3"
/>
```

- [ ] **Step 2: Upgrade the `Last Month` card to show outcome art and both actions**

```tsx
const outcomeTone = player.life.lastMonthSummary
  ? getLifeOutcomeTone(player.life.lastMonthSummary)
  : 'balanced';
const outcomeVisual = lifeOutcomeVisuals[outcomeTone];

<SceneImage
  src={outcomeVisual.image}
  alt={outcomeVisual.label}
  className="h-32 w-full rounded-xl object-cover mb-4"
/>
<SnapshotRow
  label="Secondary action"
  value={
    player.life.lastMonthSummary?.secondaryActionId
      ? lifeActionsById[player.life.lastMonthSummary.secondaryActionId].label
      : 'None'
  }
/>
```

- [ ] **Step 3: Upgrade the dashboard life card with current action art**

```tsx
<GlassCard accentColor={selectedPrimaryAction?.accent ?? '#FFD740'} className="overflow-hidden">
  <SceneImage
    src={selectedPrimaryAction?.image ?? '/life-scenes/focus-at-work.svg'}
    alt={selectedPrimaryAction?.imageAlt ?? 'Life planning scene'}
    className="h-32 w-full rounded-xl object-cover mb-4"
  />
  <h3 className="section-title text-white mb-2">Life Planning</h3>
  <p className="text-text-secondary text-xs mb-2">
    Primary action: <span className="text-white">{selectedPrimaryAction?.label ?? 'Focus at Work'}</span>
  </p>
</GlassCard>
```

- [ ] **Step 4: Run full verification**

Run: `npm.cmd test`
Expected: PASS

Run: `npm.cmd run lint`
Expected: PASS

Run: `npm.cmd run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/pages/Life.tsx src/pages/Dashboard.tsx src/data/lifeActions.ts src/data/lifeVisuals.ts src/components/SceneImage.tsx
git commit -m "feat: wire life visuals into planning surfaces"
```

### Task 4: Playtest the Visual Pass and Document Findings

**Files:**
- Create: `docs/superpowers/playtests/2026-05-02-life-sim-visuals-playtest.md`
- Modify: code files only if bugs are found during playtest

- [ ] **Step 1: Start the local app and play through multiple runs**

Run:

```bash
npm.cmd run dev
```

Play through:

- `Tech Professional` on `Normal`
- `Fresh Graduate` or `Hard`
- mobile-width pass on the `Life` page and dashboard

- [ ] **Step 2: Fix any bugs found during playtest**

If a bug is found:

- reproduce it
- patch the smallest correct fix
- rerun the affected verification command

Example bug-fix loop:

```bash
npm.cmd test -- src/data/__tests__/lifeVisuals.test.ts
npm.cmd run lint
```

- [ ] **Step 3: Write the playtest findings doc**

Document:

- coverage
- bugs found and whether they were fixed
- remaining fun-factor opportunities
- recommendations for the next stage

- [ ] **Step 4: Run final verification**

Run: `npm.cmd test`
Expected: PASS

Run: `npm.cmd run lint`
Expected: PASS

Run: `npm.cmd run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/playtests/2026-05-02-life-sim-visuals-playtest.md
git commit -m "docs: add life-sim visuals playtest findings"
```

## Self-Review

- Spec coverage:
  - SVG asset pack: Task 2
  - action metadata and month-outcome helpers: Task 1
  - `Life` hero, action thumbnails, dashboard summary, and last-month banner: Task 3
  - playtest and follow-up findings: Task 4
- Placeholder scan:
  - no `TODO`, `TBD`, or "similar to above" shortcuts remain
- Type consistency:
  - `image`, `imageAlt`, `visualLabel`, `LifeOutcomeTone`, and `getLifeOutcomeTone` are referenced consistently across tasks

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-02-life-sim-visuals.md`.

Two execution options:

1. Subagent-Driven (recommended) - I dispatch a fresh subagent per task, review between tasks, fast iteration

2. Inline Execution - Execute tasks in this session using executing-plans, batch execution with checkpoints

This branch should use option `2` because the user asked me to proceed autonomously in-session.
