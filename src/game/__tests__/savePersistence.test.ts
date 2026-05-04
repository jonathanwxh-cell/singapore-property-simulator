import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { SAVE_VERSION } from '@/engine/constants';
import type { GameState } from '../types';
import {
  AUTO_SAVE_KEY,
  parseStoredGameState,
  serializeGameState,
  shouldHydrateAutoSaveForPath,
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
});
