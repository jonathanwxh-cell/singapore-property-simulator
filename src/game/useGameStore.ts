import { create } from 'zustand';
import type { GameState, Difficulty, Player, LifeActionId, LivingArrangement, BuyerProfile, MortgageFinancingMode, RenovationContractorTier, RunRouteId, MaritalStatus } from './types';
import { createInitialLifeState, difficultySettings, MAX_CREDIT_SCORE, MIN_CREDIT_SCORE, normalizeBuyerProfile } from './types';
import { careers } from '@/data/careers';
import { properties } from '@/data/properties';
import { createRng, newSeed } from '@/engine/rng';
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
import { scenarios } from '@/data/scenarios';
import type { ScenarioOption } from '@/data/scenarios';
import type { ScenarioResolution } from '@/engine/actions';
import { achievements } from '@/data/achievements';
import { HDB_MOP_NOTABLE_MILESTONES, PROPERTY_VALUE_FLOOR } from '@/engine/constants';
import type { TenantLeaseDecisionId } from './types';
import type { ActionResult } from '@/engine/results';
import { writeAutoSave } from './savePersistence';
import { inferRunRouteId } from '@/engine/runDirector';
import { getNextHomePlan } from '@/engine/nextHomePlan';
import { getMonthlyIntentOptions, type MonthlyIntentOption } from '@/engine/monthlyIntents';
import { getOwnershipBeatState } from '@/engine/ownershipMoments';
import { getOwnershipPayoffState } from '@/engine/ownershipPayoffs';
import { getOwnershipCampaign, getOwnershipTrackTierKey } from '@/engine/ownershipCampaign';
import { getOwnershipTargetRace } from '@/engine/ownershipTargets';
import {
  canToggleNextHomeShortlist,
  toggleShortlistIds,
  type OwnershipForkOption,
} from '@/engine/ownershipForks';

// RNG ownership: the deterministic RNG state lives in the store as
// `rngSeed` / `rngState`. Each action that consumes randomness rebuilds the
// Rng locally from those fields, advances it, and snapshots the new state
// back. This removes the previous module-level `let rng` singleton, which
// would have leaked across hot-reloads and parallel test instances.
function restoreRng(seed: number, state: number) {
  const rng = createRng(seed);
  rng.setState(state);
  return rng;
}

function createInitialCareerProgressionProfile() {
  return {
    reviewCount: 0,
    lastOutcome: null,
    lastSalaryDelta: 0,
    lastBonus: 0,
  } as const;
}

function createInitialLifeStateForBuyerProfile(profile: BuyerProfile) {
  const base = createInitialLifeState();
  if (profile.householdProfile === 'single-parent') {
    return { ...base, householdLoad: 1_850, householdSupport: 45, stress: 28 };
  }
  if (profile.householdProfile === 'multi-gen-family') {
    return { ...base, householdLoad: 2_650, householdSupport: 55, stress: 32 };
  }
  if (profile.householdProfile === 'domestic-partners') {
    return { ...base, householdLoad: 1_250, livingArrangement: 'renting-room' as const };
  }
  return base;
}

function getInitialChildrenForBuyerProfile(profile: BuyerProfile): number {
  if (profile.householdProfile === 'single-parent') return 1;
  if (profile.householdProfile === 'multi-gen-family') return 2;
  return 0;
}

function getInitialMaritalStatusForBuyerProfile(profile: BuyerProfile): MaritalStatus {
  if (profile.householdProfile === 'couple-family' || profile.householdProfile === 'multi-gen-family') return 'married';
  if (profile.householdProfile === 'single-parent') return 'divorced';
  return 'single';
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
  const ownsSubsidizedHousing = player.properties.some((owned) => {
    const property = properties.find((candidate) => candidate.id === owned.propertyId);
    return property?.type === 'HDB BTO' || property?.type === 'Executive Condo';
  });

  return {
    ...player,
    usedSubsidizedHousing: player.usedSubsidizedHousing ?? ownsSubsidizedHousing,
    reserve: player.reserve ?? createDefaultReserve(),
    operationHistory: player.operationHistory ?? [],
    pendingTaxReliefs: player.pendingTaxReliefs ?? [],
    nextHomeShortlistIds: (player.nextHomeShortlistIds ?? []).slice(0, 3),
    properties: player.properties.map((owned) => {
      const listing = properties.find(p => p.id === owned.propertyId);
      const mopActive = listing?.isHdb && (owned.mopRemainingMonths ?? 0) > 0;
      return {
        ...normalizeOwnedProperty(owned),
        currentValue: Math.max(PROPERTY_VALUE_FLOOR, owned.currentValue),
        isRented: mopActive ? false : owned.isRented,
        occupancyStatus: (mopActive && owned.isRented) ? 'owner-occupied' as const : owned.occupancyStatus,
      };
    }),
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
    maritalStatus: getInitialMaritalStatusForBuyerProfile(buyerProfile),
    children: getInitialChildrenForBuyerProfile(buyerProfile),
    year: 2024,
    month: 1,
    turnCount: 0,
    totalNetWorth: 0,
    achievements: [],
    difficulty,
    totalRentalIncome: 0,
    totalPropertySalesProfit: 0,
    bankruptcyStrikes: 0,
    life: createInitialLifeStateForBuyerProfile(buyerProfile),
    careerGrowthModifier: 1,
    careerRiskModifier: 1,
    careerVolatilityModifier: 0,
    lastCareerReviewTurn: 0,
    nextJobSwitchTurn: 24,
    firstHomePurchased: false,
    ownedPrivateHome: false,
    usedSubsidizedHousing: false,
    careerProgressionProfile: createInitialCareerProgressionProfile(),
    careerReviewHistory: [],
    buyerProfile,
    runRouteId,
    reserve: createDefaultReserve(),
    operationHistory: [],
    pendingTaxReliefs: [],
    nextHomeShortlistIds: [],
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
    guidedMode: true,
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
    guidedMode: settings.guidedMode ?? true,
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

function withMonthlyIntentSelection(player: Player, intent: Pick<MonthlyIntentOption, 'id' | 'label' | 'track'> | null): Player {
  return {
    ...player,
    life: {
      ...player.life,
      selectedMonthlyIntentId: intent?.id ?? null,
      selectedMonthlyIntentLabel: intent?.label ?? null,
      selectedMonthlyIntentTrack: intent?.track ?? null,
    },
  };
}

function withOwnershipForkSelection(player: Player, fork: Pick<OwnershipForkOption, 'id' | 'title'> | null): Player {
  return {
    ...player,
    life: {
      ...player.life,
      selectedOwnershipForkId: fork?.id ?? null,
      selectedOwnershipForkLabel: fork?.title ?? null,
    },
  };
}

function getPrimaryOwnedPropertyIndex(player: Player): number {
  const activeMopIndex = player.properties.findIndex((property) => (property.mopRemainingMonths ?? 0) > 0);
  if (activeMopIndex >= 0) return activeMopIndex;
  return player.properties.length > 0 ? 0 : -1;
}

function applyMonthlyIntentAutoAction(player: Player, intent: MonthlyIntentOption): Player {
  switch (intent.autoActionId) {
    case 'start-room-rental': {
      const propertyIndex = getPrimaryOwnedPropertyIndex(player);
      if (propertyIndex < 0 || player.properties[propertyIndex].tenant) return player;
      const roomRental = setTenantStrategyPure(player, propertyIndex, {
        mode: 'room-rental',
        profileId: 'local-family',
        rentStrategy: 'market',
      });
      return roomRental.ok ? roomRental.value.player : player;
    }
    case 'start-flooring-refresh': {
      const propertyIndex = getPrimaryOwnedPropertyIndex(player);
      if (propertyIndex < 0) return player;
      const property = player.properties[propertyIndex];
      if (!property.activeRenovation && !(property.completedRenovations ?? []).includes('flooring')) {
        const renovation = startRenovationPure(player, propertyIndex, 'flooring-paint');
        if (renovation.ok) return renovation.value.player;
      }

      if ((player.reserve?.allocatedCash ?? 0) < 5_000 && player.cash >= 5_000) {
        const reserve = setReservePlanPure(player, {
          targetMonths: Math.max(3, player.reserve?.targetMonths ?? 3),
          allocatedCash: 5_000,
          autoTopUpPct: player.reserve?.autoTopUpPct ?? 0,
        });
        if (reserve.ok) return reserve.value.player;
      }
      return player;
    }
    case 'top-up-reserve-5k': {
      if ((player.reserve?.allocatedCash ?? 0) >= 5_000 || player.cash < 5_000) return player;
      const reserve = setReservePlanPure(player, {
        targetMonths: Math.max(3, player.reserve?.targetMonths ?? 3),
        allocatedCash: 5_000,
        autoTopUpPct: player.reserve?.autoTopUpPct ?? 0,
      });
      return reserve.ok ? reserve.value.player : player;
    }
    default:
      return player;
  }
}

function getNotableMonthSnapshot(player: Player) {
  const nextHomePlan = getNextHomePlan(player);
  const ownershipCampaign = getOwnershipCampaign(player);
  const ownershipBeatState = getOwnershipBeatState(player);
  const ownershipTargetRace = getOwnershipTargetRace(player);
  const ownershipPayoffState = getOwnershipPayoffState(player);
  const openIssueCount = player.properties.reduce((sum, property) => sum + (property.openMaintenanceIssues?.length ?? 0), 0);
  const activeRenovationCount = player.properties.filter((property) => property.activeRenovation).length;
  const completedRenovationCount = player.properties.reduce((sum, property) => sum + (property.completedRenovations?.length ?? 0), 0);
  const tenantCount = player.properties.filter((property) => property.tenant).length;
  const expiringLeaseCount = player.properties.filter((property) => {
    const leaseEndTurn = property.tenant?.leaseEndTurn;
    return typeof leaseEndTurn === 'number' && leaseEndTurn - player.turnCount <= 2;
  }).length;

  return {
    bottleneck: nextHomePlan.bottleneck,
    focus: nextHomePlan.recommendedFocusId,
    openIssueCount,
    activeRenovationCount,
    completedRenovationCount,
    tenantCount,
    expiringLeaseCount,
    mopMonthsRemaining: nextHomePlan.mopMonthsRemaining,
    ownershipChapterId: ownershipCampaign.activeChapter?.id ?? null,
    ownershipTrackTierKey: getOwnershipTrackTierKey(player),
    ownershipBeatKey: ownershipBeatState.notableKey,
    ownershipTargetKey: ownershipTargetRace.notableKey,
    ownershipPayoffKey: ownershipPayoffState.notableKey,
  };
}

function isNotableMonthSignal(previous: ReturnType<typeof getNotableMonthSnapshot>, next: ReturnType<typeof getNotableMonthSnapshot>) {
  if (previous.bottleneck !== next.bottleneck) return true;
  if (previous.focus !== next.focus) return true;
  if (previous.openIssueCount !== next.openIssueCount) return true;
  if (previous.activeRenovationCount !== next.activeRenovationCount) return true;
  if (previous.completedRenovationCount !== next.completedRenovationCount) return true;
  if (previous.tenantCount !== next.tenantCount) return true;
  if (previous.expiringLeaseCount !== next.expiringLeaseCount) return true;
  if (previous.ownershipChapterId !== next.ownershipChapterId) return true;
  if (previous.ownershipTrackTierKey !== next.ownershipTrackTierKey) return true;
  if (previous.ownershipBeatKey !== next.ownershipBeatKey) return true;
  if (previous.ownershipTargetKey !== next.ownershipTargetKey) return true;
  if (previous.ownershipPayoffKey !== next.ownershipPayoffKey) return true;
  return hasCrossedMopMilestone(previous.mopMonthsRemaining, next.mopMonthsRemaining);
}

function hasCrossedMopMilestone(previous: number, next: number): boolean {
  return HDB_MOP_NOTABLE_MILESTONES.some((milestone) => previous > milestone && next <= milestone);
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

// Shared wrapper for player-mutating actions: every store action that ran a
// pure `*Pure(player, ...)` engine function used to repeat the same finalize +
// auto-save dance, with subtly different copies. Centralising it here keeps
// each store method to a single line and guarantees the dance stays in sync.
type StoreSet = (
  partial: Partial<GameStore> | ((state: GameStore) => Partial<GameStore>),
) => void;
type StoreGet = () => GameStore;

function runPlayerAction(
  set: StoreSet,
  get: StoreGet,
  result: ActionResult<{ player: Player }>,
): ActionResult {
  if (!result.ok) return result;
  set({ player: finalizePlayer(result.value.player) });
  const state = get();
  if (state.settings.autoSave) saveTurn(pickGameState(state));
  return { ok: true as const, value: undefined };
}

interface GameStore extends GameState {
  newGame: (
    name: string,
    careerId: string,
    difficulty: Difficulty,
    buyerProfile?: Partial<BuyerProfile>,
    runRouteId?: RunRouteId,
    options?: { guidedMode?: boolean },
  ) => void;
  loadGame: (state: GameState) => void;
  nextTurn: () => void;
  advanceMonths: (months: number) => void;
  advanceToNextNotableMonth: (maxMonths?: number) => void;
  setPrimaryLifeAction: (actionId: LifeActionId | null) => void;
  setSecondaryLifeAction: (actionId: LifeActionId | null) => void;
  applyMonthlyIntent: (intent: MonthlyIntentOption) => void;
  prepareMonthlyIntent: (intent: MonthlyIntentOption) => void;
  applyOwnershipFork: (fork: OwnershipForkOption) => void;
  toggleNextHomeShortlist: (propertyId: string) => void;
  setLivingArrangement: (arrangement: LivingArrangement) => void;
  buyProperty: (propertyId: string, downPayment: number, cpfOrdinaryUsed?: number, financingMode?: MortgageFinancingMode) => ActionResult;
  sellProperty: (propertyIndex: number) => ActionResult;
  applyLoan: (amount: number, interestRate: number, termYears: number, type: 'mortgage' | 'renovation' | 'personal', propertyId?: string) => ActionResult;
  payLoan: (loanId: string, amount: number) => ActionResult;
  renovateProperty: (propertyIndex: number, cost: number) => ActionResult;
  startRenovation: (propertyIndex: number, templateId: string, contractorTier?: RenovationContractorTier) => ActionResult;
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

  newGame: (name, careerId, difficulty, buyerProfile, runRouteId, options) => {
    const guidedMode = options?.guidedMode ?? true;
    const seed = newSeed();
    const rng = createRng(seed);
    set({
      player: createInitialPlayer(name, careerId, difficulty, buyerProfile, runRouteId),
      market: createInitialMarket(),
      settings: {
        ...createInitialSettings(difficulty),
        guidedMode,
      },
      isGameActive: true,
      currentScenario: null,
      rngSeed: seed,
      rngState: rng.getState(),
    });
    const state = get();
    if (state.settings.autoSave) saveTurn(pickGameState(state));
  },

  loadGame: (state) => {
    const validScenario = state.currentScenario !== null && scenarios.some(s => s.id === state.currentScenario)
      ? state.currentScenario
      : null;
    set({
      ...state,
      market: withHydratedMarket(state.market),
      player: finalizePlayer(state.player),
      settings: withHydratedSettings(state.settings),
      isGameActive: true,
      currentScenario: validScenario,
    });
  },

  nextTurn: () => {
    const { player, market, settings, currentScenario, rngSeed, rngState } = get();
    if (currentScenario) return;
    const rng = restoreRng(rngSeed, rngState);
    const result = advanceTurn({ player, market, settings, rng });
    const nextState = {
      player: finalizePlayer(result.player),
      market: result.market,
      settings,
      currentScenario: result.scenarioId,
      isGameActive: !result.gameOver,
      rngSeed,
      rngState: rng.getState(),
    };
    set(nextState);
    if (settings.autoSave) saveTurn(nextState);
  },

  advanceMonths: (months) => {
    const turnsToAdvance = Math.max(0, Math.min(12, Math.floor(months)));
    for (let i = 0; i < turnsToAdvance; i += 1) {
      const state = get();
      if (state.currentScenario || !state.isGameActive) return;
      get().nextTurn();
    }
  },

  advanceToNextNotableMonth: (maxMonths = 6) => {
    const cap = Math.max(1, Math.min(12, Math.floor(maxMonths)));
    const previousState = get();
    if (previousState.currentScenario || !previousState.isGameActive) return;
    let previousSnapshot = getNotableMonthSnapshot(previousState.player);

    for (let month = 0; month < cap; month += 1) {
      const stateBeforeAdvance = get();
      if (stateBeforeAdvance.currentScenario || !stateBeforeAdvance.isGameActive) return;
      get().nextTurn();
      const stateAfterAdvance = get();
      if (stateAfterAdvance.currentScenario || !stateAfterAdvance.isGameActive) return;
      const nextSnapshot = getNotableMonthSnapshot(stateAfterAdvance.player);
      if (isNotableMonthSignal(previousSnapshot, nextSnapshot)) return;
      previousSnapshot = nextSnapshot;
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

  applyMonthlyIntent: (intent) => {
    const state = get();
    if (state.currentScenario || !state.isGameActive) return;
    set((current) => {
      const preparedPlayer = withMonthlyIntentSelection({
        ...current.player,
        life: {
          ...current.player.life,
          selectedPrimaryActionId: intent.primaryActionId,
          selectedSecondaryActionId: intent.secondaryActionId,
        },
      }, intent);
      return { player: finalizePlayer(applyMonthlyIntentAutoAction(preparedPlayer, intent)) };
    });
    get().advanceMonths(1);
  },

  applyOwnershipFork: (fork) => {
    set((state) => {
      const intent = getMonthlyIntentOptions(state.player).find((option) => option.id === fork.intentId);
      if (!intent) return {};

      const preparedPlayer = withOwnershipForkSelection(withMonthlyIntentSelection({
        ...state.player,
        life: {
          ...state.player.life,
          selectedPrimaryActionId: intent.primaryActionId,
          selectedSecondaryActionId: intent.secondaryActionId,
        },
      }, intent), fork);

      return {
        player: finalizePlayer(applyMonthlyIntentAutoAction(preparedPlayer, intent)),
      };
    });
    get().advanceMonths(1);
  },

  prepareMonthlyIntent: (intent) => {
    set((state) => ({
      player: finalizePlayer(withMonthlyIntentSelection({
        ...state.player,
        life: {
          ...state.player.life,
          selectedPrimaryActionId: intent.primaryActionId,
          selectedSecondaryActionId: intent.secondaryActionId,
        },
      }, intent)),
    }));
  },

  toggleNextHomeShortlist: (propertyId) => {
    set((state) => {
      const permission = canToggleNextHomeShortlist(state.player, propertyId);
      if (!permission.allowed) return {};

      return {
        player: finalizePlayer({
          ...state.player,
          nextHomeShortlistIds: toggleShortlistIds(state.player.nextHomeShortlistIds, propertyId),
        }),
      };
    });
    const state = get();
    if (state.settings.autoSave) saveTurn(pickGameState(state));
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

  buyProperty: (propertyId, downPayment, cpfOrdinaryUsed = 0, financingMode = 'bank') =>
    runPlayerAction(set, get, buyPropertyPure(get().player, propertyId, downPayment, cpfOrdinaryUsed, financingMode)),

  sellProperty: (propertyIndex) =>
    runPlayerAction(set, get, sellPropertyPure(get().player, propertyIndex)),

  applyLoan: (amount, interestRate, termYears, type, propertyId) =>
    runPlayerAction(set, get, applyLoanPure(get().player, amount, interestRate, termYears, type, propertyId)),

  payLoan: (loanId, amount) =>
    runPlayerAction(set, get, payLoanPure(get().player, loanId, amount)),

  renovateProperty: (propertyIndex, cost) =>
    runPlayerAction(set, get, renovatePropertyPure(get().player, propertyIndex, cost)),

  startRenovation: (propertyIndex, templateId, contractorTier = 'standard') =>
    runPlayerAction(set, get, startRenovationPure(get().player, propertyIndex, templateId, contractorTier)),

  setTenantStrategy: (propertyIndex, input) =>
    runPlayerAction(set, get, setTenantStrategyPure(get().player, propertyIndex, input)),

  applyTenantLeaseDecision: (propertyIndex, decisionId) =>
    runPlayerAction(set, get, applyTenantLeaseDecisionPure(get().player, propertyIndex, decisionId)),

  resolveMaintenanceIssue: (propertyIndex, issueId, choiceId) =>
    runPlayerAction(set, get, resolveMaintenanceIssuePure(get().player, propertyIndex, issueId, choiceId)),

  setReservePlan: (input) =>
    runPlayerAction(set, get, setReservePlanPure(get().player, input)),

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
    if (!achievements.some(a => a.id === achievementId)) return;
    const { player } = get();
    if (player.achievements.includes(achievementId)) return;
    set({ player: finalizePlayer({ ...player, achievements: [...player.achievements, achievementId] }) });
    const state = get();
    if (state.settings.autoSave) saveTurn(pickGameState(state));
  },

  setCurrentScenario: (scenarioId) => {
    if (scenarioId !== null && !scenarios.some(s => s.id === scenarioId)) return;
    set({ currentScenario: scenarioId });
    const state = get();
    if (state.settings.autoSave) saveTurn(pickGameState(state));
  },

  resolveScenario: (option) => {
    const { rngSeed, rngState } = get();
    const rng = restoreRng(rngSeed, rngState);
    const resolution = resolveScenarioOption(option, rng);
    set(state => ({
      player: finalizePlayer({
        ...state.player,
        cash: state.player.cash + resolution.cashDelta,
        cpfOrdinary: state.player.cpfOrdinary + resolution.cpfOrdinaryDelta,
        salary: Math.max(1000, Math.min(500_000, Math.round(state.player.salary * (1 + resolution.salaryDeltaPct)))),
        creditScore: Math.max(MIN_CREDIT_SCORE, Math.min(MAX_CREDIT_SCORE, state.player.creditScore + resolution.creditDelta)),
        careerGrowthModifier: round2(Math.max(0.5, state.player.careerGrowthModifier + resolution.careerGrowthModifierDelta)),
        careerRiskModifier: round2(Math.max(0.5, state.player.careerRiskModifier + resolution.careerRiskModifierDelta)),
        careerVolatilityModifier: round2(state.player.careerVolatilityModifier + resolution.careerVolatilityModifierDelta),
        properties: resolution.propertyValueImpactPct === 0
          ? state.player.properties
          : state.player.properties.map(p => ({
              ...p,
              currentValue: Math.max(PROPERTY_VALUE_FLOOR, Math.round(p.currentValue * (1 + resolution.propertyValueImpactPct / 100))),
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
