/**
 * Drawing a card, and playing the dealer's turn out.
 *
 * Table rules: six-deck shoe, dealer stands on all 17s, hit and stand only.
 * "All 17s" includes soft seventeen — the dealer does not hit it.
 */

import { RANKS, handTotal, type Rank } from "./cards.ts";
import { drawWeights, removeCard, type DealModel, type Shoe } from "./shoe.ts";
import type { Rng } from "./rng.ts";

export const DEALER_STANDS_ON = 17;

export interface Draw {
  rank: Rank;
  shoe: Shoe;
}

/**
 * Draw one card, weighted by whatever distribution the Deal Model reads.
 *
 * The card is removed from the shoe either way: under Independent Draw the model
 * ignores the depletion when it computes probabilities, but the card has still
 * physically gone and the visitor can see it in the discard tray.
 */
export function drawCard(shoe: Shoe, model: DealModel, rng: Rng): Draw {
  const weights = drawWeights(shoe, model);
  const total = RANKS.reduce((sum, rank) => sum + weights[rank], 0);
  if (total <= 0) throw new Error("Nothing left to draw");

  let ticket = rng() * total;
  for (let index = 0; index < RANKS.length; index++) {
    const rank = RANKS[index];
    ticket -= weights[rank];
    if (ticket < 0) {
      // Under Independent Draw the weights are the fresh composition, so a rank
      // the shoe has genuinely run out of can come up. Fall through to the next
      // rank that is actually there rather than throwing.
      if (shoe.composition[rank] > 0) return { rank, shoe: removeCard(shoe, rank) };

      // "The next rank", counted from the one the ticket landed on and wrapping
      // past King back to Ace. Searching RANKS from the start instead would
      // always hand back the first non-empty rank, which is Ace-first order —
      // so every exhausted rank would resolve toward Ace and quietly bias the
      // deal. Unreachable while no rank has been fully depleted; wrong the
      // moment one is.
      for (let step = 1; step < RANKS.length; step++) {
        const next = RANKS[(index + step) % RANKS.length];
        if (shoe.composition[next] > 0) {
          return { rank: next, shoe: removeCard(shoe, next) };
        }
      }
      break;
    }
  }

  const fallback = RANKS.find((rank) => shoe.composition[rank] > 0);
  if (!fallback) throw new Error("Nothing left to draw");
  return { rank: fallback, shoe: removeCard(shoe, fallback) };
}

export interface DealerResult {
  ranks: Rank[];
  total: number;
  busted: boolean;
  shoe: Shoe;
}

/**
 * Play the dealer's hand from their two cards until they stand or bust.
 */
export function playDealer(
  hole: readonly Rank[],
  shoe: Shoe,
  model: DealModel,
  rng: Rng,
): DealerResult {
  const ranks = [...hole];
  let current = shoe;

  for (;;) {
    const { total, busted } = handTotal(ranks);
    if (busted || total >= DEALER_STANDS_ON) {
      return { ranks, total, busted, shoe: current };
    }
    const drawn = drawCard(current, model, rng);
    ranks.push(drawn.rank);
    current = drawn.shoe;
  }
}
