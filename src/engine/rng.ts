export interface Rng {
  next: () => number;
  getState: () => number;
  setState: (state: number) => void;
  getSeed: () => number;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  const seedValue = seed >>> 0;
  return {
    next: () => {
      state = (state + 0x6D2B79F5) >>> 0;
      let t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    },
    getState: () => state,
    setState: (s: number) => { state = s >>> 0; },
    getSeed: () => seedValue,
  };
}

export function rngInt(rng: Rng, max: number): number {
  return Math.floor(rng.next() * max);
}

export function rngPick<T>(rng: Rng, arr: readonly T[]): T {
  if (arr.length === 0) throw new Error('rngPick: empty array');
  return arr[rngInt(rng, arr.length)];
}

export function newSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0x7fffffff)) >>> 0;
}
