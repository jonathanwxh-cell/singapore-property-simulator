import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SAVE_VERSION } from '@/engine/constants';
import type { GameState } from '../types';
import {
  AUTO_SAVE_KEY,
  DEFAULT_PROFILE_ID,
  createPlayerProfile,
  exportProfileBundle,
  getActiveProfileId,
  getPlayerProfiles,
  importProfileBundle,
  parseStoredGameState,
  readAutoSave,
  readSaveSlots,
  serializeGameState,
  setActiveProfileId,
  shouldHydrateAutoSaveForPath,
  writeSaveSlots,
  writeAutoSave,
} from '../savePersistence';

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    player: {
      name: 'Saved Player',
      age: 27,
      careerId: 'graduate',
      salary: 3500,
      cash: 50000,
      cpfOrdinary: 20000,
      cpfSpecial: 5000,
      cpfMedisave: 7000,
      creditScore: 650,
      properties: [],
      loans: [],
      maritalStatus: 'single',
      children: 0,
      year: 2024,
      month: 1,
      turnCount: 0,
      totalNetWorth: 82000,
      achievements: [],
      difficulty: 'normal',
      totalRentalIncome: 0,
      totalPropertySalesProfit: 0,
      bankruptcyStrikes: 0,
    },
    market: {
      interestRate: 3,
      priceIndex: 100,
      rentalIndex: 100,
      volatility: 0.1,
      lastEvent: null,
    },
    settings: {
      soundEnabled: true,
      musicEnabled: false,
      animationSpeed: 'normal',
      autoSave: true,
      difficulty: 'normal',
    },
    isGameActive: true,
    currentScenario: null,
    rngSeed: 1,
    rngState: 1,
    ...overrides,
  };
}

function installMemoryStorage() {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };

  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: storage,
  });
}

describe('save persistence', () => {
  const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');

  beforeEach(() => {
    installMemoryStorage();
  });

  afterEach(() => {
    if (originalLocalStorage) {
      Object.defineProperty(globalThis, 'localStorage', originalLocalStorage);
    } else {
      Reflect.deleteProperty(globalThis, 'localStorage');
    }
  });

  it('round-trips autosave state and strips the storage-only version field', () => {
    const state = makeState();

    writeAutoSave(state);
    const saved = localStorage.getItem(AUTO_SAVE_KEY);
    const parsed = parseStoredGameState(saved);

    expect(JSON.parse(saved ?? '{}').version).toBe(SAVE_VERSION);
    expect(parsed?.player.name).toBe('Saved Player');
    expect(parsed).not.toHaveProperty('version');
  });

  it('rejects malformed or version-mismatched save payloads', () => {
    expect(parseStoredGameState('not-json')).toBeNull();
    expect(parseStoredGameState(JSON.stringify({ ...makeState(), version: SAVE_VERSION + 1 }))).toBeNull();
  });

  it('serializes save slots with the current save version', () => {
    expect(JSON.parse(serializeGameState(makeState())).version).toBe(SAVE_VERSION);
  });

  it('hydrates autosave only for in-game routes', () => {
    expect(shouldHydrateAutoSaveForPath('/property/hdb-bto-0')).toBe(true);
    expect(shouldHydrateAutoSaveForPath('/dashboard')).toBe(true);
    expect(shouldHydrateAutoSaveForPath('/')).toBe(false);
    expect(shouldHydrateAutoSaveForPath('/newgame')).toBe(false);
    expect(shouldHydrateAutoSaveForPath('/saveload')).toBe(false);
  });

  it('scopes autosaves and manual save slots by active local profile', () => {
    const alice = createPlayerProfile('Alice');
    const bob = createPlayerProfile('Bob');

    expect(alice).not.toBeNull();
    expect(bob).not.toBeNull();
    expect(setActiveProfileId(alice?.id ?? '')).toBe(true);
    writeAutoSave(makeState({ player: { ...makeState().player, name: 'Alice Player' } }));
    writeSaveSlots([
      {
        id: 1,
        name: 'Alice Slot',
        date: '2026-01-01T00:00:00.000Z',
        playerName: 'Alice Player',
        netWorth: 90000,
        turnCount: 3,
        year: 2024,
        month: 4,
        difficulty: 'normal',
        data: serializeGameState(makeState({ player: { ...makeState().player, name: 'Alice Player' } })),
      },
    ]);

    expect(setActiveProfileId(bob?.id ?? '')).toBe(true);
    writeAutoSave(makeState({ player: { ...makeState().player, name: 'Bob Player' } }));
    writeSaveSlots([]);

    expect(readAutoSave(alice?.id)?.player.name).toBe('Alice Player');
    expect(readAutoSave(bob?.id)?.player.name).toBe('Bob Player');
    expect(readSaveSlots(alice?.id)).toHaveLength(1);
    expect(readSaveSlots(bob?.id)).toHaveLength(0);
    expect(getActiveProfileId()).toBe(bob?.id);
  });

  it('keeps legacy guest saves on the default profile for backwards compatibility', () => {
    writeAutoSave(makeState({ player: { ...makeState().player, name: 'Guest Player' } }), DEFAULT_PROFILE_ID);

    expect(localStorage.getItem(AUTO_SAVE_KEY)).not.toBeNull();
    expect(readAutoSave(DEFAULT_PROFILE_ID)?.player.name).toBe('Guest Player');
    expect(getPlayerProfiles()[0].id).toBe(DEFAULT_PROFILE_ID);
  });

  it('exports and imports a whole profile bundle for device transfer', () => {
    const profile = createPlayerProfile('Phone Transfer');
    expect(profile).not.toBeNull();
    expect(setActiveProfileId(profile?.id ?? '')).toBe(true);

    const state = makeState({ player: { ...makeState().player, name: 'Mobile Player' } });
    writeAutoSave(state);
    writeSaveSlots([
      {
        id: 2,
        name: 'Checkpoint',
        date: '2026-01-02T00:00:00.000Z',
        playerName: 'Mobile Player',
        netWorth: 120000,
        turnCount: 6,
        year: 2024,
        month: 7,
        difficulty: 'normal',
        data: serializeGameState(state),
      },
    ]);

    const bundle = exportProfileBundle(profile?.id);
    localStorage.clear();

    const imported = importProfileBundle(bundle);

    expect(imported.ok).toBe(true);
    expect(imported.profile.name).toContain('Phone Transfer');
    expect(readAutoSave(imported.profile.id)?.player.name).toBe('Mobile Player');
    expect(readSaveSlots(imported.profile.id)[0].name).toBe('Checkpoint');
  });
});
