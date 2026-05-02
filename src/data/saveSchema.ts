import { z } from 'zod';
import { SAVE_VERSION } from '@/engine/constants';

const ownedPropertySchema = z.object({
  propertyId: z.string(),
  purchasePrice: z.number(),
  purchaseDate: z.string(),
  currentValue: z.number(),
  isRented: z.boolean(),
  monthlyRental: z.number(),
  renovationLevel: z.number(),
  loanId: z.string().optional(),
});

const loanSchema = z.object({
  id: z.string(),
  type: z.enum(['mortgage', 'renovation', 'personal']),
  principal: z.number(),
  remainingBalance: z.number(),
  interestRate: z.number(),
  monthlyPayment: z.number(),
  termYears: z.number(),
  startDate: z.string(),
  propertyId: z.string().optional(),
  isPaid: z.boolean(),
});

const playerSchema = z.object({
  name: z.string(),
  age: z.number(),
  careerId: z.string().optional(),
  career: z.string().optional(),
  salary: z.number(),
  cash: z.number(),
  cpfOrdinary: z.number(),
  cpfSpecial: z.number(),
  cpfMedisave: z.number(),
  creditScore: z.number(),
  properties: z.array(ownedPropertySchema),
  loans: z.array(loanSchema),
  maritalStatus: z.enum(['single', 'married', 'divorced']),
  children: z.number(),
  year: z.number(),
  month: z.number(),
  turnCount: z.number(),
  totalNetWorth: z.number(),
  achievements: z.array(z.string()),
  difficulty: z.enum(['easy', 'normal', 'hard', 'tycoon']),
  totalRentalIncome: z.number(),
  totalPropertySalesProfit: z.number(),
  bankruptcyStrikes: z.number().optional(),
});

export const saveSchema = z.object({
  version: z.literal(SAVE_VERSION),
  player: playerSchema,
  market: z.object({
    interestRate: z.number(),
    priceIndex: z.number(),
    rentalIndex: z.number(),
    volatility: z.number(),
    lastEvent: z.string().nullable(),
    monthlyPriceChangePct: z.number().optional(),
    monthlyRentalChangePct: z.number().optional(),
    monthlyInterestRateChangePct: z.number().optional(),
    lastHeadline: z.string().nullable().optional(),
    lastSummary: z.string().nullable().optional(),
    newsFeed: z.array(z.object({
      id: z.string(),
      turn: z.number(),
      month: z.number(),
      year: z.number(),
      headline: z.string(),
      detail: z.string(),
      category: z.enum(['Rates', 'Demand', 'Supply', 'Policy', 'Macro', 'Infrastructure']),
      tone: z.enum(['bullish', 'bearish', 'neutral']),
      priceChangePct: z.number(),
      rentalChangePct: z.number(),
      rateChangePct: z.number(),
    })).optional(),
  }),
  settings: z.object({
    soundEnabled: z.boolean(),
    musicEnabled: z.boolean(),
    animationSpeed: z.enum(['slow', 'normal', 'fast']),
    autoSave: z.boolean(),
    difficulty: z.enum(['easy', 'normal', 'hard', 'tycoon']),
  }),
  isGameActive: z.boolean(),
  currentScenario: z.string().nullable(),
  rngSeed: z.number(),
  rngState: z.number(),
});

export type ValidatedSave = z.infer<typeof saveSchema>;
