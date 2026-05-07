export type Difficulty = 'easy' | 'normal' | 'hard' | 'tycoon';
export type MaritalStatus = 'single' | 'married' | 'divorced';
export type OccupancyStatus = 'owner-occupied' | 'vacant' | 'tenanted' | 'renovating' | 'listed';
export type LivingArrangement = 'with-parents' | 'renting-room' | 'renting-flat';
export type BuyerResidencyStatus = 'sc' | 'spr' | 'foreigner';
export type HouseholdProfile =
  | 'couple-family'
  | 'single-parent'
  | 'multi-gen-family'
  | 'domestic-partners'
  | 'single-35-plus'
  | 'single-under-35'
  | 'foreigner-investor';
export type RunRouteId =
  | 'bto-upgrader'
  | 'single-resale'
  | 'pr-private-climber'
  | 'foreign-investor'
  | 'heartland-landlord'
  | 'commercial-operator'
  | 'fire-homeowner'
  | 'senior-rightsizer';
export type RunRoutePhase = 'foundation' | 'acquisition' | 'ownership' | 'expansion' | 'legacy';
export type RouteMilestoneStatus = 'locked' | 'active' | 'completed';
export type RouteMilestoneImpact = 'cash' | 'eligibility' | 'risk' | 'yield' | 'debt' | 'lifestyle';
export type RenovationCategory =
  | 'kitchen'
  | 'bathroom'
  | 'flooring'
  | 'smart-home'
  | 'layout'
  | 'commercial-fitout'
  | 'maintenance-overhaul';
export type RenovationContractorTier = 'budget' | 'standard' | 'premium';
export type RenovationStatus = 'planned' | 'active' | 'completed' | 'overrun' | 'cancelled';
export type RentStrategy = 'conservative' | 'market' | 'aggressive';
export type RentalMode = 'room-rental' | 'whole-unit' | 'corporate-lease' | 'student-shared' | 'commercial-lease';
export type TenantProfileId = 'local-family' | 'expat-pmet' | 'student-tenants' | 'sme-commercial';
export type MaintenanceCategory = 'plumbing' | 'electrical' | 'aircon' | 'waterproofing' | 'appliance' | 'common-area' | 'tenant-damage';
export type MaintenanceSeverity = 'minor' | 'major' | 'urgent';
export type MaintenanceStatus = 'open' | 'repaired' | 'deferred' | 'insured';
export type TenantLeaseDecisionId = 'renew' | 'raise-rent' | 'reset-market' | 'end-lease';
export type MortgageFinancingMode = 'bank' | 'hdb-concessionary';
export type PendingTaxReliefType = 'absd-spouse-refund' | 'absd-single-senior-refund';
export type PendingTaxReliefStatus = 'pending' | 'earned' | 'expired';
export type CpfUsageMode = 'full' | 'prorated' | 'blocked';
export type IncomeTrackId = 'sideGig' | 'propertyHustle';
export type LifeActionId =
  | 'focus-at-work'
  | 'take-side-gig'
  | 'property-hustle'
  | 'upskill'
  | 'support-household'
  | 'plan-schemes'
  | 'recover';

export interface LifeIncomeBreakdown {
  focusAtWork: number;
  sideGig: number;
  propertyHustle: number;
  schemes: number;
  upskillCost: number;
  householdSupportCost: number;
}

export interface IncomeTrackState {
  xp: number;
  totalEarned: number;
  bestMonth: number;
}

export interface IncomeProgressState {
  sideGig: IncomeTrackState;
  propertyHustle: IncomeTrackState;
}

export interface LifeMonthSummary {
  primaryActionId: LifeActionId;
  secondaryActionId: LifeActionId | null;
  cashDelta: number;
  energyDelta: number;
  stressDelta: number;
  reputationDelta: number;
  careerMomentumDelta: number;
  householdSupportDelta: number;
  incomeBreakdown: LifeIncomeBreakdown;
  notes: string[];
}

export interface PlayerLifeState {
  energy: number;
  stress: number;
  reputation: number;
  careerMomentum: number;
  householdLoad: number;
  householdSupport: number;
  livingArrangement: LivingArrangement;
  selectedPrimaryActionId: LifeActionId | null;
  selectedSecondaryActionId: LifeActionId | null;
  trainingTrackId: string | null;
  trainingMonthsRemaining: number;
  schemeProgress: {
    skillsFuture: number;
    firstTimerGrant: number;
    householdSupport: number;
  };
  incomeProgress: IncomeProgressState;
  lastMonthSummary: LifeMonthSummary | null;
}

export interface BuyerProfile {
  residencyStatus: BuyerResidencyStatus;
  householdProfile: HouseholdProfile;
  age: number;
}

export interface RouteMilestoneTemplate {
  id: string;
  label: string;
  detail: string;
  route: string;
  actionLabel: string;
  impact: RouteMilestoneImpact;
  phase: RunRoutePhase;
}

export interface RunRoute {
  id: RunRouteId;
  label: string;
  shortLabel: string;
  tagline: string;
  description: string;
  difficultyHint: string;
  beginnerFriendly: boolean;
  accentColor: string;
  recommendedBuyerProfiles: HouseholdProfile[];
  recommendedResidency: BuyerResidencyStatus[];
  primaryLessons: string[];
  scenarioTags: string[];
  milestoneTemplates: RouteMilestoneTemplate[];
}

export interface RouteMilestone extends RouteMilestoneTemplate {
  status: RouteMilestoneStatus;
  progressPct: number;
}

export interface RunArc {
  route: RunRoute;
  phase: RunRoutePhase;
  phaseLabel: string;
  activeMilestone: RouteMilestone | null;
  supportingMilestones: RouteMilestone[];
  milestones: RouteMilestone[];
  progressPct: number;
  lesson: string;
  whyItMatters: string;
}

export interface RunRouteScore {
  routeId: RunRouteId;
  routeLabel: string;
  score: number;
  completedMilestones: number;
  totalMilestones: number;
  summary: string;
  nextLesson: string;
  suggestedNextRouteId: RunRouteId;
}

export interface RenovationProject {
  id: string;
  templateId: string;
  propertyId: string;
  category: RenovationCategory;
  contractorTier?: RenovationContractorTier;
  label: string;
  cost: number;
  durationMonths: number;
  remainingMonths: number;
  rentUpliftPct: number;
  resaleUpliftPct: number;
  satisfactionUplift: number;
  riskPct: number;
  conditionDelta: number;
  projectedPaybackMonths?: number | null;
  projectedCompletionTurn?: number;
  status: RenovationStatus;
  startedTurn: number;
}

export interface TenantState {
  profileId: TenantProfileId;
  rentalMode: RentalMode;
  leaseStartTurn: number;
  leaseEndTurn: number;
  satisfaction: number;
  rentStrategy: RentStrategy;
  askingRent: number;
  contractedRent: number;
  defaultRiskPct: number;
  renewalIntent: number;
  lastLeaseDecisionTurn?: number;
  lastMonthlyEventTurn?: number;
}

export interface MaintenanceIssue {
  id: string;
  propertyId: string;
  category: MaintenanceCategory;
  severity: MaintenanceSeverity;
  label?: string;
  riskTag?: string;
  estimatedCost: number;
  satisfactionImpact: number;
  valueImpactPct: number;
  recurrenceRiskPct: number;
  status: MaintenanceStatus;
}

export interface ReserveState {
  targetMonths: number;
  allocatedCash: number;
  autoTopUpPct: number;
  lastCoveredCost?: number;
}

export interface PropertyOperationLogEntry {
  id: string;
  turn: number;
  propertyId?: string;
  title: string;
  detail: string;
  tone: 'good' | 'warn' | 'bad' | 'neutral';
}

export interface PendingTaxRelief {
  type: PendingTaxReliefType;
  purchasePropertyId: string;
  purchaseTurn: number;
  deadlineTurn: number;
  expectedRefundAmount: number;
  qualifyingSoldPropertyIds: string[];
  status: PendingTaxReliefStatus;
  replacementPurchasePrice?: number;
}

export interface OwnedProperty {
  propertyId: string;
  purchasePrice: number;
  purchaseDate: string;
  currentValue: number;
  isRented: boolean;
  monthlyRental: number;
  renovationLevel: number;
  loanId?: string;
  occupancyStatus?: OccupancyStatus;
  tenantQuality?: number;
  vacancyMonths?: number;
  maintenanceCost?: number;
  propertyTax?: number;
  listingChannel?: string;
  conditionScore?: number;
  mopRemainingMonths?: number;
  activeRenovation?: RenovationProject;
  completedRenovations?: RenovationCategory[];
  tenant?: TenantState;
  openMaintenanceIssues?: MaintenanceIssue[];
  rentStrategy?: RentStrategy;
  floorPlanId?: string;
  financingMode?: MortgageFinancingMode;
  hdbResaleLevyPaid?: number;
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
  financingMode?: MortgageFinancingMode;
}

export interface MarketNewsItem {
  id: string;
  turn: number;
  month: number;
  year: number;
  headline: string;
  detail: string;
  category: 'Rates' | 'Demand' | 'Supply' | 'Policy' | 'Macro' | 'Infrastructure';
  tone: 'bullish' | 'bearish' | 'neutral';
  priceChangePct: number;
  rentalChangePct: number;
  rateChangePct: number;
}

export interface CareerProgressionProfile {
  reviewCount: number;
  lastOutcome: 'promotion' | 'bonus' | 'steady' | 'setback' | null;
  lastSalaryDelta: number;
  lastBonus: number;
}

export interface CareerReviewHistoryEntry {
  turn: number;
  outcome: CareerProgressionProfile['lastOutcome'];
  salaryDelta: number;
  bonus: number;
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
  life: PlayerLifeState;
  careerGrowthModifier: number;
  careerRiskModifier: number;
  careerVolatilityModifier: number;
  lastCareerReviewTurn: number;
  nextJobSwitchTurn: number;
  firstHomePurchased: boolean;
  ownedPrivateHome: boolean;
  usedSubsidizedHousing?: boolean;
  careerProgressionProfile: CareerProgressionProfile;
  careerReviewHistory: CareerReviewHistoryEntry[];
  buyerProfile?: BuyerProfile;
  runRouteId?: RunRouteId;
  reserve?: ReserveState;
  operationHistory?: PropertyOperationLogEntry[];
  pendingTaxReliefs?: PendingTaxRelief[];
}

export interface MarketState {
  interestRate: number;
  priceIndex: number;
  rentalIndex: number;
  volatility: number;
  lastEvent: string | null;
  monthlyPriceChangePct?: number;
  monthlyRentalChangePct?: number;
  monthlyInterestRateChangePct?: number;
  lastHeadline?: string | null;
  lastSummary?: string | null;
  newsFeed?: MarketNewsItem[];
}

export interface GameSettings {
  soundEnabled: boolean;
  musicEnabled: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  autoSave: boolean;
  difficulty: Difficulty;
  guidedMode: boolean;
  compactMode: boolean;
  largeTextMode: boolean;
  highContrastMode: boolean;
}

export interface GameState {
  player: Player;
  market: MarketState;
  settings: GameSettings;
  isGameActive: boolean;
  currentScenario: string | null;
  rngSeed: number;
  rngState: number;
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

export interface SaveProfile {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  lastPlayedAt: string;
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

export const DEFAULT_BUYER_PROFILE: BuyerProfile = {
  residencyStatus: 'sc',
  householdProfile: 'couple-family',
  age: 30,
};

export function createInitialLifeIncomeBreakdown(): LifeIncomeBreakdown {
  return {
    focusAtWork: 0,
    sideGig: 0,
    propertyHustle: 0,
    schemes: 0,
    upskillCost: 0,
    householdSupportCost: 0,
  };
}

export function createInitialIncomeTrackState(): IncomeTrackState {
  return {
    xp: 0,
    totalEarned: 0,
    bestMonth: 0,
  };
}

export function createInitialIncomeProgressState(): IncomeProgressState {
  return {
    sideGig: createInitialIncomeTrackState(),
    propertyHustle: createInitialIncomeTrackState(),
  };
}

export function normalizeBuyerProfile(profile?: Partial<BuyerProfile> | null): BuyerProfile {
  const householdProfile = profile?.householdProfile ?? DEFAULT_BUYER_PROFILE.householdProfile;
  let age = Math.max(21, Math.round(profile?.age ?? DEFAULT_BUYER_PROFILE.age));

  if (householdProfile === 'single-35-plus') age = Math.max(35, age);
  if (householdProfile === 'single-under-35') age = Math.min(34, age);

  return {
    ...DEFAULT_BUYER_PROFILE,
    ...profile,
    householdProfile,
    age,
  };
}

export function createInitialLifeState(overrides: Partial<PlayerLifeState> = {}): PlayerLifeState {
  const {
    schemeProgress,
    incomeProgress,
    lastMonthSummary,
    ...restOverrides
  } = overrides;
  const defaultIncomeProgress = createInitialIncomeProgressState();
  const mergedLastMonthSummary = lastMonthSummary
    ? {
        ...lastMonthSummary,
        incomeBreakdown: {
          ...createInitialLifeIncomeBreakdown(),
          ...(lastMonthSummary.incomeBreakdown ?? {}),
        },
      }
    : null;

  return {
    energy: 70,
    stress: 20,
    reputation: 0,
    careerMomentum: 0,
    householdLoad: 650,
    householdSupport: 50,
    livingArrangement: 'with-parents',
    selectedPrimaryActionId: null,
    selectedSecondaryActionId: null,
    trainingTrackId: null,
    trainingMonthsRemaining: 0,
    schemeProgress: {
      skillsFuture: 0,
      firstTimerGrant: 0,
      householdSupport: 0,
      ...schemeProgress,
    },
    incomeProgress: {
      sideGig: {
        ...defaultIncomeProgress.sideGig,
        ...(incomeProgress?.sideGig ?? {}),
      },
      propertyHustle: {
        ...defaultIncomeProgress.propertyHustle,
        ...(incomeProgress?.propertyHustle ?? {}),
      },
    },
    lastMonthSummary: mergedLastMonthSummary,
    ...restOverrides,
  };
}
