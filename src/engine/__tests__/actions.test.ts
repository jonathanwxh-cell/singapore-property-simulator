import { describe, expect, it } from 'vitest';
import { properties } from '@/data/properties';
import {
  applyLoanPure,
  buyPropertyPure,
  payLoanPure,
  renovatePropertyPure,
  resolveScenarioOption,
  sellPropertyPure,
} from '../actions';
import { createInitialLifeState, type Player } from '@/game/types';
import { validatePurchase } from '../purchase';

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    name: 'Test', age: 27, careerId: 'graduate', salary: 5000,
    cash: 1_000_000, cpfOrdinary: 0, cpfSpecial: 0, cpfMedisave: 0,
    creditScore: 700, properties: [], loans: [], maritalStatus: 'single',
    children: 0, year: 2024, month: 1, turnCount: 0, totalNetWorth: 0,
    achievements: [], difficulty: 'normal', totalRentalIncome: 0,
    totalPropertySalesProfit: 0, bankruptcyStrikes: 0,
    life: createInitialLifeState(),
    careerGrowthModifier: 1, careerRiskModifier: 1, careerVolatilityModifier: 0,
    lastCareerReviewTurn: 0, nextJobSwitchTurn: 24,
    firstHomePurchased: false, ownedPrivateHome: false,
    careerProgressionProfile: { reviewCount: 0, lastOutcome: null, lastSalaryDelta: 0, lastBonus: 0 },
    careerReviewHistory: [],
    ...overrides,
  };
}

describe('buyPropertyPure', () => {
  it('rejects unknown property IDs', () => {
    const result = buyPropertyPure(makePlayer(), 'does-not-exist', 100_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('property_not_found');
  });

  it('rejects insufficient cash', () => {
    const result = buyPropertyPure(makePlayer({ cash: 1000 }), 'hdb-bto-1', 100_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('insufficient_cash');
  });

  it('rejects when TDSR would exceed 55%', () => {
    const player = makePlayer({
      salary: 3000,
      cash: 1_000_000,
      loans: [{ id: 'old', type: 'personal', principal: 0, remainingBalance: 100_000, interestRate: 5, monthlyPayment: 1500, termYears: 10, startDate: '', isPaid: false }],
    });
    const result = buyPropertyPure(player, 'hdb-bto-1', 100_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('tdsr_exceeded');
  });

  it('rejects duplicate purchases', () => {
    const player = makePlayer({
      properties: [{ propertyId: 'hdb-bto-1', purchasePrice: 380_000, purchaseDate: '', currentValue: 380_000, isRented: false, monthlyRental: 0, renovationLevel: 0 }],
    });
    const result = buyPropertyPure(player, 'hdb-bto-1', 100_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('already_owned');
  });

  it('creates the expected Tampines mortgage and ownership state on a valid purchase', () => {
    const player = makePlayer({
      cash: 150_000,
      salary: 5_500,
      cpfOrdinary: 31_600,
      cpfSpecial: 8_300,
      cpfMedisave: 11_000,
    });

    const result = buyPropertyPure(player, 'hdb-bto-1', 100_000);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.player.cash).toBe(44_000);
    expect(result.value.player.properties).toHaveLength(1);
    expect(result.value.player.loans).toHaveLength(1);
    expect(result.value.player.loans[0].principal).toBe(280_000);
    expect(result.value.player.loans[0].remainingBalance).toBe(280_000);
    expect(result.value.player.properties[0].occupancyStatus).toBe('owner-occupied');
    expect(result.value.player.properties[0].vacancyMonths).toBe(0);
    expect(result.value.player.properties[0].maintenanceCost).toBeGreaterThan(0);
    expect(result.value.player.properties[0].propertyTax).toBeGreaterThan(0);
  });

  it('supports an HDB concessionary loan path with 25% down and 2.6% interest', () => {
    const player = makePlayer({ cash: 100_000, salary: 5_500 });
    const result = buyPropertyPure(player, 'hdb-bto-0', 66_250, 0, 'hdb-concessionary');

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.player.properties[0].financingMode).toBe('hdb-concessionary');
    expect(result.value.player.loans[0].principal).toBe(198_750);
    expect(result.value.player.loans[0].interestRate).toBe(2.6);
    expect(result.value.player.loans[0].monthlyPayment).toBe(902);
    expect(result.value.player.loans[0].termYears).toBe(25);
    expect(result.value.player.loans[0].financingMode).toBe('hdb-concessionary');
  });

  it('still rejects a bank-financed HDB purchase that tries to use only 10% down', () => {
    const result = buyPropertyPure(makePlayer({ cash: 200_000, salary: 5_500 }), 'hdb-bto-0', 26_500);

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('ltv_exceeded');
  });

  it('uses CPF OA for eligible residential upfront costs', () => {
    const player = makePlayer({ cash: 60_000, cpfOrdinary: 40_000 });
    const result = buyPropertyPure(player, 'hdb-bto-0', 70_000, 20_000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.player.cash).toBeLessThan(player.cash);
      expect(result.value.player.cpfOrdinary).toBe(20_000);
    }
  });

  it('floors fractional CPF OA usage so UI-ready purchases are not rejected by cents', () => {
    const player = makePlayer({ cash: 50_000, cpfOrdinary: 31_578.57, salary: 5_500 });
    const result = buyPropertyPure(player, 'hdb-bto-0', 66_250, 31_578.57);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.player.properties).toHaveLength(1);
      expect(result.value.player.cpfOrdinary).toBe(1);
    }
  });

  it('rejects CPF OA usage on commercial purchases', () => {
    const player = makePlayer({ cash: 5_000_000, cpfOrdinary: 200_000 });
    const result = buyPropertyPure(player, 'commercial-5', 1_000_000, 100_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('cpf_not_allowed');
  });

  it('does not charge residential ABSD on a commercial purchase', () => {
    const citizen = buyPropertyPure(makePlayer({ cash: 5_000_000, salary: 50_000 }), 'commercial-5', 1_000_000);
    const foreigner = buyPropertyPure(makePlayer({
      cash: 5_000_000,
      salary: 50_000,
      buyerProfile: {
        residencyStatus: 'foreigner',
        householdProfile: 'foreigner-investor',
        age: 38,
      },
    }), 'commercial-5', 1_000_000);

    expect(citizen.ok).toBe(true);
    expect(foreigner.ok).toBe(true);
    if (!citizen.ok || !foreigner.ok) return;
    expect(foreigner.value.player.cash).toBe(citizen.value.player.cash);
  });

  it('rejects executive condo purchases when the salary ceiling is exceeded', () => {
    const result = buyPropertyPure(makePlayer({ cash: 2_000_000, salary: 17_500 }), 'ec-1', 500_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('eligibility_blocked');
  });

  it('marks the first residential purchase as leaving first-timer status', () => {
    const result = buyPropertyPure(makePlayer({ cash: 2_000_000 }), 'hdb-bto-1', 100_000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.player.firstHomePurchased).toBe(true);
      expect(result.value.player.ownedPrivateHome).toBe(false);
    }
  });

  it('flags private-home ownership after buying a private condo', () => {
    const result = buyPropertyPure(makePlayer({ cash: 3_000_000 }), 'condo-10', 500_000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.player.firstHomePurchased).toBe(true);
      expect(result.value.player.ownedPrivateHome).toBe(true);
    }
  });

  it('marks the first private residential purchase as owner-occupied', () => {
    const result = buyPropertyPure(makePlayer({ cash: 3_000_000 }), 'condo-10', 500_000);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.player.properties[0].occupancyStatus).toBe('owner-occupied');
  });

  it('blocks a private residential purchase while an HDB MOP is still active', () => {
    const first = buyPropertyPure(makePlayer({ cash: 5_000_000 }), 'hdb-bto-0', 265_000);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = buyPropertyPure(first.value.player, 'condo-10', 1_100_000);

    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.reason).toBe('mop_restricted');
      expect(second.message).toContain('MOP');
    }
  });

  it('blocks buying a second HDB while still holding a public-housing home', () => {
    const first = buyPropertyPure(makePlayer({ cash: 5_000_000 }), 'hdb-bto-0', 265_000);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const afterMop = {
      ...first.value.player,
      properties: first.value.player.properties.map((property) => ({
        ...property,
        mopRemainingMonths: 0,
      })),
    };
    const second = buyPropertyPure(afterMop, 'hdb-resale-0', 295_000);

    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.reason).toBe('eligibility_blocked');
      expect(second.message).toContain('public-housing');
    }
  });

  it('charges SPR first-property ABSD through the purchase path', () => {
    const citizen = buyPropertyPure(makePlayer({ cash: 3_000_000 }), 'condo-10', 500_000);
    const spr = buyPropertyPure(makePlayer({
      cash: 3_000_000,
      buyerProfile: {
        residencyStatus: 'spr',
        householdProfile: 'couple-family',
        age: 32,
      },
    }), 'condo-10', 500_000);

    expect(citizen.ok).toBe(true);
    expect(spr.ok).toBe(true);
    if (!citizen.ok || !spr.ok) return;
    expect(spr.value.player.cash).toBe(citizen.value.player.cash - 55_000);
  });

  it('blocks foreigner HDB purchases before cash is deducted', () => {
    const result = buyPropertyPure(makePlayer({
      cash: 1_000_000,
      buyerProfile: {
        residencyStatus: 'foreigner',
        householdProfile: 'foreigner-investor',
        age: 38,
      },
    }), 'hdb-bto-0', 100_000);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('eligibility_blocked');
      expect(result.message).toContain('Foreigners cannot buy HDB');
    }
  });
});

describe('payLoanPure', () => {
  it('caps payment at remaining balance and returns excess to cash', () => {
    const player = makePlayer({
      cash: 500_000,
      loans: [{ id: 'L1', type: 'personal', principal: 80_000, remainingBalance: 80_000, interestRate: 5, monthlyPayment: 850, termYears: 10, startDate: '', isPaid: false }],
    });
    const result = payLoanPure(player, 'L1', 200_000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.player.cash).toBe(420_000);
      expect(result.value.player.loans[0].remainingBalance).toBe(0);
      expect(result.value.player.loans[0].isPaid).toBe(true);
    }
  });

  it('rejects when cash is insufficient', () => {
    const player = makePlayer({
      cash: 1000,
      loans: [{ id: 'L1', type: 'personal', principal: 80_000, remainingBalance: 80_000, interestRate: 5, monthlyPayment: 850, termYears: 10, startDate: '', isPaid: false }],
    });
    const result = payLoanPure(player, 'L1', 50_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('insufficient_cash');
  });
});

describe('sellPropertyPure', () => {
  it('blocks selling an HDB while MOP is still active', () => {
    const player = makePlayer({
      cash: 0,
      properties: [{
        propertyId: 'hdb-bto-0',
        purchasePrice: 265_000,
        purchaseDate: '2024-01',
        currentValue: 285_000,
        isRented: false,
        monthlyRental: 1300,
        renovationLevel: 0,
        mopRemainingMonths: 48,
      }],
    });

    const result = sellPropertyPure(player, 0);

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('mop_restricted');
      expect(result.message).toContain('MOP');
    }
  });

  it('records capital gain (saleValue - purchasePrice), independent of outstanding loan', () => {
    const player = makePlayer({
      cash: 0,
      properties: [{ propertyId: 'p1', purchasePrice: 800_000, purchaseDate: '', currentValue: 1_200_000, isRented: false, monthlyRental: 0, renovationLevel: 0, loanId: 'L1' }],
      loans: [{ id: 'L1', type: 'mortgage', principal: 600_000, remainingBalance: 600_000, interestRate: 2.5, monthlyPayment: 2371, termYears: 30, startDate: '', isPaid: false }],
    });
    const result = sellPropertyPure(player, 0);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.player.totalPropertySalesProfit).toBe(400_000);
      expect(result.value.player.cash).toBe(600_000);
      expect(result.value.player.properties).toHaveLength(0);
      expect(result.value.player.loans[0].isPaid).toBe(true);
    }
  });
});

describe('applyLoanPure', () => {
  it('rejects when credit score is below floor', () => {
    const result = applyLoanPure(makePlayer({ creditScore: 350 }), 50_000, 5, 5, 'personal');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('credit_too_low');
  });

  it('rejects zero amount', () => {
    const result = applyLoanPure(makePlayer(), 0, 5, 5, 'personal');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_amount');
  });

  it('rejects negative amount', () => {
    const result = applyLoanPure(makePlayer(), -1000, 5, 5, 'personal');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_amount');
  });

  it('rejects zero termYears (would otherwise produce NaN monthlyPayment)', () => {
    const result = applyLoanPure(makePlayer(), 50_000, 5, 0, 'personal');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_amount');
  });

  it('rejects negative termYears', () => {
    const result = applyLoanPure(makePlayer(), 50_000, 5, -5, 'personal');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_amount');
  });
});

describe('renovatePropertyPure', () => {
  const playerWithProperty = () => makePlayer({
    properties: [{ propertyId: 'p1', purchasePrice: 500_000, purchaseDate: '', currentValue: 500_000, isRented: false, monthlyRental: 2000, renovationLevel: 0 }],
  });

  it('rejects zero cost', () => {
    const result = renovatePropertyPure(playerWithProperty(), 0, 0);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_amount');
  });

  it('rejects negative cost (would otherwise be a money printer)', () => {
    const result = renovatePropertyPure(playerWithProperty(), 0, -1000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_amount');
  });

  it('rejects invalid property index', () => {
    const result = renovatePropertyPure(playerWithProperty(), 5, 10_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid_index');
  });

  it('rejects insufficient cash', () => {
    const player = { ...playerWithProperty(), cash: 100 };
    const result = renovatePropertyPure(player, 0, 50_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('insufficient_cash');
  });

  it('increments renovation level and boosts value/rental on success', () => {
    const result = renovatePropertyPure(playerWithProperty(), 0, 20_000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.player.properties[0].renovationLevel).toBe(1);
      expect(result.value.player.properties[0].currentValue).toBe(530_000);
      expect(result.value.player.properties[0].monthlyRental).toBe(2300);
      expect(result.value.player.cash).toBe(980_000);
    }
  });
});

describe('loanId uniqueness across buy → sell → buy in same turn', () => {
  it('does not collide when re-buying after sell', () => {
    let player = makePlayer({ cash: 1_000_000 });

    const r1 = buyPropertyPure(player, 'hdb-bto-1', 100_000);
    expect(r1.ok).toBe(true);
    if (!r1.ok) return;
    player = {
      ...r1.value.player,
      properties: r1.value.player.properties.map((property) => ({
        ...property,
        mopRemainingMonths: 0,
      })),
    };
    const firstLoanId = player.loans[0].id;

    const r2 = sellPropertyPure(player, 0);
    expect(r2.ok).toBe(true);
    if (!r2.ok) return;
    player = r2.value.player;

    const r3 = buyPropertyPure(player, 'hdb-bto-1', 100_000);
    expect(r3.ok).toBe(true);
    if (!r3.ok) return;
    player = r3.value.player;
    const secondLoanId = player.loans[player.loans.length - 1].id;

    expect(secondLoanId).not.toBe(firstLoanId);
  });
});

describe('buyPropertyPure stamp duty + LTV + MSR', () => {
  it('rejects when cash insufficient for downpayment + BSD + ABSD', () => {
    const player = makePlayer({
      cash: 200_000,
      properties: [{ propertyId: 'existing', purchasePrice: 0, purchaseDate: '', currentValue: 0, isRented: false, monthlyRental: 0, renovationLevel: 0 }],
    });
    const result = buyPropertyPure(player, 'hdb-bto-1', 200_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('insufficient_cash');
  });

  it('deducts stamp duty from cash on success', () => {
    const player = makePlayer({ cash: 1_000_000 });
    const result = buyPropertyPure(player, 'hdb-bto-1', 100_000);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.player.cash).toBe(894_000);
    }
  });

  it('rejects with ltv_exceeded reason when loan exceeds LTV cap on second property', () => {
    const player = makePlayer({
      cash: 5_000_000,
      loans: [{ id: 'm1', type: 'mortgage', principal: 0, remainingBalance: 100_000, interestRate: 2.5, monthlyPayment: 500, termYears: 30, startDate: '', isPaid: false }],
    });
    const result = buyPropertyPure(player, 'hdb-bto-1', 50_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('ltv_exceeded');
  });
});

describe('validatePurchase Singapore policy surfaces', () => {
  it('estimates resale levy on a second subsidized HDB purchase after first-home history', () => {
    const property = properties.find((candidate) => candidate.id === 'hdb-bto-1');
    if (!property) throw new Error('Expected HDB BTO fixture.');

    const validation = validatePurchase(
      makePlayer({ firstHomePurchased: true, usedSubsidizedHousing: true, cash: 200_000, salary: 6_500 }),
      property,
      95_000,
      'hdb-concessionary',
    );

    expect(validation.hdbResaleLevy).toBe(40_000);
    expect(validation.totalUpfront).toBe(141_000);
  });

  it('exposes the ABSD rate so second-property cards can show the explicit 20% charge', () => {
    const property = properties.find((candidate) => candidate.id === 'condo-10');
    if (!property) throw new Error('Expected condo fixture.');

    const validation = validatePurchase(
      makePlayer({
        cash: 2_000_000,
        properties: [{
          propertyId: 'hdb-bto-0',
          purchasePrice: 265_000,
          purchaseDate: '2024-01',
          currentValue: 265_000,
          isRented: false,
          monthlyRental: 1_300,
          renovationLevel: 0,
        }],
      }),
      property,
      500_000,
    );

    expect(validation.absdRate).toBe(0.2);
  });

  it('uses self-employed bank income haircuts for mortgage servicing checks', () => {
    const property = properties.find((candidate) => candidate.id === 'condo-10');
    if (!property) throw new Error('Expected condo fixture.');

    const stableEmployee = validatePurchase(
      makePlayer({ careerId: 'tech', salary: 6_000, cash: 2_000_000 }),
      property,
      property.price * 0.25,
    );
    const entrepreneur = validatePurchase(
      makePlayer({ careerId: 'entrepreneur', salary: 6_000, cash: 2_000_000 }),
      property,
      property.price * 0.25,
    );

    expect(stableEmployee.tdsrAllowed).toBe(true);
    expect(entrepreneur.tdsrAllowed).toBe(false);
    expect(entrepreneur.reasons.some((reason) => reason.code === 'tdsr_exceeded')).toBe(true);
  });
});

describe('resolveScenarioOption', () => {
  it('credits housing grants to CPF OA instead of spendable cash', () => {
    const resolution = resolveScenarioOption({
      label: 'Claim grant',
      description: 'First-home support is credited to CPF OA.',
      probability: 1,
      cashImpact: 0,
      cpfOrdinaryImpact: 40_000,
      propertyValueImpact: 0,
      creditImpact: 5,
      followUpText: 'Grant credited to CPF OA.',
    }, { next: () => 0 } as never);

    expect(resolution.success).toBe(true);
    expect(resolution.cashDelta).toBe(0);
    expect(resolution.cpfOrdinaryDelta).toBe(40_000);
  });
});
