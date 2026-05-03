import { describe, expect, it } from 'vitest';
import { advanceTurn } from '../turn';
import { createRng } from '../rng';
import type { Player, MarketState, GameSettings } from '@/game/types';
import { scenarios } from '@/data/scenarios';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Test', age: 27, careerId: 'graduate', salary: 5000,
    cash: 100_000, cpfOrdinary: 20_000, cpfSpecial: 5_000, cpfMedisave: 20_000,
    creditScore: 700, properties: [], loans: [], maritalStatus: 'single',
    children: 0, year: 2024, month: 1, turnCount: 0, totalNetWorth: 145_000,
    achievements: [], difficulty: 'normal', totalRentalIncome: 0,
    totalPropertySalesProfit: 0, bankruptcyStrikes: 0,
    careerGrowthModifier: 1,
    careerRiskModifier: 1,
    careerVolatilityModifier: 0,
    lastCareerReviewTurn: 0,
    nextJobSwitchTurn: 24,
    firstHomePurchased: false,
    ownedPrivateHome: false,
    careerProgressionProfile: {
      reviewCount: 0,
      lastOutcome: null,
      lastSalaryDelta: 0,
      lastBonus: 0,
    },
    careerReviewHistory: [],
    ...overrides,
  };
}

const baseMarket: MarketState = {
  interestRate: 3.0, priceIndex: 100, rentalIndex: 100, volatility: 0.12, lastEvent: null,
};

const baseSettings: GameSettings = {
  soundEnabled: true, musicEnabled: false, animationSpeed: 'normal', autoSave: true, difficulty: 'normal',
};

describe('advanceTurn', () => {
  it('is deterministic given the same seed', () => {
    const a = advanceTurn({ player: makePlayer(), market: baseMarket, settings: baseSettings, rng: createRng(42) });
    const b = advanceTurn({ player: makePlayer(), market: baseMarket, settings: baseSettings, rng: createRng(42) });
    expect(a.player.cash).toBe(b.player.cash);
    expect(a.market.priceIndex).toBe(b.market.priceIndex);
    expect(a.scenarioId).toBe(b.scenarioId);
  });

  it('advances time correctly within a year', () => {
    const result = advanceTurn({ player: makePlayer({ month: 5, year: 2024 }), market: baseMarket, settings: baseSettings, rng: createRng(1) });
    expect(result.player.month).toBe(6);
    expect(result.player.year).toBe(2024);
    expect(result.player.age).toBe(27);
  });

  it('rolls month over and ages up at year boundary', () => {
    const result = advanceTurn({ player: makePlayer({ month: 12, year: 2024, age: 27 }), market: baseMarket, settings: baseSettings, rng: createRng(1) });
    expect(result.player.month).toBe(1);
    expect(result.player.year).toBe(2025);
    expect(result.player.age).toBe(28);
  });

  it('does not fire scenarios on turn 0', () => {
    let firedOnZero = false;
    for (let seed = 0; seed < 50; seed++) {
      const result = advanceTurn({ player: makePlayer({ turnCount: 0 }), market: baseMarket, settings: baseSettings, rng: createRng(seed) });
      if (result.scenarioId !== null) firedOnZero = true;
    }
    expect(firedOnZero).toBe(false);
  });

  it('does not fire scenarios on the first tycoon turn', () => {
    let firedOnFirstTycoonTurn = false;
    for (let seed = 0; seed < 200; seed++) {
      const result = advanceTurn({
        player: makePlayer({ turnCount: 0, difficulty: 'tycoon' }),
        market: baseMarket,
        settings: { ...baseSettings, difficulty: 'tycoon' },
        rng: createRng(seed),
      });
      if (result.scenarioId !== null) firedOnFirstTycoonTurn = true;
    }
    expect(firedOnFirstTycoonTurn).toBe(false);
  });

  it('guarantees the first-home scenario on turn 2 when the player owns nothing', () => {
    const result = advanceTurn({
      player: makePlayer({ turnCount: 1, month: 2, difficulty: 'normal' }),
      market: baseMarket,
      settings: baseSettings,
      rng: createRng(7),
    });
    expect(result.scenarioId).toBe('first-home-window');
  });

  it('runs an annual career review on the twelfth turn and surfaces the review scenario', () => {
    const result = advanceTurn({
      player: makePlayer({ turnCount: 11, month: 12, year: 2024 }),
      market: baseMarket,
      settings: baseSettings,
      rng: createRng(5),
    });

    expect(result.scenarioId).toBe('career-review');
    expect(result.player.lastCareerReviewTurn).toBe(12);
    expect(result.player.careerProgressionProfile.reviewCount).toBe(1);
    expect(result.player.careerReviewHistory).toHaveLength(1);
  });

  it('offers a job-switch scenario when the scheduled switch turn is reached', () => {
    const result = advanceTurn({
      player: makePlayer({ turnCount: 23, nextJobSwitchTurn: 24, month: 6, year: 2025, properties: [{ propertyId: 'hdb-bto-0', purchasePrice: 265_000, purchaseDate: '2024-01', currentValue: 265_000, isRented: false, monthlyRental: 0, renovationLevel: 0 }] }),
      market: baseMarket,
      settings: baseSettings,
      rng: createRng(13),
    });

    expect(result.scenarioId).toBe('job-switch-opportunity');
  });

  it('has concrete scenario definitions for annual review and job-switch turns', () => {
    const scenarioIds = new Set(scenarios.map((scenario) => scenario.id));
    expect(scenarioIds.has('career-review')).toBe(true);
    expect(scenarioIds.has('job-switch-opportunity')).toBe(true);
  });

  it('fires a regular scenario on cadence instead of leaving an empty drought', () => {
    const result = advanceTurn({
      player: makePlayer({ turnCount: 5, month: 6, difficulty: 'normal', properties: [{ propertyId: 'hdb-bto-0', purchasePrice: 265_000, purchaseDate: '2024-01', currentValue: 265_000, isRented: false, monthlyRental: 0, renovationLevel: 0 }] }),
      market: baseMarket,
      settings: baseSettings,
      rng: createRng(19),
    });
    expect(result.scenarioId).not.toBeNull();
    expect(result.scenarioId).not.toBe('first-home-window');
  });

  it('attaches a market headline and news feed entry to each turn', () => {
    const result = advanceTurn({
      player: makePlayer({ turnCount: 2 }),
      market: baseMarket,
      settings: baseSettings,
      rng: createRng(11),
    });
    expect(result.market.lastHeadline).toBeTruthy();
    expect(result.market.lastSummary).toBeTruthy();
    expect(result.market.newsFeed).toHaveLength(1);
    expect(typeof result.market.monthlyPriceChangePct).toBe('number');
  });

  it('amortizes a mortgage by the correct interest split', () => {
    const player = makePlayer({
      loans: [{
        id: 'loan_1', type: 'mortgage', principal: 500_000, remainingBalance: 500_000,
        interestRate: 2.5, monthlyPayment: 1976, termYears: 30, startDate: '2024-01', isPaid: false,
      }],
    });
    const result = advanceTurn({ player, market: baseMarket, settings: baseSettings, rng: createRng(1) });
    expect(result.player.loans[0].remainingBalance).toBeCloseTo(499_065.67, 0);
    expect(result.player.loans[0].isPaid).toBe(false);
  });

  it('triggers loss state after 3 consecutive insolvent turns', () => {
    const player = makePlayer({
      cash: -50_000, salary: 1000, bankruptcyStrikes: 0,
      loans: [{ id: 'loan_1', type: 'mortgage', principal: 500_000, remainingBalance: 500_000, interestRate: 2.5, monthlyPayment: 1976, termYears: 30, startDate: '2024-01', isPaid: false }],
    });
    let result = advanceTurn({ player, market: baseMarket, settings: baseSettings, rng: createRng(1) });
    expect(result.outcome).toBe('ongoing');
    expect(result.player.bankruptcyStrikes).toBe(1);

    result = advanceTurn({ player: result.player, market: result.market, settings: baseSettings, rng: createRng(2) });
    expect(result.player.bankruptcyStrikes).toBe(2);
    expect(result.outcome).toBe('ongoing');

    result = advanceTurn({ player: result.player, market: result.market, settings: baseSettings, rng: createRng(3) });
    expect(result.player.bankruptcyStrikes).toBe(3);
    expect(result.outcome).toBe('lost');
    expect(result.gameOver).toBe(true);
  });

  it('triggers win state when net worth >= target', () => {
    const player = makePlayer({ cash: 16_000_000, difficulty: 'normal' });
    const result = advanceTurn({ player, market: baseMarket, settings: baseSettings, rng: createRng(1) });
    expect(result.outcome).toBe('won');
    expect(result.gameOver).toBe(true);
  });

  it('resets bankruptcy strikes when player recovers', () => {
    const player = makePlayer({ cash: 100_000, salary: 5000, bankruptcyStrikes: 2 });
    const result = advanceTurn({ player, market: baseMarket, settings: baseSettings, rng: createRng(1) });
    expect(result.player.bankruptcyStrikes).toBe(0);
  });
});

  it('grows all three CPF buckets each turn', () => {
    const player = makePlayer({ salary: 5000, cpfOrdinary: 50_000, cpfSpecial: 20_000, cpfMedisave: 25_000 });
    const result = advanceTurn({ player, market: baseMarket, settings: baseSettings, rng: createRng(1) });
    expect(result.player.cpfOrdinary).toBeGreaterThan(50_000);
    expect(result.player.cpfSpecial).toBeGreaterThan(20_000);
    expect(result.player.cpfMedisave).toBeGreaterThan(25_000);
  });

  it('respects the CPF wage ceiling', () => {
    const a = advanceTurn({ player: makePlayer({ salary: 5000, cpfOrdinary: 0, cpfSpecial: 0, cpfMedisave: 0 }), market: baseMarket, settings: baseSettings, rng: createRng(1) });
    const b = advanceTurn({ player: makePlayer({ salary: 20_000, cpfOrdinary: 0, cpfSpecial: 0, cpfMedisave: 0 }), market: baseMarket, settings: baseSettings, rng: createRng(1) });
    const ceiling = advanceTurn({ player: makePlayer({ salary: 6800, cpfOrdinary: 0, cpfSpecial: 0, cpfMedisave: 0 }), market: baseMarket, settings: baseSettings, rng: createRng(1) });
    expect(b.player.cpfOrdinary).toBeGreaterThan(a.player.cpfOrdinary);
    expect(b.player.cpfOrdinary).toBeCloseTo(ceiling.player.cpfOrdinary, 0);
  });
