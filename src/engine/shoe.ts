/**
 * The Shoe, and the two Deal Models that read it.
 *
 * Draw probabilities are exact arithmetic over the composition — never sampled,
 * never a constant in the source. See docs/adr/0002.
 */

import { RANKS, type Rank } from "./cards.ts";

export const DECKS = 6;
const SUITS_PER_DECK = 4;

export type Composition = Record<Rank, number>;

export interface Shoe {
  composition: Composition;
  /** Cards still in the shoe. */
  remaining: number;
  /** Cards the shoe held when it was fresh. */
  size: number;
}

/**
 * How the next card is produced. Exactly two exist, and switching between them
 * is the visitor's central experiment.
 */
export type DealModel = "finite-shoe" | "independent-draw";

export function freshComposition(decks = DECKS): Composition {
  const per = SUITS_PER_DECK * decks;
  return Object.fromEntries(RANKS.map((rank) => [rank, per])) as Composition;
}

export function freshShoe(decks = DECKS): Shoe {
  const composition = freshComposition(decks);
  const size = RANKS.length * SUITS_PER_DECK * decks;
  return { composition, remaining: size, size };
}

/** Cards of every rank a fresh shoe of this size holds. */
export function fullRank(shoe: Shoe): number {
  return shoe.size / RANKS.length;
}

/**
 * Take one card of `rank` out of the shoe.
 *
 * Cards leave the shoe under both Deal Models — they are physically gone and the
 * discard tray shows them either way. What differs is whether the probabilities
 * notice, which is `drawProbability`'s business, not this function's.
 */
export function removeCard(shoe: Shoe, rank: Rank): Shoe {
  const held = shoe.composition[rank];
  if (held <= 0) {
    throw new Error(`No ${rank} left in the shoe`);
  }
  return {
    composition: { ...shoe.composition, [rank]: held - 1 },
    remaining: shoe.remaining - 1,
    size: shoe.size,
  };
}

export function removeCards(shoe: Shoe, ranks: readonly Rank[]): Shoe {
  return ranks.reduce(removeCard, shoe);
}

/** Cards of `rank` that have left the shoe. */
export function discarded(shoe: Shoe, rank: Rank): number {
  return fullRank(shoe) - shoe.composition[rank];
}

/**
 * The exact chance that the next card is `rank`.
 *
 * Under Finite Shoe this reads what is actually left. Under Independent Draw the
 * composition is treated as though nothing has ever been dealt, so the answer is
 * the same on the first card and the three hundredth.
 */
export function drawProbability(
  shoe: Shoe,
  rank: Rank,
  model: DealModel,
): number {
  if (model === "independent-draw") {
    return fullRank(shoe) / shoe.size;
  }
  if (shoe.remaining === 0) return 0;
  return shoe.composition[rank] / shoe.remaining;
}

/** The distribution the given Deal Model draws from, as a rank → weight map. */
export function drawWeights(shoe: Shoe, model: DealModel): Composition {
  return model === "independent-draw"
    ? freshComposition(shoe.size / (RANKS.length * SUITS_PER_DECK))
    : shoe.composition;
}
