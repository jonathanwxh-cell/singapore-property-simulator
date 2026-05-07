// Cashflow
export const TAKE_HOME_RATIO = 0.8;
export const CPF_TOTAL_CONTRIB_RATIO = 0.37;

// Underwriting
export const TDSR_LIMIT = 0.55;
export const CREDIT_SCORE_FLOOR = 400;
export const DEFAULT_MORTGAGE_TERM_YEARS = 30;
export const HDB_FLAT_MORTGAGE_TERM_YEARS = 25;
export const HDB_CONCESSIONARY_LOAN_INTEREST = 2.6;
export const HDB_CONCESSIONARY_LTV = 0.75;
export const HDB_CONCESSIONARY_DOWNPAYMENT_PERCENT = 25;
export const HDB_RESALE_LEVY_ESTIMATE = 40_000;

// Market dynamics
// Property values track the broader price index but at this fraction of its move
// (0.5 = property values move at half the index's monthly pace).
export const PROPERTY_VALUE_INDEX_SENSITIVITY = 0.5;
export const PRICE_INDEX_BOUNDS = { min: 60, max: 200 } as const;
export const RENTAL_INDEX_BOUNDS = { min: 60, max: 200 } as const;
export const INTEREST_RATE_BOUNDS = { min: 0.5, max: 10 } as const;
export const PROPERTY_VALUE_FLOOR = 1000;

// Game-over
export const INSOLVENCY_STRIKES_LIMIT = 3;

// Scenarios
export const SCENARIO_TRIGGER_PROBABILITY = 0.7;
export const STARTER_SCENARIO_TURN = 2;
export const MARKET_NEWS_FEED_LIMIT = 8;

// Credit score deltas
export const CREDIT_DELTA_LOAN_TAKEN = -5;
export const CREDIT_DELTA_LOAN_PAYMENT = 5;
export const CREDIT_DELTA_LOAN_PAID_OFF = 20;

// CPF (2026 rates)
export const CPF_WAGE_CEILING = 8000;
export const CPF_OA_INTEREST = 0.025;
export const CPF_SA_INTEREST = 0.04;
export const CPF_MA_INTEREST = 0.04;
export const CPF_EXTRA_INTEREST_THRESHOLD = 60000;
export const CPF_EXTRA_INTEREST_RATE = 0.01;
// Of the $60k extra-interest threshold, at most $20k can come from OA.
// The OA portion accrues to OA; the remainder accrues to SA.
export const CPF_EXTRA_INTEREST_OA_CAP = 20000;

// BSD tiers (current residential property marginal tiers)
export const BSD_TIERS = [
  { threshold: 180000, rate: 0.01 },
  { threshold: 180000, rate: 0.02 },
  { threshold: 640000, rate: 0.03 },
  { threshold: 500000, rate: 0.04 },
  { threshold: 1500000, rate: 0.05 },
  { threshold: Infinity, rate: 0.06 },
] as const;

// ABSD rates on or after 27 Apr 2023
export const ABSD_RATES = {
  citizen_second: 0.20,
  citizen_third_plus: 0.30,
  pr_first: 0.05,
  pr_second: 0.30,
  pr_third_plus: 0.35,
  foreigner: 0.60,
} as const;

// LTV / MSR
export const LTV_FIRST_LOAN = 0.75;
export const LTV_SECOND_LOAN = 0.45;
export const LTV_THIRD_PLUS_LOAN = 0.35;
export const MSR_LIMIT = 0.30;

// Save versioning
export const SAVE_VERSION = 2;
