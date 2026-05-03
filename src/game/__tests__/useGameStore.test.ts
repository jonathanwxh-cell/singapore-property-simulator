import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../useGameStore';
import type { GameState, Player } from '../types';

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
    careerGrowthModifier: 1,
    careerRiskModifier: 1,
    careerVolatilityModifier: 0,
    lastCareerReviewTurn: 0,
    nextJobSwitchTurn: 24,
    firstHomePurchased: false,
    ownedPrivateHome: false,
    careerProgressionProfile: { reviewCount: 0, lastOutcome: null, lastSalaryDelta: 0, lastBonus: 0 },
    careerReviewHistory: [],
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

  it('initializes progression defaults for a new game', () => {
    useGameStore.getState().newGame('Plan Test', 'graduate', 'normal');
    const player = useGameStore.getState().player;

    expect(player.firstHomePurchased).toBe(false);
    expect(player.careerProgressionProfile.reviewCount).toBe(0);
    expect(player.nextJobSwitchTurn).toBe(24);
  });

  it('hydrates missing progression fields when loading older saves', () => {
    const baseState = makeState();
    useGameStore.getState().loadGame({
      ...baseState,
      player: {
        ...baseState.player,
        firstHomePurchased: undefined,
        careerProgressionProfile: undefined,
        nextJobSwitchTurn: undefined,
      } as never,
    });

    const hydrated = useGameStore.getState().player;
    expect(hydrated.firstHomePurchased).toBe(false);
    expect(hydrated.careerProgressionProfile.reviewCount).toBe(0);
    expect(hydrated.nextJobSwitchTurn).toBeGreaterThan(0);
  });

  it('applies salary and career modifier deltas from scenario resolutions', () => {
    resetStore({
      player: makePlayer({ salary: 6000, cash: 100_000 }),
    });

    const resolution = useGameStore.getState().resolveScenario({
      label: 'Take the growth role',
      description: 'Higher pay with more upside and some added volatility.',
      probability: 1,
      cashImpact: 12_000,
      propertyValueImpact: 0,
      creditImpact: 5,
      followUpText: 'You switched into a faster track role.',
      salaryDeltaPct: 0.12,
      careerGrowthModifierDelta: 0.2,
      careerRiskModifierDelta: 0.08,
      careerVolatilityModifierDelta: 0.04,
    });

    expect(resolution.success).toBe(true);
    const player = useGameStore.getState().player;
    expect(player.salary).toBe(6720);
    expect(player.cash).toBe(112_000);
    expect(player.creditScore).toBe(705);
    expect(player.careerGrowthModifier).toBeCloseTo(1.2);
    expect(player.careerRiskModifier).toBeCloseTo(1.08);
    expect(player.careerVolatilityModifier).toBeCloseTo(0.04);
  });
});
