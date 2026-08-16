/**
 * The Hi-Lo Running Count.
 *
 * Describes what remains in the Shoe. Never what comes next — the whole reason
 * Act 3 exists is to hand the visitor the best legitimate information there is
 * and then show it buys nothing on any particular hand.
 */

import { hardValue, type Rank } from "./cards.ts";

export type HiLo = -1 | 0 | 1;

/**
 * Low cards raise the count, tens and aces lower it, sevens to nines are
 * neutral. Aces and tens sit at opposite ends of the rank axis and both count
 * −1: the count does not care what a card is worth, only whether it is high or
 * low.
 */
export function hiLoValue(rank: Rank): HiLo {
  if (rank === "A" || hardValue(rank) === 10) return -1;
  const value = hardValue(rank);
  if (value >= 2 && value <= 6) return 1;
  return 0;
}

export function runningCount(dealt: readonly Rank[]): number {
  return dealt.reduce((count, rank) => count + hiLoValue(rank), 0);
}

/** The count at which Act 3 offers the closing Scripted Hand. */
export const CLOSING_COUNT = 6;

export function readyToClose(count: number): boolean {
  return count >= CLOSING_COUNT;
}
