import { describe, expect, it } from 'vitest';
import { getPlaySurfaceState } from '../playSurface';
import { createInitialLifeState, type OwnedProperty, type Player } from '@/game/types';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Tester',
    age: 30,
    careerId: 'graduate',
    salary: 5000,
    cash: 50000,
    cpfOrdinary: 30000,
    cpfSpecial: 10000,
    cpfMedisave: 10000,
    creditScore: 700,
    properties: [],
    loans: [],
    maritalStatus: 'married',
    children: 0,
    year: 2026,
    month: 5,
    turnCount: 4,
    totalNetWorth: 100000,
    achievements: [],
    difficulty: 'normal',
    totalRentalIncome: 0,
    totalPropertySalesProfit: 0,
    bankruptcyStrikes: 0,
    life: createInitialLifeState(),
    careerGrowthModifier: 1,
    careerRiskModifier: 1,
    careerVolatilityModifier: 1,
    lastCareerReviewTurn: 0,
    nextJobSwitchTurn: 24,
    firstHomePurchased: false,
    ownedPrivateHome: false,
    careerProgressionProfile: { reviewCount: 0, lastOutcome: null, lastSalaryDelta: 0, lastBonus: 0 },
    careerReviewHistory: [],
    buyerProfile: { residencyStatus: 'sc', householdProfile: 'couple-family', age: 30 },
    runRouteId: 'bto-upgrader',
    ...overrides,
  };
}

function makeOwnedProperty(overrides: Partial<OwnedProperty> = {}): OwnedProperty {
  return {
    propertyId: 'hdb-bto-0',
    purchasePrice: 420000,
    currentValue: 420000,
    downPayment: 100000,
    mortgage: 320000,
    purchaseDate: '2026-05',
    isRented: false,
    rentalIncome: 0,
    occupancyStatus: 'owner-occupied',
    vacancyStreak: 0,
    conditionScore: 82,
    tenantSatisfaction: 70,
    maintenanceReserve: 5000,
    monthlyMaintenance: 150,
    propertyTaxAnnual: 900,
    mopRemainingMonths: 54,
    ...overrides,
  };
}

describe('play surface director', () => {
  it('turns a pre-owner run into a playable life board with intent choices', () => {
    const surface = getPlaySurfaceState({ player: makePlayer(), currentScenario: null });

    expect(surface.label).toBe('Life Board');
    expect(surface.title).not.toContain('Dashboard');
    expect(surface.timeline.some((stage) => stage.id === 'first-home' && stage.status === 'current')).toBe(true);
    expect(surface.choices).toHaveLength(3);
    expect(surface.choices[0].kind).toBe('intent');
    expect(surface.choices[0].primaryLabel).toBe('Do + Advance Month');
    expect(surface.financeModeLabel).toBe('Inspect finances');
  });

  it('frames active MOP ownership as a home season instead of idle waiting', () => {
    const surface = getPlaySurfaceState({
      player: makePlayer({
        firstHomePurchased: true,
        properties: [makeOwnedProperty()],
      }),
      currentScenario: null,
    });

    expect(surface.scene.id).toBe('home-season');
    expect(surface.timeline.find((stage) => stage.id === 'home-season')?.status).toBe('current');
    expect(surface.subtitle).toContain('MOP');
    expect(surface.choices.some((choice) => choice.label.toLowerCase().includes('home') || choice.label.toLowerCase().includes('rental'))).toBe(true);
  });

  it('turns an active scenario into a single blocker choice', () => {
    const surface = getPlaySurfaceState({
      player: makePlayer(),
      currentScenario: 'cooling-measures',
    });

    expect(surface.scene.id).toBe('decision-point');
    expect(surface.choices).toHaveLength(1);
    expect(surface.choices[0]).toMatchObject({
      kind: 'route',
      route: '/scenarios',
      primaryLabel: 'Choose response',
      recommended: true,
    });
  });
});
