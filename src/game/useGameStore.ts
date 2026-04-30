import { create } from 'zustand';
import type { GameState, Player, MarketState, GameSettings, Difficulty, OwnedProperty } from './types';
import { INITIAL_YEAR, INITIAL_MONTH, INITIAL_AGE, difficultySettings, MAX_CREDIT_SCORE } from './types';
import { careers } from '@/data/careers';
import { properties } from '@/data/properties';

interface GameStore extends GameState {
  // Actions
  newGame: (name: string, careerId: string, difficulty: Difficulty) => void;
  loadGame: (state: GameState) => void;
  nextTurn: () => void;
  buyProperty: (propertyId: string, downPayment: number) => boolean;
  sellProperty: (propertyIndex: number) => boolean;
  applyLoan: (amount: number, interestRate: number, termYears: number, type: 'mortgage' | 'renovation' | 'personal', propertyId?: string) => boolean;
  payLoan: (loanId: string, amount: number) => boolean;
  renovateProperty: (propertyIndex: number, cost: number) => boolean;
  toggleRental: (propertyIndex: number) => void;
  updateSettings: (settings: Partial<GameSettings>) => void;
  addCash: (amount: number) => void;
  updateCreditScore: (delta: number) => void;
  applyPropertyValueImpact: (percentChange: number) => void;
  unlockAchievement: (achievementId: string) => void;
  setCurrentScenario: (scenarioId: string | null) => void;
  pushScreen: (screen: string) => void;
  popScreen: () => void;
  calculateNetWorth: () => number;
  getMonthlyIncome: () => number;
  getMonthlyExpenses: () => number;
}

function createInitialPlayer(name: string, careerId: string, difficulty: Difficulty): Player {
  const career = careers.find(c => c.id === careerId) || careers[0];
  const diff = difficultySettings[difficulty];
  const salary = Math.round(career.startingSalary * diff.salaryModifier);

  return {
    name,
    age: INITIAL_AGE,
    career: career.name,
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
    totalNetWorth: diff.startingCash,
    achievements: [],
    difficulty,
    totalRentalIncome: 0,
    totalPropertySalesProfit: 0,
  };
}

function createInitialMarket(): MarketState {
  return {
    interestRate: 3.0,
    priceIndex: 100,
    rentalIndex: 100,
    volatility: 0.1,
    lastEvent: null,
    districtModifiers: {},
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

export const useGameStore = create<GameStore>((set, get) => ({
  player: createInitialPlayer('Player', 'graduate', 'normal'),
  market: createInitialMarket(),
  settings: createInitialSettings('normal'),
  isGameActive: false,
  currentScenario: null,
  screenHistory: [],

  newGame: (name, careerId, difficulty) => {
    const player = createInitialPlayer(name, careerId, difficulty);
    const market = createInitialMarket();
    const settings = createInitialSettings(difficulty);
    set({
      player,
      market,
      settings,
      isGameActive: true,
      currentScenario: null,
      screenHistory: ['dashboard'],
    });
  },

  loadGame: (state) => {
    set({
      ...state,
      isGameActive: true,
    });
  },

  nextTurn: () => {
    const { player, market, settings } = get();
    const diff = difficultySettings[player.difficulty];

    // Advance time
    let newMonth = player.month + 1;
    let newYear = player.year;
    let newAge = player.age;
    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
      newAge++;
    }

    // Salary income (after CPF)
    const cpfContribution = player.salary * 0.37;
    const cpfEmployee = player.salary * 0.2;
    const takeHomePay = player.salary - cpfEmployee;

    // Process rental income
    let rentalIncome = 0;
    const updatedProperties = player.properties.map(p => {
      if (p.isRented) {
        const income = p.monthlyRental;
        rentalIncome += income;
        return { ...p, currentValue: p.currentValue * (1 + (market.priceIndex / 100 - 1) * 0.02) };
      }
      return { ...p, currentValue: p.currentValue * (1 + (market.priceIndex / 100 - 1) * 0.02) };
    });

    // Process loan payments
    let totalLoanPayment = 0;
    const updatedLoans = player.loans.map(loan => {
      if (loan.isPaid) return loan;
      const newBalance = loan.remainingBalance - loan.monthlyPayment;
      totalLoanPayment += loan.monthlyPayment;
      if (newBalance <= 0) {
        return { ...loan, remainingBalance: 0, isPaid: true };
      }
      return { ...loan, remainingBalance: newBalance };
    });

    // Market changes
    const volChange = (Math.random() - 0.5) * 2 * diff.marketVolatility;
    const newPriceIndex = Math.max(60, Math.min(200, market.priceIndex * (1 + volChange * 0.1)));
    const newRentalIndex = Math.max(60, Math.min(200, market.rentalIndex * (1 + volChange * 0.05)));

    // Update property values based on market
    const finalProperties = updatedProperties.map(p => ({
      ...p,
      currentValue: p.currentValue * (1 + volChange * 0.05),
    }));

    const netCashChange = takeHomePay + rentalIncome - totalLoanPayment;
    const newCash = player.cash + netCashChange;
    const newCpfOrdinary = player.cpfOrdinary + cpfContribution * 0.65;

    // Check for random scenario
    let newScenario: string | null = null;
    if (player.turnCount % diff.eventFrequency === 0 && Math.random() > 0.3) {
      const categories = ['market-crash', 'property-boom', 'interest-rate-hike', 'job-promotion', 'tenant-default', 'good-tenant', 'new-mrt-line', 'new-shopping-mall'];
      newScenario = categories[Math.floor(Math.random() * categories.length)];
    }

    // Salary growth (annual)
    const career = careers.find(c => c.name === player.career) || careers[0];
    let newSalary = player.salary;
    if (newMonth === 1) {
      newSalary = Math.round(player.salary * (1 + career.growthRate * (0.5 + Math.random())));
    }

    const updatedPlayer = {
      ...player,
      age: newAge,
      salary: newSalary,
      cash: newCash,
      cpfOrdinary: newCpfOrdinary,
      properties: finalProperties,
      loans: updatedLoans,
      year: newYear,
      month: newMonth,
      turnCount: player.turnCount + 1,
      totalRentalIncome: player.totalRentalIncome + rentalIncome,
      totalNetWorth: newCash + finalProperties.reduce((sum, p) => sum + p.currentValue, 0),
    };

    set({
      player: updatedPlayer,
      market: {
        ...market,
        priceIndex: newPriceIndex,
        rentalIndex: newRentalIndex,
        interestRate: Math.max(0.5, Math.min(10, market.interestRate + (Math.random() - 0.5) * 0.5)),
        volatility: diff.marketVolatility,
        lastEvent: volChange > 0.05 ? 'boom' : volChange < -0.05 ? 'crash' : 'stable',
      },
      currentScenario: newScenario,
    });

    // Auto-save
    if (settings.autoSave) {
      const saveData = JSON.stringify({ player: updatedPlayer, market, settings });
      localStorage.setItem('sgpt_autosave', saveData);
    }
  },

  buyProperty: (propertyId, downPayment) => {
    const { player } = get();
    const property = properties.find(p => p.id === propertyId);
    if (!property) return false;
    if (player.cash < downPayment) return false;

    const loanAmount = property.price - downPayment;
    const monthlyRental = Math.round(property.price * property.rentalYield / 100 / 12);

    const ownedProperty: OwnedProperty = {
      propertyId: property.id,
      purchasePrice: property.price,
      purchaseDate: `${player.year}-${String(player.month).padStart(2, '0')}`,
      currentValue: property.price,
      isRented: false,
      monthlyRental,
      renovationLevel: 0,
    };

    const newLoans = [...player.loans];
    if (loanAmount > 0) {
      const diff = difficultySettings[player.difficulty];
      const monthlyPayment = loanAmount > 0
        ? Math.round(
            (loanAmount * (diff.loanInterest / 100 / 12)) /
            (1 - Math.pow(1 + diff.loanInterest / 100 / 12, -360))
          )
        : 0;
      const loan = {
        id: `loan_${Date.now()}`,
        type: 'mortgage' as const,
        principal: loanAmount,
        remainingBalance: loanAmount,
        interestRate: diff.loanInterest,
        monthlyPayment,
        termYears: 30,
        startDate: `${player.year}-${String(player.month).padStart(2, '0')}`,
        propertyId: property.id,
        isPaid: false,
      };
      newLoans.push(loan);
      ownedProperty.loanId = loan.id;
    }

    set({
      player: {
        ...player,
        cash: player.cash - downPayment,
        properties: [...player.properties, ownedProperty],
        loans: newLoans,
      },
    });
    return true;
  },

  sellProperty: (propertyIndex) => {
    const { player } = get();
    if (propertyIndex < 0 || propertyIndex >= player.properties.length) return false;

    const property = player.properties[propertyIndex];
    const saleValue = Math.round(property.currentValue);

    // Calculate outstanding loan balance to deduct from proceeds
    let outstandingLoan = 0;
    const updatedLoans = property.loanId
      ? player.loans.map(l => {
          if (l.id === property.loanId) {
            outstandingLoan = l.remainingBalance;
            return { ...l, isPaid: true, remainingBalance: 0 };
          }
          return l;
        })
      : player.loans;

    const netProceeds = saleValue - outstandingLoan;
    const profit = saleValue - property.purchasePrice - outstandingLoan;
    const newProperties = player.properties.filter((_, i) => i !== propertyIndex);

    set({
      player: {
        ...player,
        cash: player.cash + netProceeds,
        properties: newProperties,
        loans: updatedLoans,
        totalPropertySalesProfit: player.totalPropertySalesProfit + profit,
      },
    });
    return true;
  },

  applyLoan: (amount, interestRate, termYears, type, propertyId) => {
    const { player } = get();

    // TDSR check: total debt servicing must stay within 55% of monthly income
    if (type === 'personal') {
      const monthlyPayment = Math.round(
        (amount * (interestRate / 100 / 12)) /
        (1 - Math.pow(1 + interestRate / 100 / 12, -(termYears * 12)))
      );
      const existingPayments = player.loans
        .filter(l => !l.isPaid)
        .reduce((sum, l) => sum + l.monthlyPayment, 0);
      const monthlyIncome = player.salary;
      const newTDSR = (existingPayments + monthlyPayment) / monthlyIncome;
      if (newTDSR > 0.55) return false;
      if (player.creditScore < 400) return false;
    }

    const monthlyPayment = Math.round(
      (amount * (interestRate / 100 / 12)) /
      (1 - Math.pow(1 + interestRate / 100 / 12, -(termYears * 12)))
    );

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
      player: {
        ...player,
        cash: player.cash + amount,
        loans: [...player.loans, loan],
        creditScore: Math.max(300, player.creditScore - 5),
      },
    });
    return true;
  },

  payLoan: (loanId, amount) => {
    const { player } = get();
    if (player.cash < amount) return false;

    const loan = player.loans.find(l => l.id === loanId);
    if (!loan || loan.isPaid) return false;

    const newBalance = Math.max(0, loan.remainingBalance - amount);
    const isPaid = newBalance <= 0;

    set({
      player: {
        ...player,
        cash: player.cash - amount,
        loans: player.loans.map(l =>
          l.id === loanId ? { ...l, remainingBalance: newBalance, isPaid } : l
        ),
        creditScore: Math.min(MAX_CREDIT_SCORE, player.creditScore + (isPaid ? 20 : 5)),
      },
    });
    return true;
  },

  renovateProperty: (propertyIndex, cost) => {
    const { player } = get();
    if (player.cash < cost) return false;
    if (propertyIndex < 0 || propertyIndex >= player.properties.length) return false;

    const updatedProperties = [...player.properties];
    updatedProperties[propertyIndex] = {
      ...updatedProperties[propertyIndex],
      renovationLevel: updatedProperties[propertyIndex].renovationLevel + 1,
      currentValue: updatedProperties[propertyIndex].currentValue + cost * 1.5,
      monthlyRental: Math.round(updatedProperties[propertyIndex].monthlyRental * 1.15),
    };

    set({
      player: {
        ...player,
        cash: player.cash - cost,
        properties: updatedProperties,
      },
    });
    return true;
  },

  toggleRental: (propertyIndex) => {
    const { player } = get();
    if (propertyIndex < 0 || propertyIndex >= player.properties.length) return;

    const updatedProperties = [...player.properties];
    updatedProperties[propertyIndex] = {
      ...updatedProperties[propertyIndex],
      isRented: !updatedProperties[propertyIndex].isRented,
    };

    set({
      player: { ...player, properties: updatedProperties },
    });
  },

  updateSettings: (newSettings) => {
    set(state => ({
      settings: { ...state.settings, ...newSettings },
    }));
  },

  addCash: (amount) => {
    set(state => ({
      player: { ...state.player, cash: state.player.cash + amount },
    }));
  },

  updateCreditScore: (delta) => {
    set(state => ({
      player: {
        ...state.player,
        creditScore: Math.max(300, Math.min(850, state.player.creditScore + delta)),
      },
    }));
  },

  applyPropertyValueImpact: (percentChange) => {
    set(state => ({
      player: {
        ...state.player,
        properties: state.player.properties.map(p => ({
          ...p,
          currentValue: Math.round(p.currentValue * (1 + percentChange / 100)),
        })),
      },
    }));
  },

  unlockAchievement: (achievementId) => {
    const { player } = get();
    if (player.achievements.includes(achievementId)) return;
    set({
      player: {
        ...player,
        achievements: [...player.achievements, achievementId],
      },
    });
  },

  setCurrentScenario: (scenarioId) => {
    set({ currentScenario: scenarioId });
  },

  pushScreen: (screen) => {
    set(state => ({
      screenHistory: [...state.screenHistory, screen],
    }));
  },

  popScreen: () => {
    set(state => ({
      screenHistory: state.screenHistory.slice(0, -1),
    }));
  },

  calculateNetWorth: () => {
    const { player } = get();
    const propertyValue = player.properties.reduce((sum, p) => sum + p.currentValue, 0);
    return player.cash + propertyValue + player.cpfOrdinary + player.cpfSpecial;
  },

  getMonthlyIncome: () => {
    const { player } = get();
    const rentalIncome = player.properties
      .filter(p => p.isRented)
      .reduce((sum, p) => sum + p.monthlyRental, 0);
    return player.salary * 0.8 + rentalIncome;
  },

  getMonthlyExpenses: () => {
    const { player } = get();
    return player.loans
      .filter(l => !l.isPaid)
      .reduce((sum, l) => sum + l.monthlyPayment, 0);
  },
}));
