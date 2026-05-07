# Mobile More Bottom Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the old mobile `More` floating tray with a guidance-first bottom sheet that groups secondary tabs and feels more modern on phones.

**Architecture:** Extract mobile secondary-nav metadata into a pure helper module, cover its grouping/route behavior with a node-based unit test, then swap the current inline menu markup in `GameLayout.tsx` for a dedicated bottom-sheet component with grouped cards, backdrop, and safe-area-aware layout.

**Tech Stack:** React 19, TypeScript, Framer Motion, Tailwind CSS, Vitest, Vite

---

### Task 1: Extract mobile secondary-nav metadata

**Files:**
- Create: `src/components/mobileMoreNavigation.ts`
- Test: `src/components/__tests__/mobileMoreNavigation.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from 'vitest';
import { getMobileMoreSections, isMobileMorePath } from '../mobileMoreNavigation';

describe('mobile more navigation', () => {
  it('groups secondary tabs into guidance-first sections', () => {
    const sections = getMobileMoreSections();

    expect(sections.map((section) => section.id)).toEqual(['plan-learn', 'progress-setup']);
    expect(sections[0]?.items.map((item) => item.path)).toEqual(['/market', '/bank', '/scenarios']);
    expect(sections[1]?.items.map((item) => item.path)).toEqual(['/saveload', '/leaderboard', '/settings']);
  });

  it('detects whether a route belongs to the More menu', () => {
    expect(isMobileMorePath('/market')).toBe(true);
    expect(isMobileMorePath('/dashboard')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm.cmd test -- src/components/__tests__/mobileMoreNavigation.test.ts`

Expected: FAIL because `mobileMoreNavigation` does not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export function getMobileMoreSections() {
  return [
    { id: 'plan-learn', items: [{ path: '/market' }, { path: '/bank' }, { path: '/scenarios' }] },
    { id: 'progress-setup', items: [{ path: '/saveload' }, { path: '/leaderboard' }, { path: '/settings' }] },
  ];
}

export function isMobileMorePath(pathname: string) {
  return getMobileMoreSections().some((section) => section.items.some((item) => item.path === pathname));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm.cmd test -- src/components/__tests__/mobileMoreNavigation.test.ts`

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/components/mobileMoreNavigation.ts src/components/__tests__/mobileMoreNavigation.test.ts
git commit -m "test: add mobile more navigation structure coverage"
```

### Task 2: Build the bottom sheet and wire it into the shell

**Files:**
- Create: `src/components/MobileMoreSheet.tsx`
- Modify: `src/components/GameLayout.tsx`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Write the failing UI expectation indirectly through existing test coverage**

Use the extracted navigation helper as the contract for grouping and active-route detection before touching UI markup.

- [ ] **Step 2: Build the sheet component**

```tsx
export default function MobileMoreSheet({ open, pathname, onClose, onNavigate }) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/55" onClick={onClose} />
      <motion.section className="fixed inset-x-0 bottom-0 rounded-t-[2rem]">
        {/* handle, heading, helper copy, grouped cards */}
      </motion.section>
    </>
  );
}
```

- [ ] **Step 3: Replace the old inline floating tray in `GameLayout.tsx`**

```tsx
<MobileMoreSheet
  open={showMoreMenu}
  pathname={location.pathname}
  onClose={() => setShowMoreMenu(false)}
  onNavigate={(path) => {
    setShowMoreMenu(false);
    navigate(path);
  }}
/>
```

- [ ] **Step 4: Ensure shell behavior stays correct**

Add the lightweight route-close effect and use the helper for `More` active-state detection rather than duplicating path checks inline.

- [ ] **Step 5: Update changelog**

Add an `Unreleased` entry describing the mobile `More` bottom-sheet refresh.

- [ ] **Step 6: Run verification**

Run:

```bash
npm.cmd test -- src/components/__tests__/mobileMoreNavigation.test.ts
npm.cmd run lint
npm.cmd run build
npm.cmd test
```

Expected:

- targeted test PASS
- lint PASS
- build PASS
- full test suite PASS

- [ ] **Step 7: Browser verification**

Run the local app and confirm the mobile `More` interaction:

- opens as a proper bottom sheet
- groups routes into two sections
- highlights the active secondary route
- closes on backdrop tap
- navigates correctly after tapping a destination

- [ ] **Step 8: Commit**

```bash
git add src/components/MobileMoreSheet.tsx src/components/GameLayout.tsx src/components/mobileMoreNavigation.ts src/components/__tests__/mobileMoreNavigation.test.ts CHANGELOG.md docs/superpowers/specs/2026-05-07-mobile-more-bottom-sheet-design.md docs/superpowers/plans/2026-05-07-mobile-more-bottom-sheet.md
git commit -m "feat: refresh mobile more navigation"
```
