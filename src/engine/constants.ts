// Cashflow
export const TAKE_HOME_RATIO = 0.8;
export const CPF_TOTAL_CONTRIB_RATIO = 0.37;

// Underwriting
export const TDSR_LIMIT = 0.55;
export const CREDIT_SCORE_FLOOR = 400;
export const DEFAULT_MORTGAGE_TERM_YEARS = 30;

// Market dynamics
export const PROPERTY_VALUE_VOL_FACTOR = 0.05;
export const PRICE_INDEX_BOUNDS = { min: 60, max: 200 } as const;
export const RENTAL_INDEX_BOUNDS = { min: 60, max: 200 } as const;
export const INTEREST_RATE_BOUNDS = { min: 0.5, max: 10 } as const;
export const PROPERTY_VALUE_FLOOR = 1000;

// Game-over
export const INSOLVENCY_STRIKES_LIMIT = 3;

// Scenarios
export const SCENARIO_TRIGGER_PROBABILITY = 0.7;

// Credit score deltas
export const CREDIT_DELTA_LOAN_TAKEN = -5;
export const CREDIT_DELTA_LOAN_PAYMENT = 5;
export const CREDIT_DELTA_LOAN_PAID_OFF = 20;

// ── CPF (2024 rates) ────────────────────────────────────────────────
export const CPF_WAGE_CEILING = 6800;
export const CPF_OA_INTEREST = 0.025;
export const CPF_SA_INTEREST = 0.04;
export const CPF_MA_INTEREST = 0.04;
export const CPF_EXTRA_INTEREST_THRESHOLD = 60000;
export const CPF_EXTRA_INTEREST_RATE = 0.01;

// ── BSD tiers (2024) ───────────────────────────────────────────────
export const BSD_TIERS = [
  { threshold: 180000, rate: 0.01 },
  { threshold: 180000, rate: 0.02 },
  { threshold: 640000, rate: 0.03 },
  { threshold: 500000, rate: 0.04 },
  { threshold: 1500000, rate: 0.05 },
  { threshold: Infinity, rate: 0.06 },
] as const;

// ── ABSD rates (2024) ──────────────────────────────────────────────
export const ABSD_RATES = {
  citizen_second: 0.20,
  citizen_third_plus: 0.30,
  pr_second: 0.20,
  pr_third_plus: 0.30,
  foreigner: 0.60,
} as const;

// ── LTV / MSR (2024) ──────────────────────────────────────────────
export const LTV_FIRST_LOAN = 0.95;
export const LTV_SECOND_LOAN = 0.45;
export const LTV_THIRD_PLUS_LOAN = 0.35;
export const MSR_LIMIT = 0.30;

// Save versioning
export const SAVE_VERSION = 2;
