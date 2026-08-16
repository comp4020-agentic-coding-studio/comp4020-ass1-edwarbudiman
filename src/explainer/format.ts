/**
 * Number and percentage formatting, in one place, so no Act formats its own.
 *
 * These functions only format numbers the engine already computed — see
 * `src/engine/`. Nothing here derives a figure of its own.
 */

/** U+2212 MINUS SIGN — not a hyphen, to match the design. */
const MINUS_SIGN = "−";

/** Fixed at the shipped locale so output is deterministic across machines and
 *  under JSDOM in tests, regardless of the runner's own locale. */
const LOCALE = "en-US";

/** A probability (0..1) as a percentage to one decimal place, e.g. "38.8%". */
export function formatPercent(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`;
}

/** A count with thousands separators, e.g. "1,000". */
export function formatCount(value: number): string {
  return value.toLocaleString(LOCALE);
}

/** The Running Count, signed: "+11", "0", "−1" — never a bare number. */
export function formatSignedCount(value: number): string {
  if (value > 0) return `+${formatCount(value)}`;
  if (value < 0) return `${MINUS_SIGN}${formatCount(Math.abs(value))}`;
  return formatCount(value);
}
