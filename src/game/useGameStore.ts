import { create } from 'zustand';
import type { GameState, Difficulty, Player } from './types';
import { difficultySettings, MAX_CREDIT_SCORE, MIN_CREDIT_SCORE } from './types';
import { careers } from '@/data/careers';
import { createRng, newSeed, type Rng } from '@/engine/rng';
import { advanceTurn } from '@/engine/turn';
import { buyPropertyPure, sellPropertyPure, applyLoanPure, payLoanPure, renovatePropertyPure, resolveScenarioOption } from '@/engine/actions';
import { deriveUnlockedAchievementIds } from '@/engine/achievements';
import { selectNetWorth } from '@/engine/selectors';
import { SAVE_VERSION } from '@/engine/constants';
import { estimateInitialCpf } from '@/engine/cpf';
import type { ScenarioOption } from '@/data/scenarios';
import type { ScenarioResolution } from '@/engine/actions';
import type { ActionResult } from '@/engine/results';

let rng: Rng = createRng(0);

function createInitialCareerProgressionProfile() {
  return {
    reviewCount: 0,
    lastOutcome: null,
    lastSalaryDelta: 0,
    lastBonus: 0,
  } as const;
}

function withHydratedPlayer(player: Player): Player {
  return {
    ...player,
    careerGrowthModifier: player.careerGrowthModifier ?? 1,
    careerRiskModifier: player.careerRiskModifier ?? 1,
    careerVolatilityModifier: player.careerVolatilityModifier ?? 0,
    lastCareerReviewTurn: player.lastCareerReviewTurn ?? 0,
    nextJobSwitchTurn: player.nextJobSwitchTurn ?? 24,
    firstHomePurchased: player.firstHomePurchased ?? false,
    ownedPrivateHome: player.ownedPrivateHome ?? false,
    careerProgressionProfile: player.careerProgressionProfile ?? createInitialCareerProgressionProfile(),
    careerReviewHistory: player.careerReviewHistory ?? [],
  };
}

function withDerivedPlayer(player: Player): Player {
  const hydrated = withHydratedPlayer(player);
  return {
    ...hydrated,
    totalNetWorth: selectNetWorth(hydrated),
    achievements: deriveUnlockedAchievementIds(hydrated),
  };
}

function createInitialPlayer(name: string, careerId: string, difficulty: Difficulty): Player {
  const career = careers.find(c => c.id === careerId) || careers[0];
  const diff = difficultySettings[difficulty];
  const salary = Math.round(career.startingSalary * diff.salaryModifier);
  const initialCpf = estimateInitialCpf(27, salary);
  return withDerivedPlayer({
    name,
    age: 27,
    careerId,
    salary,
    cash: diff.startingCash,
    cpfOrdinary: initialCpf.oa,
    cpfSpecial: initialCpf.sa,
    cpfMedisave: initialCpf.ma,
    creditScore: 650,
    properties: [],
    loans: [],
    maritalStatus: 'single',
    children: 0,
    year: 2024,
    month: 1,
    turnCount: 0,
    totalNetWorth: diff.startingCash,
    achievements: [],
    difficulty,
    totalRentalIncome: 0,
    totalPropertySalesProfit: 0,
    bankruptcyStrikes: 0,
    careerGrowthModifier: 1,
    careerRiskModifier: 1,
    careerVolatilityModifier: 0,
    lastCareerReviewTurn: 0,
    nextJobSwitchTurn: 24,
    firstHomePurchased: false,
    ownedPrivateHome: false,
    careerProgressionProfile: createInitialCareerProgressionProfile(),
    careerReviewHistory: [],
  });
}

function createInitialMarket() {
  return {
    interestRate: 3.0,
    priceIndex: 100,
    rentalIndex: 100,
    volatility: 0.1,
    lastEvent: null as string | null,
    monthlyPriceChangePct: 0,
    monthlyRentalChangePct: 0,
    monthlyInterestRateChangePct: 0,
    lastHeadline: 'The market opens with steady conditions and patient buyers.',
    lastSummary: 'Nothing dramatic yet. Watch grants, rates, and neighborhood supply for the next move.',
    newsFeed: [],
  };
}

function withHydratedMarket(state: GameState['market']): GameState['market'] {
  return {
    ...createInitialMarket(),
    ...state,
    newsFeed: state.newsFeed ?? [],
  };
}

function createInitialSettings(difficulty: Difficulty) {
  return {
    soundEnabled: true,
    musicEnabled: false,
    animationSpeed: 'normal' as const,
    autoSave: true,
    difficulty,
  };
}

function saveTurn(state: { player: Player } & Record<string, unknown>) {
  try {
    localStorage.setItem('sgpt_autosave', JSON.stringify({ ...state, version: SAVE_VERSION }));
  } catch { /* storage unavailable */ }
}

interface GameStore extends GameState {
  newGame: (name: string, careerId: string, difficulty: Difficulty) => void;
  loadGame: (state: GameState) => void;
  nextTurn: () => void;
  buyProperty: (propertyId: string, downPayment: number, cpfOrdinaryUsed?: number) => ActionResult;
  sellProperty: (propertyIndex: number) => ActionResult;
  applyLoan: (amount: number, interestRate: number, termYears: number, type: 'mortgage' | 'renovation' | 'personal', propertyId?: string) => ActionResult;
  payLoan: (loanId: string, amount: number) => ActionResult;
  renovateProperty: (propertyIndex: number, cost: number) => ActionResult;
  toggleRental: (propertyIndex: number) => void;
  updateSettings: (settings: Partial<GameState['settings']>) => void;
  unlockAchievement: (achievementId: string) => void;
  setCurrentScenario: (scenarioId: string | null) => void;
  resolveScenario: (option: ScenarioOption) => ScenarioResolution;
  calculateNetWorth: () => number;
}

export const useGameStore = create<GameStore>((set, get) => ({
  player: createInitialPlayer('Player', 'graduate', 'normal'),
  market: createInitialMarket(),
  settings: createInitialSettings('normal'),
  isGameActive: false,
  currentScenario: null,
  rngSeed: 0,
  rngState: 0,

  newGame: (name, careerId, difficulty) => {
    const seed = newSeed();
    rng = createRng(seed);
    set({
      player: createInitialPlayer(name, careerId, difficulty),
      market: createInitialMarket(),
      settings: createInitialSettings(difficulty),
      isGameActive: true,
      currentScenario: null,
      rngSeed: seed,
      rngState: rng.getState(),
    });
  },

  loadGame: (state) => {
    rng = createRng(state.rngSeed);
    rng.setState(state.rngState);
    set({ ...state, market: withHydratedMarket(state.market), player: withDerivedPlayer(state.player), isGameActive: true });
  },

  nextTurn: () => {
    const { player, market, settings, currentScenario } = get();
    if (currentScenario) return;
    const result = advanceTurn({ player, market, settings, rng });
    const nextState = {
      player: withDerivedPlayer(result.player),
      market: result.market,
      settings,
      currentScenario: result.scenarioId,
      isGameActive: !result.gameOver,
      rngSeed: get().rngSeed,
      rngState: rng.getState(),
    };
    set(nextState);
    if (settings.autoSave) saveTurn(nextState);
  },

  buyProperty: (propertyId, downPayment, cpfOrdinaryUsed = 0) => {
    const result = buyPropertyPure(get().player, propertyId, downPayment, cpfOrdinaryUsed);
    if (result.ok) set({ player: withDerivedPlayer(result.value.player) });
    return result.ok ? { ok: true as const, value: undefined } : result;
  },

  sellProperty: (propertyIndex) => {
    const result = sellPropertyPure(get().player, propertyIndex);
    if (result.ok) set({ player: withDerivedPlayer(result.value.player) });
    return result.ok ? { ok: true as const, value: undefined } : result;
  },

  applyLoan: (amount, interestRate, termYears, type, propertyId) => {
    const result = applyLoanPure(get().player, amount, interestRate, termYears, type, propertyId);
    if (result.ok) set({ player: withDerivedPlayer(result.value.player) });
    return result.ok ? { ok: true as const, value: undefined } : result;
  },

  payLoan: (loanId, amount) => {
    const result = payLoanPure(get().player, loanId, amount);
    if (result.ok) set({ player: withDerivedPlayer(result.value.player) });
    return result.ok ? { ok: true as const, value: undefined } : result;
  },

  renovateProperty: (propertyIndex, cost) => {
    const result = renovatePropertyPure(get().player, propertyIndex, cost);
    if (result.ok) set({ player: withDerivedPlayer(result.value.player) });
    return result.ok ? { ok: true as const, value: undefined } : result;
  },

  toggleRental: (propertyIndex) => {
    const { player } = get();
    if (propertyIndex < 0 || propertyIndex >= player.properties.length) return;
    const updatedProperties = [...player.properties];
    updatedProperties[propertyIndex] = { ...updatedProperties[propertyIndex], isRented: !updatedProperties[propertyIndex].isRented };
    set({ player: withDerivedPlayer({ ...player, properties: updatedProperties }) });
  },

  updateSettings: (newSettings) => {
    set(state => ({ settings: { ...state.settings, ...newSettings } }));
  },

  unlockAchievement: (achievementId) => {
    const { player } = get();
    if (player.achievements.includes(achievementId)) return;
    set({ player: withDerivedPlayer({ ...player, achievements: [...player.achievements, achievementId] }) });
  },

  setCurrentScenario: (scenarioId) => {
    set({ currentScenario: scenarioId });
  },

  resolveScenario: (option) => {
    const resolution = resolveScenarioOption(option, rng);
    set(state => ({
      player: withDerivedPlayer({
        ...state.player,
        cash: state.player.cash + resolution.cashDelta,
        salary: Math.max(1000, Math.round(state.player.salary * (1 + resolution.salaryDeltaPct))),
        creditScore: Math.max(MIN_CREDIT_SCORE, Math.min(MAX_CREDIT_SCORE, state.player.creditScore + resolution.creditDelta)),
        careerGrowthModifier: round2(Math.max(0.5, state.player.careerGrowthModifier + resolution.careerGrowthModifierDelta)),
        careerRiskModifier: round2(Math.max(0.5, state.player.careerRiskModifier + resolution.careerRiskModifierDelta)),
        careerVolatilityModifier: round2(state.player.careerVolatilityModifier + resolution.careerVolatilityModifierDelta),
        properties: resolution.propertyValueImpactPct === 0
          ? state.player.properties
          : state.player.properties.map(p => ({
              ...p,
              currentValue: Math.round(p.currentValue * (1 + resolution.propertyValueImpactPct / 100)),
            })),
      }),
      rngState: rng.getState(),
      currentScenario: null,
    }));
    return resolution;
  },

  calculateNetWorth: () => selectNetWorth(get().player),
}));

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
