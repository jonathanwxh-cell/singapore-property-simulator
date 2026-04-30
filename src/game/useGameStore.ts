import { create } from 'zustand';
import { careers } from '@/data/careers';
import { properties } from '@/data/properties';
import {
  CREDIT_DELTA_LOAN_PAID_OFF,
  CREDIT_DELTA_LOAN_PAYMENT,
  CREDIT_DELTA_LOAN_TAKEN,
  CREDIT_SCORE_FLOOR,
  DEFAULT_MORTGAGE_TERM_YEARS,
  SAVE_VERSION,
  TAKE_HOME_RATIO,
  TDSR_LIMIT,
} from '@/engine/constants';
import { calcMonthlyPayment, calcTDSR } from '@/engine/finance';
import { fail, ok, type ActionResult } from '@/engine/results';
import {
  selectMonthlyExpenses,
  selectMonthlyRentalIncome,
  selectNetWorth,
} from '@/engine/selectors';
import { advanceTurn } from '@/engine/turn';
import type { Difficulty, GameSettings, GameState, MarketState, OwnedProperty, Player } from './types';
import {
  difficultySettings,
  INITIAL_AGE,
  INITIAL_MONTH,
  INITIAL_YEAR,
  MAX_CREDIT_SCORE,
  MIN_CREDIT_SCORE,
} from './types';

interface GameStore extends GameState {
  newGame: (name: string, careerId: string, difficulty: Difficulty) => void;
  loadGame: (state: GameState) => void;
  nextTurn: () => void;
  buyProperty: (propertyId: string, downPayment: number) => ActionResult;
  sellProperty: (propertyIndex: number) => ActionResult;
  applyLoan: (amount: number, interestRate: number, termYears: number, type: 'mortgage' | 'renovation' | 'personal', propertyId?: string) => ActionResult;
  payLoan: (loanId: string, amount: number) => ActionResult;
  renovateProperty: (propertyIndex: number, cost: number) => ActionResult;
  toggleRental: (propertyIndex: number) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  addCash: (amount: number) => void;
  updateCreditScore: (delta: number) => void;
  applyPropertyValueImpact: (percentChange: number) => void;
  unlockAchievement: (achievementId: string) => void;
  setCurrentScenario: (scenarioId: string | null) => void;
  calculateNetWorth: () => number;
  getMonthlyIncome: () => number;
  getMonthlyExpenses: () => number;
}

function withNetWorth(player: Player): Player {
  return { ...player, totalNetWorth: selectNetWorth(player) };
}

function createInitialPlayer(name: string, careerId: string, difficulty: Difficulty): Player {
  const career = careers.find(c => c.id === careerId) || careers[0];
  const diff = difficultySettings[difficulty];
  const salary = Math.round(career.startingSalary * diff.salaryModifier);
  const player: Player = {
    name,
    age: INITIAL_AGE,
    careerId: career.id,
    salary,
    cash: diff.startingCash,
    cpfOrdinary: Math.round(diff.startingCash * 0.3),
    cpfSpecial: Math.round(diff.startingCash * 0.1),
    cpfMedisave: 20000,
    creditScore: 650,
    properties: [],
    loans: [],
    maritalStatus: 'single',
    children: 0,
    year: INITIAL_YEAR,
    month: INITIAL_MONTH,
    turnCount: 0,
    totalNetWorth: 0,
    achievements: [],
    difficulty,
    totalRentalIncome: 0,
    totalPropertySalesProfit: 0,
    bankruptcyStrikes: 0,
  };
  return withNetWorth(player);
}

function createInitialMarket(): MarketState {
  return {
    interestRate: 3.0,
    priceIndex: 100,
    rentalIndex: 100,
    volatility: 0.1,
    lastEvent: null,
  };
}

function createInitialSettings(difficulty: Difficulty): GameSettings {
  return {
    soundEnabled: true,
    musicEnabled: false,
    animationSpeed: 'normal',
    autoSave: true,
    difficulty,
  };
}

function saveTurn(state: GameState): void {
  try {
    localStorage.setItem('sgpt_autosave', JSON.stringify({ ...state, version: SAVE_VERSION }));
  } catch { /* storage unavailable */ }
}

export const useGameStore = create<GameStore>((set, get) => ({
  player: createInitialPlayer('Player', 'graduate', 'normal'),
  market: createInitialMarket(),
  settings: createInitialSettings('normal'),
  isGameActive: false,
  currentScenario: null,

  newGame: (name, careerId, difficulty) => {
    set({
      player: createInitialPlayer(name, careerId, difficulty),
      market: createInitialMarket(),
      settings: createInitialSettings(difficulty),
      isGameActive: true,
      currentScenario: null,
    });
  },

  loadGame: (state) => {
    set({
      player: withNetWorth(state.player),
      market: state.market,
      settings: state.settings,
      isGameActive: true,
      currentScenario: state.currentScenario,
    });
  },

  nextTurn: () => {
    const { player, market, settings } = get();
    const result = advanceTurn({ player, market, settings, rng: Math.random });
    const nextState = {
      player: result.player,
      market: result.market,
      settings,
      currentScenario: result.scenarioId,
      isGameActive: !result.gameOver,
    };
    set(nextState);
    if (settings.autoSave) saveTurn(nextState);
  },

  buyProperty: (propertyId, downPayment) => {
    const { player } = get();
    const property = properties.find(p => p.id === propertyId);
    if (!property) return fail('property_not_found', 'Property not found.');
    if (player.properties.some(p => p.propertyId === propertyId)) {
      return fail('already_owned', 'You already own this property.');
    }
    if (downPayment <= 0 || downPayment > property.price) {
      return fail('invalid_amount', 'Down payment must be between 1 and the property price.');
    }
    if (player.cash < downPayment) return fail('insufficient_cash', 'Not enough cash for the down payment.');

    const loanAmount = property.price - downPayment;
    const diff = difficultySettings[player.difficulty];
    const monthlyPayment = calcMonthlyPayment(loanAmount, diff.loanInterest, DEFAULT_MORTGAGE_TERM_YEARS);
    if (loanAmount > 0) {
      const tdsr = calcTDSR(selectMonthlyExpenses(player), monthlyPayment, player.salary);
      if (tdsr > TDSR_LIMIT) {
        return fail('tdsr_exceeded', `TDSR would be ${(tdsr * 100).toFixed(1)}%, exceeds ${TDSR_LIMIT * 100}% cap.`);
      }
      if (player.creditScore < CREDIT_SCORE_FLOOR) {
        return fail('credit_too_low', `Credit score ${player.creditScore} below minimum ${CREDIT_SCORE_FLOOR}.`);
      }
    }

    const loanId = loanAmount > 0 ? `loan_${Date.now()}` : undefined;
    const ownedProperty: OwnedProperty = {
      propertyId: property.id,
      purchasePrice: property.price,
      purchaseDate: `${player.year}-${String(player.month).padStart(2, '0')}`,
      currentValue: property.price,
      isRented: false,
      monthlyRental: Math.round(property.price * property.rentalYield / 100 / 12),
      renovationLevel: 0,
      loanId,
    };
    const newLoans = loanAmount > 0
      ? [
          ...player.loans,
          {
            id: loanId!,
            type: 'mortgage' as const,
            principal: loanAmount,
            remainingBalance: loanAmount,
            interestRate: diff.loanInterest,
            monthlyPayment,
            termYears: DEFAULT_MORTGAGE_TERM_YEARS,
            startDate: `${player.year}-${String(player.month).padStart(2, '0')}`,
            propertyId: property.id,
            isPaid: false,
          },
        ]
      : player.loans;
    set({ player: withNetWorth({ ...player, cash: player.cash - downPayment, properties: [...player.properties, ownedProperty], loans: newLoans }) });
    return ok(undefined);
  },

  sellProperty: (propertyIndex) => {
    const { player } = get();
    if (propertyIndex < 0 || propertyIndex >= player.properties.length) {
      return fail('invalid_index', 'Property index is invalid.');
    }
    const property = player.properties[propertyIndex];
    const saleValue = Math.round(property.currentValue);
    let outstandingLoan = 0;
    const loans = property.loanId
      ? player.loans.map(loan => {
          if (loan.id !== property.loanId) return loan;
          outstandingLoan = loan.remainingBalance;
          return { ...loan, remainingBalance: 0, isPaid: true };
        })
      : player.loans;
    const nextPlayer = {
      ...player,
      cash: player.cash + saleValue - outstandingLoan,
      properties: player.properties.filter((_, i) => i !== propertyIndex),
      loans,
      totalPropertySalesProfit: player.totalPropertySalesProfit + saleValue - property.purchasePrice,
    };
    set({ player: withNetWorth(nextPlayer) });
    return ok(undefined);
  },

  applyLoan: (amount, interestRate, termYears, type, propertyId) => {
    const { player } = get();
    if (amount <= 0 || termYears <= 0) return fail('invalid_amount', 'Loan amount and term must be positive.');
    const monthlyPayment = calcMonthlyPayment(amount, interestRate, termYears);
    const tdsr = calcTDSR(selectMonthlyExpenses(player), monthlyPayment, player.salary);
    if (tdsr > TDSR_LIMIT) {
      return fail('tdsr_exceeded', `TDSR would be ${(tdsr * 100).toFixed(1)}%, exceeds ${TDSR_LIMIT * 100}% cap.`);
    }
    if (player.creditScore < CREDIT_SCORE_FLOOR) {
      return fail('credit_too_low', `Credit score ${player.creditScore} below minimum ${CREDIT_SCORE_FLOOR}.`);
    }
    const loan = {
      id: `loan_${Date.now()}`,
      type,
      principal: amount,
      remainingBalance: amount,
      interestRate,
      monthlyPayment,
      termYears,
      startDate: `${player.year}-${String(player.month).padStart(2, '0')}`,
      propertyId,
      isPaid: false,
    };
    set({
      player: withNetWorth({
        ...player,
        cash: player.cash + amount,
        loans: [...player.loans, loan],
        creditScore: Math.max(MIN_CREDIT_SCORE, player.creditScore + CREDIT_DELTA_LOAN_TAKEN),
      }),
    });
    return ok(undefined);
  },

  payLoan: (loanId, amount) => {
    const { player } = get();
    const loan = player.loans.find(l => l.id === loanId);
    if (!loan) return fail('loan_not_found', 'Loan not found.');
    if (loan.isPaid) return fail('loan_already_paid', 'Loan is already paid off.');
    const actualPayment = Math.min(amount, loan.remainingBalance);
    if (actualPayment <= 0) return fail('invalid_amount', 'Payment must be positive.');
    if (player.cash < actualPayment) return fail('insufficient_cash', 'Not enough cash.');
    const newBalance = loan.remainingBalance - actualPayment;
    const isPaid = newBalance <= 0;
    set({
      player: withNetWorth({
        ...player,
        cash: player.cash - actualPayment,
        loans: player.loans.map(l => l.id === loanId ? { ...l, remainingBalance: newBalance, isPaid } : l),
        creditScore: Math.min(MAX_CREDIT_SCORE, player.creditScore + (isPaid ? CREDIT_DELTA_LOAN_PAID_OFF : CREDIT_DELTA_LOAN_PAYMENT)),
      }),
    });
    return ok(undefined);
  },

  renovateProperty: (propertyIndex, cost) => {
    const { player } = get();
    if (propertyIndex < 0 || propertyIndex >= player.properties.length) return fail('invalid_index', 'Property index is invalid.');
    if (cost <= 0) return fail('invalid_amount', 'Renovation cost must be positive.');
    if (player.cash < cost) return fail('insufficient_cash', 'Not enough cash for renovation.');
    const properties = player.properties.map((property, index) => index === propertyIndex
      ? {
          ...property,
          renovationLevel: property.renovationLevel + 1,
          currentValue: property.currentValue + cost * 1.5,
          monthlyRental: Math.round(property.monthlyRental * 1.15),
        }
      : property);
    set({ player: withNetWorth({ ...player, cash: player.cash - cost, properties }) });
    return ok(undefined);
  },

  toggleRental: (propertyIndex) => {
    const { player } = get();
    if (propertyIndex < 0 || propertyIndex >= player.properties.length) return;
    set({
      player: withNetWorth({
        ...player,
        properties: player.properties.map((property, index) => index === propertyIndex
          ? { ...property, isRented: !property.isRented }
          : property),
      }),
    });
  },

  updateSettings: (newSettings) => set(state => ({ settings: { ...state.settings, ...newSettings } })),
  addCash: (amount) => set(state => ({ player: withNetWorth({ ...state.player, cash: state.player.cash + amount }) })),
  updateCreditScore: (delta) => set(state => ({
    player: {
      ...state.player,
      creditScore: Math.max(MIN_CREDIT_SCORE, Math.min(MAX_CREDIT_SCORE, state.player.creditScore + delta)),
    },
  })),
  applyPropertyValueImpact: (percentChange) => set(state => ({
    player: withNetWorth({
      ...state.player,
      properties: state.player.properties.map(p => ({ ...p, currentValue: Math.round(p.currentValue * (1 + percentChange / 100)) })),
    }),
  })),
  unlockAchievement: (achievementId) => {
    const { player } = get();
    if (!player.achievements.includes(achievementId)) {
      set({ player: { ...player, achievements: [...player.achievements, achievementId] } });
    }
  },
  setCurrentScenario: (scenarioId) => set({ currentScenario: scenarioId }),
  calculateNetWorth: () => selectNetWorth(get().player),
  getMonthlyIncome: () => selectMonthlyRentalIncome(get().player) + get().player.salary * TAKE_HOME_RATIO,
  getMonthlyExpenses: () => selectMonthlyExpenses(get().player),
}));
