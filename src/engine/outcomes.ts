/**
 * Draw-level maths: every card that could come next, considered on its own.
 *
 * A Draw is one card. A Play-out is a whole hand carried to settlement. They are
 * different units answering different questions and this file only does the
 * first — see CONTEXT.md, which exists because an earlier draft blurred them.
 */

import { RANKS, handTotal, type Rank } from "./cards.ts";
import { drawProbability, type DealModel, type Shoe } from "./shoe.ts";

/** The visitor's choice. The type admits Double and Split so the seam exists;
 *  nothing implements or offers them. */
export type Decision = "hit" | "stand" | "double" | "split";

export const OFFERED_DECISIONS: readonly Decision[] = ["hit", "stand"];

export interface DrawOutcome {
  rank: Rank;
  /** The hand total this Draw would leave. */
  total: number;
  busts: boolean;
  /** Exact chance of this Draw, per the Deal Model. */
  probability: number;
}

/** Every one of the thirteen possible next cards, against the hand held. */
export function drawOutcomes(
  hand: readonly Rank[],
  shoe: Shoe,
  model: DealModel,
): DrawOutcome[] {
  return RANKS.map((rank) => {
    const { total, busted } = handTotal([...hand, rank]);
    return {
      rank,
      total,
      busts: busted,
      probability: drawProbability(shoe, rank, model),
    };
  });
}

/** The ranks that leave the hand alive. For a sixteen: A, 2, 3, 4 and 5. */
export function survivingRanks(hand: readonly Rank[]): Rank[] {
  return RANKS.filter((rank) => !handTotal([...hand, rank]).busted);
}

export function bustingRanks(hand: readonly Rank[]): Rank[] {
  return RANKS.filter((rank) => handTotal([...hand, rank]).busted);
}

export interface Split {
  surviving: Rank[];
  busting: Rank[];
  /** Total probability mass, not the count of ranks — these differ once the
   *  shoe is uneven. */
  surviveChance: number;
  bustChance: number;
}

/** The survive/bust split, both as rank sets and as probability. */
export function bustSplit(
  hand: readonly Rank[],
  shoe: Shoe,
  model: DealModel,
): Split {
  const outcomes = drawOutcomes(hand, shoe, model);
  const mass = (busts: boolean) =>
    outcomes
      .filter((outcome) => outcome.busts === busts)
      .reduce((sum, outcome) => sum + outcome.probability, 0);

  return {
    surviving: survivingRanks(hand),
    busting: bustingRanks(hand),
    surviveChance: mass(false),
    bustChance: mass(true),
  };
}
