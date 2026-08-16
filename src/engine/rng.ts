/**
 * A seeded pseudo-random generator.
 *
 * Seeding is the point, not a convenience: it makes Play-out distributions
 * deterministic so a test can assert them, which is why ADR 0002 chose Monte
 * Carlo over exact enumeration. The seed is part of the tested contract — change
 * it and asserted values change — so treat it as fixed, not as a tuning knob.
 */

/** The seed every shipped figure is computed with. */
export const SEED = 20260816;

export type Rng = () => number;

/** mulberry32 — small, fast, and good enough for counting card outcomes. */
export function makeRng(seed: number): Rng {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
