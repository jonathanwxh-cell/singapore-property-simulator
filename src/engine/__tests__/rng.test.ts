import { describe, expect, it } from 'vitest';
import { createRng, rngInt, rngPick } from '../rng';

describe('createRng', () => {
  it('produces deterministic sequences for the same seed', () => {
    const a = createRng(42);
    const b = createRng(42);
    for (let i = 0; i < 100; i++) {
      expect(a.next()).toBe(b.next());
    }
  });

  it('produces different sequences for different seeds', () => {
    const a = createRng(1);
    const b = createRng(2);
    let differences = 0;
    for (let i = 0; i < 50; i++) {
      if (a.next() !== b.next()) differences++;
    }
    expect(differences).toBeGreaterThan(40);
  });

  it('returns values in [0, 1)', () => {
    const rng = createRng(123);
    for (let i = 0; i < 1000; i++) {
      const v = rng.next();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('state can be saved and restored', () => {
    const rng = createRng(99);
    rng.next(); rng.next(); rng.next();
    const savedState = rng.getState();
    const expected = rng.next();
    rng.setState(savedState);
    expect(rng.next()).toBe(expected);
  });
});

describe('rngInt', () => {
  it('returns integers in [0, max)', () => {
    const rng = createRng(7);
    for (let i = 0; i < 1000; i++) {
      const v = rngInt(rng, 10);
      expect(Number.isInteger(v)).toBe(true);
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(10);
    }
  });
});

describe('rngPick', () => {
  it('throws on empty arrays', () => {
    const rng = createRng(1);
    expect(() => rngPick(rng, [])).toThrow();
  });

  it('returns elements from the input array', () => {
    const rng = createRng(1);
    const arr = ['a', 'b', 'c'];
    for (let i = 0; i < 50; i++) {
      expect(arr).toContain(rngPick(rng, arr));
    }
  });
});
