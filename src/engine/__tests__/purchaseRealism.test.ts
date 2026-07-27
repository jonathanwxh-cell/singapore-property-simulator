import { describe, expect, it } from 'vitest';
import { properties, type Property } from '@/data/properties';
import { createInitialLifeState, type Player } from '@/game/types';
import {
  DEFAULT_MORTGAGE_TERM_YEARS,
  HDB_CONCESSIONARY_DOWNPAYMENT_PERCENT,
  HDB_CONCESSIONARY_LTV,
  HDB_FLAT_MORTGAGE_TERM_YEARS,
  HDB_RESALE_LEVY_ESTIMATE,
} from '../constants';
import { validatePurchase } from '../purchase';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Tester',
    age: 30,
    careerId: 'graduate',
    salary: 9_000,
    cash: 500_000,
    cpfOrdinary: 150_000,
    cpfSpecial: 40_000,
    cpfMedisave: 20_000,
    creditScore: 760,
    properties: [],
    loans: [],
    maritalStatus: 'single',
    children: 0,
    year: 2026,
    month: 5,
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
    runRouteId: 'bto-upgrader',
    ...overrides,
  };
}

describe('purchase realism fixes', () => {
  it('uses the current 80% HDB concessionary LTV', () => {
    const bto = properties.find((property) => property.id === 'hdb-bto-0');
    expect(bto).toBeDefined();
    expect(HDB_CONCESSIONARY_LTV).toBe(0.8);
    expect(HDB_CONCESSIONARY_DOWNPAYMENT_PERCENT).toBe(20);

    const tenPercentDown = validatePurchase(makePlayer(), bto!, bto!.price * 0.1, 'hdb-concessionary');
    expect(tenPercentDown.maxLoan).toBe(Math.round(bto!.price * 0.8));
    expect(tenPercentDown.reasons.some((reason) => reason.code === 'ltv_exceeded')).toBe(true);
  });

  it('services HDB flat mortgages over 25 years instead of the generic private-property term', () => {
    const bto = properties.find((property) => property.id === 'hdb-bto-0');
    const condo = properties.find((property) => property.id === 'condo-10');
    expect(bto).toBeDefined();
    expect(condo).toBeDefined();

    const hdbValidation = validatePurchase(makePlayer(), bto!, bto!.price * 0.2, 'hdb-concessionary');
    const privateValidation = validatePurchase(makePlayer({ cash: 3_000_000 }), condo!, condo!.price * 0.25);

    expect(HDB_FLAT_MORTGAGE_TERM_YEARS).toBe(25);
    expect(hdbValidation.loanTermYears).toBe(HDB_FLAT_MORTGAGE_TERM_YEARS);
    expect(hdbValidation.monthlyPayment).toBe(962);
    expect(hdbValidation.assessmentInterestRate).toBe(3);
    expect(hdbValidation.assessedMonthlyPayment).toBeGreaterThan(hdbValidation.monthlyPayment);
    expect(privateValidation.loanTermYears).toBe(DEFAULT_MORTGAGE_TERM_YEARS);
  });

  it('separates mandatory cash from the total bank-loan down payment', () => {
    const condo = properties.find((property) => property.id === 'condo-10');
    expect(condo).toBeDefined();

    const validation = validatePurchase(
      makePlayer({ cash: 3_000_000, salary: 10_000, cpfOrdinary: 500_000 }),
      condo!,
      condo!.price * 0.25,
      'bank',
    );

    expect(validation.mandatoryCash).toBe(condo!.price * 0.05);
    expect(validation.maxCpfOrdinaryUsable).toBeLessThanOrEqual(
      validation.downPayment - validation.mandatoryCash,
    );
    expect(validation.assessmentInterestRate).toBeGreaterThanOrEqual(4);
  });

  it('reduces bank LTV when the term extends beyond age 65', () => {
    const condo = properties.find((property) => property.id === 'condo-10');
    expect(condo).toBeDefined();

    const validation = validatePurchase(
      makePlayer({
        age: 60,
        salary: 20_000,
        cash: 3_000_000,
        buyerProfile: { residencyStatus: 'sc', householdProfile: 'single-35-plus', age: 60 },
      }),
      condo!,
      condo!.price * 0.45,
      'bank',
    );

    expect(validation.ltvCap).toBe(0.55);
    expect(validation.mandatoryCash).toBe(condo!.price * 0.10);
  });

  it('lets true all-cash purchases bypass loan servicing and credit checks', () => {
    const bto = properties.find((property) => property.id === 'hdb-bto-0');
    expect(bto).toBeDefined();

    const validation = validatePurchase(
      makePlayer({ salary: 1_000, creditScore: 320, cash: 1_000_000 }),
      bto!,
      bto!.price,
      'hdb-concessionary',
    );

    expect(validation.canBuy).toBe(true);
    expect(validation.mortgageAmount).toBe(0);
    expect(validation.monthlyPayment).toBe(0);
    expect(validation.tdsrAllowed).toBe(true);
    expect(validation.msrAllowed).toBe(true);
    expect(validation.creditAllowed).toBe(true);
  });

  it('does not count pure commercial holdings as residential ABSD property count', () => {
    const condo = properties.find((property) => property.id === 'condo-4');
    const commercial = properties.find((property) => property.type === 'Commercial Shop' || property.type === 'Commercial Office');
    expect(condo).toBeDefined();
    expect(commercial).toBeDefined();

    const result = validatePurchase(makePlayer({
      properties: [{
        propertyId: commercial!.id,
        purchasePrice: commercial!.price,
        purchaseDate: 'Jan 2026',
        currentValue: commercial!.price,
        isRented: true,
        monthlyRental: 8_000,
        renovationLevel: 0,
      }],
    }), condo!, condo!.price * 0.25);

    expect(result.absdRate).toBe(0);
    expect(result.absd).toBe(0);
  });

  it('charges resale levy only after subsidised-housing history, not any previous first home', () => {
    const bto = properties.find((property) => property.id === 'hdb-bto-0');
    expect(bto).toBeDefined();

    const privateFirstHome = validatePurchase(makePlayer({
      firstHomePurchased: true,
      ownedPrivateHome: true,
      usedSubsidizedHousing: false,
    }), bto!, bto!.price * 0.25, 'hdb-concessionary');

    const subsidizedSecondTimer = validatePurchase(makePlayer({
      firstHomePurchased: true,
      usedSubsidizedHousing: true,
    }), bto!, bto!.price * 0.25, 'hdb-concessionary');

    expect(privateFirstHome.hdbResaleLevy).toBe(0);
    expect(subsidizedSecondTimer.hdbResaleLevy).toBe(HDB_RESALE_LEVY_ESTIMATE);
  });

  it('prorates CPF OA usage when lease is above 20 years but cannot cover the buyer to age 95', () => {
    const condo = properties.find((property) => property.id === 'condo-10');
    expect(condo).toBeDefined();

    const shortLeaseProperty: Property = {
      ...condo!,
      id: 'test-short-lease-prorated',
      yearBuilt: 1990,
      leaseYears: 60,
    };

    const validation = validatePurchase(
      makePlayer({
        age: 60,
        cash: 2_000_000,
        cpfOrdinary: 400_000,
        buyerProfile: { residencyStatus: 'sc', householdProfile: 'single-35-plus', age: 60 },
      }),
      shortLeaseProperty,
      shortLeaseProperty.price * 0.8,
    ) as Record<string, unknown> & { downPayment: number };

    expect(validation.cpfUsageMode).toBe('prorated');
    expect(validation.maxCpfOrdinaryUsable).toBeGreaterThan(0);
    expect(validation.maxCpfOrdinaryUsable).toBeLessThan(validation.downPayment);
  });

  it('blocks CPF OA usage when remaining lease is 20 years or below', () => {
    const condo = properties.find((property) => property.id === 'condo-10');
    expect(condo).toBeDefined();

    const veryShortLeaseProperty: Property = {
      ...condo!,
      id: 'test-short-lease-blocked',
      yearBuilt: 1980,
      leaseYears: 60,
    };

    const validation = validatePurchase(
      makePlayer({
        age: 60,
        cash: 2_000_000,
        cpfOrdinary: 400_000,
        buyerProfile: { residencyStatus: 'sc', householdProfile: 'single-35-plus', age: 60 },
      }),
      veryShortLeaseProperty,
      veryShortLeaseProperty.price * 0.25,
    ) as Record<string, unknown>;

    expect(validation.cpfUsageMode).toBe('blocked');
    expect(validation.maxCpfOrdinaryUsable).toBe(0);
  });
});
