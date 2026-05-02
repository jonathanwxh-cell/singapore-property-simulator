import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from '../useGameStore';
import type { GameState, Player } from '../types';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Tester',
    age: 27,
    careerId: 'tech',
    salary: 5_500,
    cash: 50_000,
    cpfOrdinary: 31_600,
    cpfSpecial: 8_300,
    cpfMedisave: 11_000,
    creditScore: 650,
    properties: [],
    loans: [],
    maritalStatus: 'single',
    children: 0,
    year: 2024,
    month: 1,
    turnCount: 0,
    totalNetWorth: 100_900,
    achievements: [],
    difficulty: 'normal',
    totalRentalIncome: 0,
    totalPropertySalesProfit: 0,
    bankruptcyStrikes: 0,
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

  it('starts a new game with net worth equal to cash plus all CPF balances', () => {
    useGameStore.getState().newGame('Tester', 'tech', 'normal');

    const player = useGameStore.getState().player;
    expect(player.cash).toBe(50_000);
    expect(player.totalNetWorth).toBeCloseTo(player.cash + player.cpfOrdinary + player.cpfSpecial + player.cpfMedisave, 2);
  });

  it('keeps total net worth flat when taking on matching personal debt and repaying it in full', () => {
    resetStore({
      player: makePlayer({ cash: 200_000, cpfOrdinary: 0, cpfSpecial: 0, cpfMedisave: 0, totalNetWorth: 200_000 }),
    });

    const loanResult = useGameStore.getState().applyLoan(50_000, 5, 5, 'personal');
    expect(loanResult.ok).toBe(true);
    expect(useGameStore.getState().player.totalNetWorth).toBe(200_000);

    const loanId = useGameStore.getState().player.loans[0]?.id;
    expect(loanId).toBeTruthy();

    const repaymentResult = useGameStore.getState().payLoan(loanId!, 50_000);
    expect(repaymentResult.ok).toBe(true);
    expect(useGameStore.getState().player.totalNetWorth).toBe(200_000);
  });

  it('does not advance the turn while a scenario is pending', () => {
    resetStore({
      player: makePlayer({ turnCount: 4, month: 5 }),
      currentScenario: 'scenario-market-crash',
    });

    useGameStore.getState().nextTurn();

    const state = useGameStore.getState();
    expect(state.player.turnCount).toBe(4);
    expect(state.player.month).toBe(5);
    expect(state.currentScenario).toBe('scenario-market-crash');
  });

  it('completes the Tampines 5% purchase, creates the mortgage, and unlocks First Steps', () => {
    const result = useGameStore.getState().buyProperty('hdb-bto-1', 19_000);
    expect(result.ok).toBe(true);

    const player = useGameStore.getState().player;
    expect(player.cash).toBe(25_000);
    expect(player.properties).toHaveLength(1);
    expect(player.loans).toHaveLength(1);
    expect(player.loans[0].remainingBalance).toBe(361_000);
    expect(player.achievements).toContain('first-property');
    expect(player.totalNetWorth).toBe(94_900);
  });
});
