import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../useGameStore';
import { createInitialLifeState, type GameState, type Player } from '../types';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Test',
    age: 27,
    careerId: 'graduate',
    salary: 12_000,
    cash: 1_000_000,
    cpfOrdinary: 0,
    cpfSpecial: 0,
    cpfMedisave: 0,
    creditScore: 700,
    properties: [],
    loans: [],
    maritalStatus: 'single',
    children: 0,
    year: 2024,
    month: 1,
    turnCount: 0,
    totalNetWorth: 1_000_000,
    achievements: [],
    difficulty: 'normal',
    totalRentalIncome: 0,
    totalPropertySalesProfit: 0,
    bankruptcyStrikes: 0,
    life: createInitialLifeState(),
    ...overrides,
  };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    player: makePlayer(),
    market: {
      interestRate: 3.0,
      priceIndex: 100,
      rentalIndex: 100,
      volatility: 0.12,
      lastEvent: null,
    },
    settings: {
      soundEnabled: true,
      musicEnabled: false,
      animationSpeed: 'normal',
      autoSave: false,
      difficulty: 'normal',
    },
    isGameActive: true,
    currentScenario: null,
    rngSeed: 0,
    rngState: 0,
    ...overrides,
  };
}

function resetStore(overrides: Partial<GameState> = {}) {
  useGameStore.setState(makeState(overrides));
}

describe('useGameStore', () => {
  beforeEach(() => {
    resetStore();
  });

  it('creates a new game with default life-state values', () => {
    useGameStore.getState().newGame('Avery', 'tech', 'normal');

    expect((useGameStore.getState().player as any).life).toMatchObject({
      energy: 70,
      stress: 20,
      reputation: 0,
      careerMomentum: 0,
      householdLoad: 650,
      householdSupport: 50,
      livingArrangement: 'with-parents',
      selectedPrimaryActionId: null,
      selectedSecondaryActionId: null,
      trainingTrackId: null,
      trainingMonthsRemaining: 0,
    });
  });

  it('stores monthly life actions in player state', () => {
    useGameStore.getState().setPrimaryLifeAction('take-side-gig');
    useGameStore.getState().setSecondaryLifeAction('recover');

    expect(useGameStore.getState().player.life.selectedPrimaryActionId).toBe('take-side-gig');
    expect(useGameStore.getState().player.life.selectedSecondaryActionId).toBe('recover');
  });

  it('keeps total net worth flat when taking on matching debt', () => {
    resetStore({
      player: makePlayer({ cash: 200_000, totalNetWorth: 200_000 }),
    });

    const result = useGameStore.getState().applyLoan(100_000, 5, 5, 'personal');

    expect(result.ok).toBe(true);
    expect(useGameStore.getState().player.totalNetWorth).toBe(200_000);
  });

  it('does not advance the turn while a scenario is pending', () => {
    resetStore({
      player: makePlayer({ turnCount: 4, month: 5, totalNetWorth: 1_000_000 }),
      currentScenario: 'scenario-market-crash',
    });

    useGameStore.getState().nextTurn();

    const state = useGameStore.getState();
    expect(state.player.turnCount).toBe(4);
    expect(state.player.month).toBe(5);
    expect(state.currentScenario).toBe('scenario-market-crash');
  });

  it('unlocks the first property achievement after a successful purchase', () => {
    resetStore({
      player: makePlayer({ cash: 2_000_000, totalNetWorth: 2_000_000 }),
    });

    const result = useGameStore.getState().buyProperty('hdb-bto-1', 100_000);

    expect(result.ok).toBe(true);
    expect(useGameStore.getState().player.achievements).toContain('first-property');
  });

  it('keeps occupancy state in sync when rental status changes', () => {
    resetStore({
      player: makePlayer({
        properties: [{
          propertyId: 'hdb-bto-1',
          purchasePrice: 380_000,
          purchaseDate: '2024-01',
          currentValue: 380_000,
          isRented: false,
          monthlyRental: 1647,
          renovationLevel: 0,
        }],
      }),
    });

    useGameStore.getState().toggleRental(0);
    expect(useGameStore.getState().player.properties[0].isRented).toBe(true);
    expect(useGameStore.getState().player.properties[0].occupancyStatus).toBe('tenanted');

    useGameStore.getState().toggleRental(0);
    expect(useGameStore.getState().player.properties[0].isRented).toBe(false);
    expect(useGameStore.getState().player.properties[0].occupancyStatus).toBe('vacant');
  });
});
