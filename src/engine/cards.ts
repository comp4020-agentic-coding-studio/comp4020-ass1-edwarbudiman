/**
 * Ranks, values, and hand totals.
 *
 * The rank order is Ace-first and is load-bearing: Act 1 needs the Ace beside
 * 2–5 because those are exactly the ranks that survive a sixteen, and every Act
 * reuses this order as its axis. See docs/adr/0003.
 */

export const RANKS = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
] as const;

export type Rank = (typeof RANKS)[number];

/** What a rank is worth with an Ace counted low. Faces are ten. */
export function hardValue(rank: Rank): number {
  if (rank === "A") return 1;
  if (rank === "10" || rank === "J" || rank === "Q" || rank === "K") return 10;
  return Number(rank);
}

/** A rank a dealer or player counts as ten. Four of the thirteen. */
export function isTenValue(rank: Rank): boolean {
  return hardValue(rank) === 10;
}

export const BLACKJACK = 21;

export interface HandTotal {
  /** The best total at or under 21, or the hard total once the hand is bust. */
  total: number;
  /** True when an Ace is being counted as eleven, so the hand cannot bust next. */
  soft: boolean;
  busted: boolean;
}

/**
 * The total of a hand, promoting one Ace to eleven where that still fits.
 *
 * Only ever one Ace can be soft: two elevens is already twenty-two.
 */
export function handTotal(ranks: readonly Rank[]): HandTotal {
  const hard = ranks.reduce((sum, rank) => sum + hardValue(rank), 0);
  const hasAce = ranks.includes("A");
  const canPromote = hasAce && hard + 10 <= BLACKJACK;
  const total = canPromote ? hard + 10 : hard;

  return { total, soft: canPromote, busted: total > BLACKJACK };
}
