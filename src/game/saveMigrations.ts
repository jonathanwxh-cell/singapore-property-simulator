import { SAVE_VERSION } from '@/engine/constants';

// Save migration: load older save shapes by transforming them into the current
// (SAVE_VERSION) shape before zod validation. Returns null for unknown / forward
// versions so callers can fail closed.
//
// Today the only historical version is v1 (shipped as v0.4.0 on 2026-04-30).
// Every v2 addition was made as an optional schema field, and the store's
// hydration helpers (withCareerDefaults, withPortfolioDefaults, withLifeDefaults,
// withBuyerProfileDefaults, withRunRouteDefaults in useGameStore.ts) already
// backfill missing fields, so the v1 -> v2 step is a pure version bump.
//
// When a future v3 ships, add a transform here and bump SAVE_VERSION; the
// signature stays a single function so callers don't change.

export function migrateSave(raw: unknown): unknown | null {
  if (!raw || typeof raw !== 'object') return null;
  const version = (raw as { version?: unknown }).version;

  if (version === SAVE_VERSION) return raw;
  if (version === 1) return { ...(raw as object), version: SAVE_VERSION };
  return null;
}
