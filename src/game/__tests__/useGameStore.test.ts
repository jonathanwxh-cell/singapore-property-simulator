import { beforeEach, describe, expect, it, vi } from 'vitest';
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

  it('creates a new game with default life-state values', () => {
    useGameStore.getState().newGame('Avery', 'tech', 'normal');

    expect(useGameStore.getState().player.life).toMatchObject({
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

  it('normalizes legacy save data that has no life state', () => {
    const legacyState = makeState({
      player: (() => {
        const player = makePlayer() as Player & { life?: Player['life'] };
        delete player.life;
        return player as Player;
      })(),
    });

    useGameStore.getState().loadGame(legacyState);

    expect(useGameStore.getState().player.life.livingArrangement).toBe('with-parents');
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

  it('warns when autosave cannot write to localStorage', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const originalLocalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        setItem: () => {
          throw new Error('quota exceeded');
        },
      },
    });

    try {
      resetStore({
        settings: {
          soundEnabled: true,
          musicEnabled: false,
          animationSpeed: 'normal',
          autoSave: true,
          difficulty: 'normal',
        },
      });

      useGameStore.getState().setCurrentScenario('career-review');

      expect(warnSpy).toHaveBeenCalledWith(
        'Auto-save failed. Progress may not be preserved.',
        expect.any(Error),
      );
    } finally {
      warnSpy.mockRestore();
      if (originalLocalStorage) {
        Object.defineProperty(globalThis, 'localStorage', originalLocalStorage);
      } else {
        Reflect.deleteProperty(globalThis, 'localStorage');
      }
    }
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
    expect(useGameStore.getState().player.properties[0].occupancyStatus).toBe('owner-occupied');
  });

  it('blocks whole-flat HDB rental toggle during MOP', () => {
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
          occupancyStatus: 'owner-occupied',
          mopRemainingMonths: 48,
        }],
      }),
    });

    useGameStore.getState().toggleRental(0);

    expect(useGameStore.getState().player.properties[0]).toMatchObject({
      isRented: false,
      occupancyStatus: 'owner-occupied',
      mopRemainingMonths: 48,
    });
  });

  it('starts renovations and tenant strategies through store actions', () => {
    resetStore({
      player: makePlayer({
        cash: 120_000,
        properties: [{
          propertyId: 'hdb-bto-1',
          purchasePrice: 380_000,
          purchaseDate: '2024-01',
          currentValue: 380_000,
          isRented: false,
          monthlyRental: 1647,
          renovationLevel: 0,
          mopRemainingMonths: 24,
        }],
      }),
    });

    const roomRental = useGameStore.getState().setTenantStrategy(0, {
      mode: 'room-rental',
      profileId: 'local-family',
      rentStrategy: 'market',
    });
    expect(roomRental.ok).toBe(true);
    expect(useGameStore.getState().player.properties[0].tenant?.rentalMode).toBe('room-rental');

    const renovation = useGameStore.getState().startRenovation(0, 'flooring-paint');
    expect(renovation.ok).toBe(true);
    expect(useGameStore.getState().player.properties[0].activeRenovation?.templateId).toBe('flooring-paint');
  });

  it('applies tenant lease decisions through store actions', () => {
    resetStore({
      player: makePlayer({
        properties: [{
          propertyId: 'condo-10',
          purchasePrice: 1_150_000,
          purchaseDate: '2028-01',
          currentValue: 1_180_000,
          isRented: true,
          monthlyRental: 3_700,
          renovationLevel: 0,
          tenant: {
            profileId: 'expat-pmet',
            rentalMode: 'whole-unit',
            leaseStartTurn: 54,
            leaseEndTurn: 66,
            satisfaction: 72,
            rentStrategy: 'market',
            askingRent: 3_700,
            contractedRent: 3_700,
            defaultRiskPct: 2.5,
            renewalIntent: 70,
          },
        }],
      }),
    });

    const result = useGameStore.getState().applyTenantLeaseDecision(0, 'renew');

    expect(result.ok).toBe(true);
    expect(useGameStore.getState().player.properties[0].tenant?.leaseEndTurn).toBe(12);
    expect(useGameStore.getState().player.operationHistory?.[0].title).toContain('Lease renewed');
  });

  it('initializes progression defaults for a new game', () => {
    useGameStore.getState().newGame('Plan Test', 'graduate', 'normal');
    const player = useGameStore.getState().player;

    expect(player.firstHomePurchased).toBe(false);
    expect(player.careerProgressionProfile.reviewCount).toBe(0);
    expect(player.nextJobSwitchTurn).toBe(24);
  });

  it('normalizes buyer-profile ages for single-buyer routes', () => {
    useGameStore.getState().newGame('Solo Buyer', 'graduate', 'normal', {
      residencyStatus: 'sc',
      householdProfile: 'single-35-plus',
      age: 27,
    });
    expect(useGameStore.getState().player.buyerProfile?.age).toBe(35);

    useGameStore.getState().newGame('Young Buyer', 'graduate', 'normal', {
      residencyStatus: 'sc',
      householdProfile: 'single-under-35',
      age: 40,
    });
    expect(useGameStore.getState().player.buyerProfile?.age).toBe(34);
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
