// Cashflow
export const TAKE_HOME_RATIO = 0.8;
export const CPF_TOTAL_CONTRIB_RATIO = 0.37;
export const CPF_OA_PORTION = 0.65;

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

// Save versioning
export const SAVE_VERSION = 1;
