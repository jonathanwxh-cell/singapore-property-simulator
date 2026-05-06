import { create } from 'zustand';
import type { GameState, Difficulty, Player, LifeActionId, LivingArrangement, BuyerProfile, MortgageFinancingMode, RunRouteId } from './types';
import { createInitialLifeState, difficultySettings, MAX_CREDIT_SCORE, MIN_CREDIT_SCORE, normalizeBuyerProfile } from './types';
import { careers } from '@/data/careers';
import { properties } from '@/data/properties';
import { createRng, newSeed, type Rng } from '@/engine/rng';
import { advanceTurn } from '@/engine/turn';
import { buyPropertyPure, sellPropertyPure, applyLoanPure, payLoanPure, renovatePropertyPure, resolveScenarioOption } from '@/engine/actions';
import { selectNetWorth } from '@/engine/selectors';
import { estimateInitialCpf } from '@/engine/cpf';
import { withEvaluatedAchievements } from '@/engine/achievementRules';
import { normalizeOwnedProperty } from '@/engine/portfolio';
import { calculateHouseholdLoad, normalizeLifeState } from '@/engine/life';
import {
  createDefaultReserve,
  applyTenantLeaseDecisionPure,
  resolveMaintenanceIssuePure,
  setReservePlanPure,
  setTenantStrategyPure,
  startRenovationPure,
  type ReservePlanInput,
  type TenantStrategyInput,
} from '@/engine/propertyOperations';
import type { RepairChoiceId } from '@/data/maintenanceEvents';
import type { ScenarioOption } from '@/data/scenarios';
import type { ScenarioResolution } from '@/engine/actions';
import type { TenantLeaseDecisionId } from './types';
import type { ActionResult } from '@/engine/results';
import { writeAutoSave } from './savePersistence';
import { inferRunRouteId } from '@/engine/runDirector';

let rng: Rng = createRng(0);

function createInitialCareerProgressionProfile() {
  return {
    reviewCount: 0,
    lastOutcome: null,
    lastSalaryDelta: 0,
    lastBonus: 0,
  } as const;
}

function withCareerDefaults(player: Player): Player {
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

function withNetWorth(player: Player): Player {
  return { ...player, totalNetWorth: selectNetWorth(player) };
}

function withPortfolioDefaults(player: Player): Player {
  return {
    ...player,
    reserve: player.reserve ?? createDefaultReserve(),
    operationHistory: player.operationHistory ?? [],
    properties: player.properties.map(normalizeOwnedProperty),
  };
}

function withLifeDefaults(player: Player): Player {
  return {
    ...player,
    life: normalizeLifeState(player.life),
  };
}

function withBuyerProfileDefaults(player: Player): Player {
  return {
    ...player,
    buyerProfile: normalizeBuyerProfile(player.buyerProfile),
  };
}

function withRunRouteDefaults(player: Player): Player {
  return {
    ...player,
    runRouteId: inferRunRouteId(player),
  };
}

function finalizePlayer(player: Player): Player {
  const hydrated = withRunRouteDefaults(withBuyerProfileDefaults(withLifeDefaults(withPortfolioDefaults(withCareerDefaults(player)))));
  return withEvaluatedAchievements(withNetWorth(hydrated));
}

function createInitialPlayer(
  name: string,
  careerId: string,
  difficulty: Difficulty,
  buyerProfileInput?: Partial<BuyerProfile>,
  runRouteId?: RunRouteId,
): Player {
  const career = careers.find(c => c.id === careerId) || careers[0];
  const diff = difficultySettings[difficulty];
  const salary = Math.round(career.startingSalary * diff.salaryModifier);
  const buyerProfile = normalizeBuyerProfile(buyerProfileInput);
  const initialCpf = estimateInitialCpf(buyerProfile.age, salary);
  return finalizePlayer({
    name,
    age: buyerProfile.age,
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
    totalNetWorth: 0,
    achievements: [],
    difficulty,
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
    careerProgressionProfile: createInitialCareerProgressionProfile(),
    careerReviewHistory: [],
    buyerProfile,
    runRouteId,
    reserve: createDefaultReserve(),
    operationHistory: [],
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
    compactMode: false,
    largeTextMode: false,
    highContrastMode: false,
  };
}

function withHydratedSettings(settings: GameState['settings']): GameState['settings'] {
  return {
    ...createInitialSettings(settings.difficulty),
    ...settings,
    compactMode: settings.compactMode ?? false,
    largeTextMode: settings.largeTextMode ?? false,
    highContrastMode: settings.highContrastMode ?? false,
  };
}

function saveTurn(state: GameState) {
  try {
    writeAutoSave(state);
  } catch (error) {
    console.warn('Auto-save failed. Progress may not be preserved.', error);
  }
}

function pickGameState(state: GameState): GameState {
  return {
    player: state.player,
    market: state.market,
    settings: state.settings,
    isGameActive: state.isGameActive,
    currentScenario: state.currentScenario,
    rngSeed: state.rngSeed,
    rngState: state.rngState,
  };
}

interface GameStore extends GameState {
  newGame: (name: string, careerId: string, difficulty: Difficulty, buyerProfile?: Partial<BuyerProfile>, runRouteId?: RunRouteId) => void;
  loadGame: (state: GameState) => void;
  nextTurn: () => void;
  advanceMonths: (months: number) => void;
  setPrimaryLifeAction: (actionId: LifeActionId | null) => void;
  setSecondaryLifeAction: (actionId: LifeActionId | null) => void;
  setLivingArrangement: (arrangement: LivingArrangement) => void;
  buyProperty: (propertyId: string, downPayment: number, cpfOrdinaryUsed?: number, financingMode?: MortgageFinancingMode) => ActionResult;
  sellProperty: (propertyIndex: number) => ActionResult;
  applyLoan: (amount: number, interestRate: number, termYears: number, type: 'mortgage' | 'renovation' | 'personal', propertyId?: string) => ActionResult;
  payLoan: (loanId: string, amount: number) => ActionResult;
  renovateProperty: (propertyIndex: number, cost: number) => ActionResult;
  startRenovation: (propertyIndex: number, templateId: string) => ActionResult;
  setTenantStrategy: (propertyIndex: number, input: TenantStrategyInput) => ActionResult;
  applyTenantLeaseDecision: (propertyIndex: number, decisionId: TenantLeaseDecisionId) => ActionResult;
  resolveMaintenanceIssue: (propertyIndex: number, issueId: string, choiceId: RepairChoiceId) => ActionResult;
  setReservePlan: (input: ReservePlanInput) => ActionResult;
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

  newGame: (name, careerId, difficulty, buyerProfile, runRouteId) => {
    const seed = newSeed();
    rng = createRng(seed);
    set({
      player: createInitialPlayer(name, careerId, difficulty, buyerProfile, runRouteId),
      market: createInitialMarket(),
      settings: createInitialSettings(difficulty),
      isGameActive: true,
      currentScenario: null,
      rngSeed: seed,
      rngState: rng.getState(),
    });
    const state = get();
    if (state.settings.autoSave) saveTurn(pickGameState(state));
  },

  loadGame: (state) => {
    rng = createRng(state.rngSeed);
    rng.setState(state.rngState);
    set({
      ...state,
      market: withHydratedMarket(state.market),
      player: finalizePlayer(state.player),
      settings: withHydratedSettings(state.settings),
      isGameActive: true,
    });
  },

  nextTurn: () => {
    const { player, market, settings, currentScenario } = get();
    if (currentScenario) return;
    const result = advanceTurn({ player, market, settings, rng });
    const nextState = {
      player: finalizePlayer(result.player),
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

  advanceMonths: (months) => {
    const turnsToAdvance = Math.max(0, Math.floor(months));
    for (let i = 0; i < turnsToAdvance; i += 1) {
      const state = get();
      if (state.currentScenario || !state.isGameActive) return;
      get().nextTurn();
    }
  },

  setPrimaryLifeAction: (actionId) => {
    set((state) => ({
      player: finalizePlayer({
        ...state.player,
        life: {
          ...state.player.life,
          selectedPrimaryActionId: actionId,
          selectedSecondaryActionId: state.player.life.selectedSecondaryActionId === actionId
            ? null
            : state.player.life.selectedSecondaryActionId,
        },
      }),
    }));
  },

  setSecondaryLifeAction: (actionId) => {
    set((state) => ({
      player: finalizePlayer({
        ...state.player,
        life: {
          ...state.player.life,
          selectedSecondaryActionId: actionId === state.player.life.selectedPrimaryActionId ? null : actionId,
        },
      }),
    }));
  },

  setLivingArrangement: (arrangement) => {
    set((state) => ({
      player: finalizePlayer({
        ...state.player,
        life: {
          ...state.player.life,
          livingArrangement: arrangement,
          householdLoad: calculateHouseholdLoad({
            ...state.player.life,
            livingArrangement: arrangement,
          }),
        },
      }),
    }));
  },

  buyProperty: (propertyId, downPayment, cpfOrdinaryUsed = 0, financingMode = 'bank') => {
    const result = buyPropertyPure(get().player, propertyId, downPayment, cpfOrdinaryUsed, financingMode);
    if (result.ok) {
      set({ player: finalizePlayer(result.value.player) });
      const state = get();
      if (state.settings.autoSave) saveTurn(pickGameState(state));
    }
    return result.ok ? { ok: true as const, value: undefined } : result;
  },

  sellProperty: (propertyIndex) => {
    const result = sellPropertyPure(get().player, propertyIndex);
    if (result.ok) {
      set({ player: finalizePlayer(result.value.player) });
      const state = get();
      if (state.settings.autoSave) saveTurn(pickGameState(state));
    }
    return result.ok ? { ok: true as const, value: undefined } : result;
  },

  applyLoan: (amount, interestRate, termYears, type, propertyId) => {
    const result = applyLoanPure(get().player, amount, interestRate, termYears, type, propertyId);
    if (result.ok) {
      set({ player: finalizePlayer(result.value.player) });
      const state = get();
      if (state.settings.autoSave) saveTurn(pickGameState(state));
    }
    return result.ok ? { ok: true as const, value: undefined } : result;
  },

  payLoan: (loanId, amount) => {
    const result = payLoanPure(get().player, loanId, amount);
    if (result.ok) {
      set({ player: finalizePlayer(result.value.player) });
      const state = get();
      if (state.settings.autoSave) saveTurn(pickGameState(state));
    }
    return result.ok ? { ok: true as const, value: undefined } : result;
  },

  renovateProperty: (propertyIndex, cost) => {
    const result = renovatePropertyPure(get().player, propertyIndex, cost);
    if (result.ok) {
      set({ player: finalizePlayer(result.value.player) });
      const state = get();
      if (state.settings.autoSave) saveTurn(pickGameState(state));
    }
    return result.ok ? { ok: true as const, value: undefined } : result;
  },

  startRenovation: (propertyIndex, templateId) => {
    const result = startRenovationPure(get().player, propertyIndex, templateId);
    if (result.ok) {
      set({ player: finalizePlayer(result.value.player) });
      const state = get();
      if (state.settings.autoSave) saveTurn(pickGameState(state));
    }
    return result.ok ? { ok: true as const, value: undefined } : result;
  },

  setTenantStrategy: (propertyIndex, input) => {
    const result = setTenantStrategyPure(get().player, propertyIndex, input);
    if (result.ok) {
      set({ player: finalizePlayer(result.value.player) });
      const state = get();
      if (state.settings.autoSave) saveTurn(pickGameState(state));
    }
    return result.ok ? { ok: true as const, value: undefined } : result;
  },

  applyTenantLeaseDecision: (propertyIndex, decisionId) => {
    const result = applyTenantLeaseDecisionPure(get().player, propertyIndex, decisionId);
    if (result.ok) {
      set({ player: finalizePlayer(result.value.player) });
      const state = get();
      if (state.settings.autoSave) saveTurn(pickGameState(state));
    }
    return result.ok ? { ok: true as const, value: undefined } : result;
  },

  resolveMaintenanceIssue: (propertyIndex, issueId, choiceId) => {
    const result = resolveMaintenanceIssuePure(get().player, propertyIndex, issueId, choiceId);
    if (result.ok) {
      set({ player: finalizePlayer(result.value.player) });
      const state = get();
      if (state.settings.autoSave) saveTurn(pickGameState(state));
    }
    return result.ok ? { ok: true as const, value: undefined } : result;
  },

  setReservePlan: (input) => {
    const result = setReservePlanPure(get().player, input);
    if (result.ok) {
      set({ player: finalizePlayer(result.value.player) });
      const state = get();
      if (state.settings.autoSave) saveTurn(pickGameState(state));
    }
    return result.ok ? { ok: true as const, value: undefined } : result;
  },

  toggleRental: (propertyIndex) => {
    const { player } = get();
    if (propertyIndex < 0 || propertyIndex >= player.properties.length) return;
    const updatedProperties = [...player.properties];
    const ownedProperty = updatedProperties[propertyIndex];
    const listing = properties.find((property) => property.id === ownedProperty.propertyId);
    const blocksWholeFlatRental = listing?.isHdb
      && !ownedProperty.isRented
      && (ownedProperty.mopRemainingMonths ?? 0) > 0;
    if (blocksWholeFlatRental) return;
    const nextIsRented = !updatedProperties[propertyIndex].isRented;
    updatedProperties[propertyIndex] = {
      ...ownedProperty,
      isRented: nextIsRented,
      occupancyStatus: nextIsRented ? 'tenanted' : listing?.isHdb ? 'owner-occupied' : 'vacant',
      tenant: nextIsRented ? ownedProperty.tenant : undefined,
      vacancyMonths: nextIsRented ? 0 : ownedProperty.vacancyMonths ?? 0,
    };
    set({ player: finalizePlayer({ ...player, properties: updatedProperties }) });
    const state = get();
    if (state.settings.autoSave) saveTurn(pickGameState(state));
  },

  updateSettings: (newSettings) => {
    set(state => ({ settings: { ...state.settings, ...newSettings } }));
    const state = get();
    if (state.settings.autoSave) saveTurn(pickGameState(state));
  },

  unlockAchievement: (achievementId) => {
    const { player } = get();
    if (player.achievements.includes(achievementId)) return;
    set({ player: finalizePlayer({ ...player, achievements: [...player.achievements, achievementId] }) });
    const state = get();
    if (state.settings.autoSave) saveTurn(pickGameState(state));
  },

  setCurrentScenario: (scenarioId) => {
    set({ currentScenario: scenarioId });
    const state = get();
    if (state.settings.autoSave) saveTurn(pickGameState(state));
  },

  resolveScenario: (option) => {
    const resolution = resolveScenarioOption(option, rng);
    set(state => ({
      player: finalizePlayer({
        ...state.player,
        cash: state.player.cash + resolution.cashDelta,
        cpfOrdinary: state.player.cpfOrdinary + resolution.cpfOrdinaryDelta,
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
    const state = get();
    if (state.settings.autoSave) saveTurn(pickGameState(state));
    return resolution;
  },

  calculateNetWorth: () => selectNetWorth(get().player),
}));

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
