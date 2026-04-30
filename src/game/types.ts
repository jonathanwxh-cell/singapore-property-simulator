export type Difficulty = 'easy' | 'normal' | 'hard' | 'tycoon';
export type MaritalStatus = 'single' | 'married' | 'divorced';

export interface OwnedProperty {
  propertyId: string;
  purchasePrice: number;
  purchaseDate: string;
  currentValue: number;
  isRented: boolean;
  monthlyRental: number;
  renovationLevel: number;
  loanId?: string;
}

export interface Loan {
  id: string;
  type: 'mortgage' | 'renovation' | 'personal';
  principal: number;
  remainingBalance: number;
  interestRate: number;
  monthlyPayment: number;
  termYears: number;
  startDate: string;
  propertyId?: string;
  isPaid: boolean;
}

export interface Player {
  name: string;
  age: number;
  careerId: string;
  salary: number;
  cash: number;
  cpfOrdinary: number;
  cpfSpecial: number;
  cpfMedisave: number;
  creditScore: number;
  properties: OwnedProperty[];
  loans: Loan[];
  maritalStatus: MaritalStatus;
  children: number;
  year: number;
  month: number;
  turnCount: number;
  totalNetWorth: number;
  achievements: string[];
  difficulty: Difficulty;
  totalRentalIncome: number;
  totalPropertySalesProfit: number;
  bankruptcyStrikes: number;
}

export interface MarketState {
  interestRate: number;
  priceIndex: number;
  rentalIndex: number;
  volatility: number;
  lastEvent: string | null;
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  autoSave: boolean;
  difficulty: Difficulty;
}

export interface GameState {
  player: Player;
  market: MarketState;
  settings: GameSettings;
  isGameActive: boolean;
  currentScenario: string | null;
}

export interface SaveSlot {
  id: number;
  name: string;
  date: string;
  playerName: string;
  netWorth: number;
  turnCount: number;
  year: number;
  month: number;
  difficulty: Difficulty;
  data: string;
}

export const difficultySettings: Record<Difficulty, {
  startingCash: number;
  salaryModifier: number;
  marketVolatility: number;
  eventFrequency: number;
  loanInterest: number;
  targetNetWorth: number;
  label: string;
  description: string;
}> = {
  easy: {
    startingCash: 200000,
    salaryModifier: 1.5,
    marketVolatility: 0.08,
    eventFrequency: 12,
    loanInterest: 1.5,
    targetNetWorth: 5000000,
    label: 'Easy',
    description: 'Generous starting capital and steady growth. Perfect for beginners.',
  },
  normal: {
    startingCash: 50000,
    salaryModifier: 1.0,
    marketVolatility: 0.12,
    eventFrequency: 6,
    loanInterest: 2.5,
    targetNetWorth: 15000000,
    label: 'Normal',
    description: 'Balanced gameplay with realistic market conditions.',
  },
  hard: {
    startingCash: 10000,
    salaryModifier: 0.8,
    marketVolatility: 0.2,
    eventFrequency: 3,
    loanInterest: 3.5,
    targetNetWorth: 30000000,
    label: 'Hard',
    description: 'Tight budgets and volatile markets. For experienced players.',
  },
  tycoon: {
    startingCash: 0,
    salaryModifier: 0.6,
    marketVolatility: 0.25,
    eventFrequency: 1,
    loanInterest: 4.5,
    targetNetWorth: 50000000,
    label: 'Tycoon',
    description: 'Start from zero and build an empire. Only for the elite.',
  },
};

export const INITIAL_YEAR = 2024;
export const INITIAL_MONTH = 1;
export const INITIAL_AGE = 27;
export const MAX_CREDIT_SCORE = 850;
export const MIN_CREDIT_SCORE = 300;
