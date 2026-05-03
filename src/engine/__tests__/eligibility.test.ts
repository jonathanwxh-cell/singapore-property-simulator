import { describe, expect, it } from 'vitest';
import { deriveEligibilityFlags, evaluatePropertyEligibility, getSalaryCeilingForProperty } from '../eligibility';

describe('eligibility', () => {
  it('derives first-timer and homeowner flags from player state', () => {
    const flags = deriveEligibilityFlags({
      salary: 5000,
      properties: [],
      firstHomePurchased: false,
      ownedPrivateHome: false,
    });

    expect(flags.firstTimer).toBe(true);
    expect(flags.homeowner).toBe(false);
    expect(flags.upgrader).toBe(false);
    expect(flags.ecEligible).toBe(true);
  });

  it('marks the player as an upgrader after a completed first-home purchase', () => {
    const flags = deriveEligibilityFlags({
      salary: 8500,
      properties: [{ propertyId: 'hdb-bto-0' }],
      firstHomePurchased: true,
      ownedPrivateHome: false,
    });

    expect(flags.firstTimer).toBe(false);
    expect(flags.homeowner).toBe(true);
    expect(flags.upgrader).toBe(true);
  });

  it('returns the EC ceiling for executive condos', () => {
    expect(getSalaryCeilingForProperty('Executive Condo')).toBe(16000);
    expect(getSalaryCeilingForProperty('Private Condo')).toBeNull();
  });

  it('classifies HDB listings as first-timer friendly when the player is still on their first rung', () => {
    const status = evaluatePropertyEligibility({
      propertyType: 'HDB BTO',
      salary: 5200,
      properties: [],
      firstHomePurchased: false,
      ownedPrivateHome: false,
    });

    expect(status.firstTimerFriendly).toBe(true);
    expect(status.salaryCeilingExceeded).toBe(false);
    expect(status.blockedReason).toBeNull();
  });

  it('marks executive condos as blocked when the salary ceiling is exceeded', () => {
    const status = evaluatePropertyEligibility({
      propertyType: 'Executive Condo',
      salary: 17_000,
      properties: [],
      firstHomePurchased: false,
      ownedPrivateHome: false,
    });

    expect(status.salaryCeilingExceeded).toBe(true);
    expect(status.ecEligible).toBe(false);
    expect(status.blockedReason).toContain('ceiling');
  });
});
