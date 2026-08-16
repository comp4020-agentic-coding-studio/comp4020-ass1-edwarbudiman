/**
 * The Explainer's State: plain, serialisable data. No functions, no DOM nodes.
 *
 * See CONTEXT.md for the vocabulary and the spec's "The Explainer module — the
 * single seam". Every transition in `transitions.ts` is `State -> State`, and
 * `render.ts`'s `render(state)` is a pure function of this alone.
 */

import {
  freshShoe,
  removeCards,
  runningCount,
  type DealModel,
  type Decision,
  type Rank,
  type Shoe,
} from "../engine/index.ts";

/**
 * Act 1's fixed opening: the visitor's sixteen against a dealer ten. These are
 * the ONLY cards dealt before any Decision — the dealer's hole card is not
 * predetermined, it does not exist until the hand is played out and the engine
 * draws it (ADR 0001; `scripts/figures.ts` deals the same three cards for the
 * shipped figures). `dealer` therefore holds only the upcard here and through
 * beat 1: one card, not two.
 */
export const OPENING_HAND: readonly Rank[] = ["10", "6"];
export const OPENING_UPCARD: readonly Rank[] = ["10"];

/** How many Play-out trials Act 1 beat 4's distribution simulates. */
export const PLAYOUT_TRIALS = 1000;

export interface State {
  act: 1 | 2 | 3;
  /** Act 1's four beats. Only meaningful while `act` is 1. */
  beat: 1 | 2 | 3 | 4;
  /** The visitor's cards. */
  hand: Rank[];
  /**
   * The dealer's cards revealed so far. Starts holding only the upcard — the
   * face-down card in beat 1's markup is a visual only, never a Rank here,
   * because the hole card has not been dealt yet.
   */
  dealer: Rank[];
  shoe: Shoe;
  model: DealModel;
  decision: Decision | null;
  /** How many of the 1,000 Play-out trials have been rendered so far. */
  playoutProgress: number;
  /** The Hi-Lo tally of every card that has left the Shoe. */
  runningCount: number;
  /** The highest `runningCount` has been this session. */
  runningCountHighWaterMark: number;
  /** Every card that has left the Shoe, in the order it was dealt. */
  discards: Rank[];
  /** Act 2 opens locked to the Deal Model alone; this flips once free play unlocks. */
  act2FreePlay: boolean;
}

/**
 * The opening table: the visitor holds sixteen against a dealer ten, dealt by
 * removing exactly those three cards from a fresh Shoe, so the Shoe's
 * composition is honest from the very first render.
 */
export function initialState(): State {
  const discards: Rank[] = [...OPENING_HAND, ...OPENING_UPCARD];
  const shoe = removeCards(freshShoe(), discards);
  const count = runningCount(discards);

  return {
    act: 1,
    beat: 1,
    hand: [...OPENING_HAND],
    dealer: [...OPENING_UPCARD],
    shoe,
    model: "finite-shoe",
    decision: null,
    playoutProgress: 0,
    runningCount: count,
    runningCountHighWaterMark: count,
    discards,
    act2FreePlay: false,
  };
}
