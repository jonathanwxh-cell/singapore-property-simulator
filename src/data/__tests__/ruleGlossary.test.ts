import { describe, expect, it } from 'vitest';
import { getRuleGlossaryEntries, getRuleGlossaryEntry } from '../ruleGlossary';

describe('rule glossary', () => {
  it('gives casual players actionable ABSD learning copy', () => {
    const absd = getRuleGlossaryEntry('absd');

    expect(absd?.label).toBe('ABSD');
    expect(absd?.summary).toBe("Additional Buyer's Stamp Duty");
    expect(absd?.whyItMatters).toContain('upfront cash');
    expect(absd?.example).toContain('PR');
  });

  it('keeps requested glossary entries in the requested order', () => {
    const entries = getRuleGlossaryEntries(['mop', 'cpf-oa', 'absd']);

    expect(entries.map((entry) => entry.id)).toEqual(['mop', 'cpf-oa', 'absd']);
  });

  it('returns undefined for unknown single-term lookups', () => {
    expect(getRuleGlossaryEntry('not-a-real-rule')).toBeUndefined();
  });
});
