import { describe, expect, it } from 'vitest';
import { properties } from '@/data/properties';
import { createInitialLifeState, type Player } from '@/game/types';
import {
  getRunArc,
  getRouteMilestones,
  inferRunRouteId,
  scoreRunRoute,
} from '../runDirector';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Tester',
    age: 30,
    careerId: 'graduate',
    salary: 5_000,
    cash: 80_000,
    cpfOrdinary: 50_000,
    cpfSpecial: 10_000,
    cpfMedisave: 8_000,
    creditScore: 650,
    properties: [],
    loans: [],
    maritalStatus: 'single',
    children: 0,
    year: 2024,
    month: 1,
    turnCount: 0,
    totalNetWorth: 0,
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
    buyerProfile: { residencyStatus: 'sc', householdProfile: 'couple-family', age: 30 },
    reserve: { targetMonths: 3, allocatedCash: 0, autoTopUpPct: 0 },
    operationHistory: [],
    ...overrides,
  };
}

describe('run director', () => {
  it('infers sensible default routes for common Singapore profiles', () => {
    expect(inferRunRouteId(makePlayer())).toBe('bto-upgrader');
    expect(inferRunRouteId(makePlayer({
      buyerProfile: { residencyStatus: 'sc', householdProfile: 'single-under-35', age: 28 },
    }))).toBe('pr-private-climber');
    expect(inferRunRouteId(makePlayer({
      buyerProfile: { residencyStatus: 'sc', householdProfile: 'single-35-plus', age: 35 },
    }))).toBe('single-resale');
    expect(inferRunRouteId(makePlayer({
      buyerProfile: { residencyStatus: 'foreigner', householdProfile: 'foreigner-investor', age: 40 },
    }))).toBe('foreign-investor');
  });

  it('promotes landlord and commercial routes from portfolio evidence', () => {
    const commercial = properties.find((property) => property.type === 'Commercial Shop' || property.type === 'Commercial Office');
    expect(commercial).toBeDefined();

    expect(inferRunRouteId(makePlayer({
      properties: [{
        propertyId: 'hdb-bto-0',
        purchasePrice: 420_000,
        purchaseDate: 'Jan 2024',
        currentValue: 420_000,
        isRented: true,
        monthlyRental: 1_200,
        renovationLevel: 0,
      }],
    }))).toBe('heartland-landlord');

    expect(inferRunRouteId(makePlayer({
      properties: [{
        propertyId: commercial!.id,
        purchasePrice: commercial!.price,
        purchaseDate: 'Jan 2024',
        currentValue: commercial!.price,
        isRented: false,
        monthlyRental: 0,
        renovationLevel: 0,
      }],
    }))).toBe('commercial-operator');
  });

  it('derives active milestones and progress for a starter route', () => {
    const player = makePlayer({ cash: 30_000, cpfOrdinary: 10_000 });
    const arc = getRunArc(player);
    const milestones = getRouteMilestones(player);

    expect(arc.route.id).toBe('bto-upgrader');
    expect(arc.phase).toBe('foundation');
    expect(arc.activeMilestone).toBeDefined();
    expect(milestones.some((milestone) => milestone.status === 'active')).toBe(true);
    expect(arc.progressPct).toBeGreaterThanOrEqual(0);
    expect(arc.progressPct).toBeLessThanOrEqual(100);
  });

  it('scores route completion and recommends a different replay route', () => {
    const score = scoreRunRoute(makePlayer({
      runRouteId: 'heartland-landlord',
      properties: [{
        propertyId: 'hdb-bto-0',
        purchasePrice: 420_000,
        purchaseDate: 'Jan 2024',
        currentValue: 450_000,
        isRented: true,
        monthlyRental: 1_400,
        renovationLevel: 1,
        tenant: {
          profileId: 'local-family',
          rentalMode: 'room-rental',
          leaseStartTurn: 1,
          leaseEndTurn: 13,
          satisfaction: 82,
          rentStrategy: 'market',
          askingRent: 1_400,
          contractedRent: 1_400,
          defaultRiskPct: 5,
          renewalIntent: 80,
        },
      }],
      reserve: { targetMonths: 6, allocatedCash: 30_000, autoTopUpPct: 0 },
    }));

    expect(score.completedMilestones).toBeGreaterThan(0);
    expect(score.score).toBeGreaterThan(0);
    expect(score.suggestedNextRouteId).not.toBe('heartland-landlord');
  });
});
