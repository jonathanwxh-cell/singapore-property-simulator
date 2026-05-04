export type ActionFailReason =
  | 'insufficient_cash'
  | 'tdsr_exceeded'
  | 'credit_too_low'
  | 'already_owned'
  | 'property_not_found'
  | 'invalid_index'
  | 'loan_not_found'
  | 'loan_already_paid'
  | 'invalid_amount'
  | 'ltv_exceeded'
  | 'msr_exceeded'
  | 'cpf_not_allowed'
  | 'cpf_exceeded'
  | 'eligibility_blocked'
  | 'renovation_active'
  | 'renovation_completed'
  | 'renovation_not_found'
  | 'mop_restricted'
  | 'rental_mode_blocked'
  | 'tenant_not_found'
  | 'lease_option_not_found'
  | 'maintenance_not_found'
  | 'repair_choice_not_found';

export type ActionResult<T = void> =
  | { ok: true; value: T }
  | { ok: false; reason: ActionFailReason; message: string };

export const ok = <T>(value: T): ActionResult<T> => ({ ok: true, value });
export const fail = (reason: ActionFailReason, message: string): ActionResult<never> => ({
  ok: false,
  reason,
  message,
});
