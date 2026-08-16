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
  type PlayOut,
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
  /**
   * Beat 3's Play-out: the visitor's hand carried honestly to settlement.
   * `null` until the beat 2 -> beat 3 transition deals it (ADR 0001). `render`
   * is pure, so this is dealt in `advanceBeat`, never here — beat 3's render
   * only ever displays what this already holds.
   */
  playOut: PlayOut | null;
  /**
   * The Deal Model that was in force when `playOut` was dealt — `null` until
   * `dealBeat3` sets both together. Beat 4 is a report on a Play-out that
   * already happened, so its `dealerDist`, `split` and `trials` all read
   * THIS, never the live `state.model`: visiting Act 2, switching the Deal
   * Model there and returning to `#act-1` must not silently re-simulate a
   * hand that was already dealt under a different model (finding 6).
   */
  playOutModel: DealModel | null;
  /**
   * Act 2 free play: the current hand's cards once one has been dealt from
   * the shared Shoe, `null` before free play has dealt its first hand. Kept
   * separate from `state.hand` (Act 1's frozen sixteen, and the hand the
   * locked opening compares Deal Models against) — free play never touches
   * that hand, so Act 2's own re-deals cannot be mistaken for it.
   */
  freePlayHand: Rank[] | null;
  /**
   * The dealer's cards for the current free-play hand. Holds only the upcard
   * while the hand is undecided, exactly like `state.dealer` through Act 1
   * beat 1 — the hole card does not exist until `hitFreePlay`/`standFreePlay`
   * deals it. Filled to the full dealer hand once `freePlayResult` is set.
   */
  freePlayDealer: Rank[] | null;
  /** The current free-play hand's Play-out once `hitFreePlay` or
   *  `standFreePlay` has settled it; `null` while the hand is still undecided
   *  or before the first hand has been dealt. */
  freePlayResult: PlayOut | null;
  /**
   * The rank Act 2's Detail slot is currently showing. `null` until the
   * visitor selects one, in which case `renderAct2` falls back to the most
   * depleted rank — the same default the locked opening's slot always shows.
   */
  act2SelectedRank: Rank | null;
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
    playOut: null,
    playOutModel: null,
    freePlayHand: null,
    freePlayDealer: null,
    freePlayResult: null,
    act2SelectedRank: null,
  };
}
