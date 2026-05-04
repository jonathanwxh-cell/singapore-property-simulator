import { saveSchema } from '@/data/saveSchema';
import { SAVE_VERSION } from '@/engine/constants';
import type { GameState } from './types';

// Storage keys are intentionally prefixed `sgpt_*` (Singapore Property Tycoon —
// the project's original working name). The visible brand has since shifted to
// "PropSim Singapore", but renaming the keys would orphan every existing
// player's saves. The legacy prefix is preserved for save compatibility.
export const SAVE_SLOTS_KEY = 'sgpt_saves';
export const AUTO_SAVE_KEY = 'sgpt_autosave';

// Routes where the auto-save should NOT be hydrated, even if `isGameActive`
// is false:
//   - '/' is the title screen — hydrating here flashes the dashboard before the user starts.
//   - '/how-to-play' is a tutorial reachable before a game exists.
//   - '/newgame' is the explicit "start fresh" flow — auto-hydration would clobber it.
//   - '/saveload' / '/leaderboard' show save data UI; hydration there is unwanted.
//
// All other routes (game screens) auto-hydrate. New game routes are
// auto-hydrated by default — the safer default than the previous allow-list,
// which silently dropped auto-save on any newly added screen.
const NO_AUTO_HYDRATE_ROUTES = new Set([
  '/',
  '/how-to-play',
  '/newgame',
  '/saveload',
  '/leaderboard',
]);

export function serializeGameState(state: GameState): string {
  return JSON.stringify({ ...state, version: SAVE_VERSION });
}

export function parseStoredGameState(rawData: string | null): GameState | null {
  if (!rawData) return null;

  try {
    const parsed = saveSchema.safeParse(JSON.parse(rawData));
    if (!parsed.success) return null;

    const state = { ...parsed.data };
    delete (state as { version?: number }).version;
    return state as unknown as GameState;
  } catch {
    return null;
  }
}

export function readAutoSave(): GameState | null {
  if (typeof localStorage === 'undefined') return null;
  return parseStoredGameState(localStorage.getItem(AUTO_SAVE_KEY));
}

export function writeAutoSave(state: GameState): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(AUTO_SAVE_KEY, serializeGameState(state));
}

export function hasValidAutoSave(): boolean {
  return readAutoSave() !== null;
}

export function shouldHydrateAutoSaveForPath(pathname: string): boolean {
  if (NO_AUTO_HYDRATE_ROUTES.has(pathname)) return false;
  // Allow nested paths under denied routes too (e.g. /how-to-play/intro).
  for (const denied of NO_AUTO_HYDRATE_ROUTES) {
    if (denied !== '/' && pathname.startsWith(`${denied}/`)) return false;
  }
  return true;
}
