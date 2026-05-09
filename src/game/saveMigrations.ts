import { SAVE_VERSION } from '@/engine/constants';

// Save migration: load older save shapes by transforming them into the current
// (SAVE_VERSION) shape before zod validation. Returns null for unknown / forward
// versions so callers can fail closed.
//
// Today the only historical version is v1 (shipped as v0.4.0 on 2026-04-30).
// Most v2 additions are optional schema fields backfilled by the store's
// hydration helpers (withCareerDefaults, withPortfolioDefaults, withLifeDefaults,
// withBuyerProfileDefaults, withRunRouteDefaults, withLifetimeDefaults in
// useGameStore.ts). The v1 -> v2 step bumps the version and explicitly
// backfills lifetime fields here so the migrated payload validates cleanly
// against the current schema without depending on a downstream helper having
// run first.
//
// When a future v3 ships, add a transform here and bump SAVE_VERSION; the
// signature stays a single function so callers don't change.

interface PlayerWithLifetime {
  lifeMemories?: unknown;
  endingCollection?: unknown;
}

interface RawSaveV1 {
  version: number;
  player?: PlayerWithLifetime;
  [key: string]: unknown;
}

function migrateV1ToV2(raw: object): unknown {
  const next = { ...(raw as RawSaveV1), version: SAVE_VERSION };
  const player = next.player;
  if (player && typeof player === 'object') {
    next.player = {
      ...player,
      lifeMemories: player.lifeMemories ?? [],
      endingCollection: player.endingCollection ?? {
        unlockedEndingIds: [],
        runHistory: [],
      },
    };
  }
  return next;
}

export function migrateSave(raw: unknown): unknown | null {
  if (!raw || typeof raw !== 'object') return null;
  const version = (raw as { version?: unknown }).version;

  if (version === SAVE_VERSION) return raw;
  if (version === 1) return migrateV1ToV2(raw);
  return null;
}
