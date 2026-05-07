import { describe, expect, it } from 'vitest';
import { SAVE_VERSION } from '@/engine/constants';
import { migrateSave } from '../saveMigrations';

describe('migrateSave', () => {
  it('returns null for null, undefined, or non-objects', () => {
    expect(migrateSave(null)).toBeNull();
    expect(migrateSave(undefined)).toBeNull();
    expect(migrateSave('string')).toBeNull();
    expect(migrateSave(42)).toBeNull();
  });

  it('returns the input unchanged when version is current', () => {
    const raw = { version: SAVE_VERSION, foo: 'bar' };
    expect(migrateSave(raw)).toBe(raw);
  });

  it('bumps version 1 -> current and preserves the rest of the body', () => {
    const raw = { version: 1, foo: 'bar', nested: { a: 1 } };
    const migrated = migrateSave(raw) as { version: number; foo: string; nested: { a: number } };
    expect(migrated.version).toBe(SAVE_VERSION);
    expect(migrated.foo).toBe('bar');
    expect(migrated.nested).toEqual({ a: 1 });
  });

  it('rejects unknown versions (forward-compat)', () => {
    expect(migrateSave({ version: SAVE_VERSION + 1 })).toBeNull();
    expect(migrateSave({ version: 0 })).toBeNull();
    expect(migrateSave({ version: 'two' })).toBeNull();
  });

  it('rejects payloads without a version field', () => {
    expect(migrateSave({ foo: 'bar' })).toBeNull();
  });
});
