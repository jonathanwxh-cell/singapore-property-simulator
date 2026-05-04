import { saveSchema } from '@/data/saveSchema';
import { SAVE_VERSION } from '@/engine/constants';
import type { GameState } from './types';

export const SAVE_SLOTS_KEY = 'sgpt_saves';
export const AUTO_SAVE_KEY = 'sgpt_autosave';

const AUTO_HYDRATE_ROUTES = [
  '/dashboard',
  '/life',
  '/properties',
  '/property',
  '/market',
  '/portfolio',
  '/bank',
  '/scenarios',
  '/settings',
  '/gameover',
];

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
  return AUTO_HYDRATE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}
