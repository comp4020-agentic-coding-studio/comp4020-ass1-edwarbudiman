/**
 * Pure transitions, `State -> State`, one per visitor action.
 *
 * None of these read `window`, `document`, or any viewport dimension or media
 * query — layout is CSS's job, not this module's. None of them mutate the
 * `State` they are given; each returns a new object. See
 * `spec/seam.test.ts` and `spec/contracts.test.ts` for the assertions.
 */

import {
  freshShoe,
  makeRng,
  playOut,
  removeCards,
  runningCount,
  SEED,
  type DealModel,
  type Decision,
  type Table,
} from "../engine/index.ts";
import { OPENING_HAND, OPENING_UPCARD, PLAYOUT_TRIALS, type State } from "./state.ts";

function otherDecision(decision: Decision | null): Decision {
  return decision === "hit" ? "stand" : "hit";
}

/**
 * Beat 2 -> beat 3: the one moment the visitor's hand is actually carried to
 * settlement. `render(state)` is pure, so the Play-out is dealt here, in the
 * transition, against the Shoe the visitor has actually been looking at, and
 * the result is stored on `State` (ADR 0001). `render` then only ever
 * displays what already happened — it never deals anything itself.
 *
 * Only the cards that left the Shoe during this deal (the visitor's drawn
 * card, if any, plus the dealer's hole card and any further hits) are folded
 * into the Shoe, the discards and the Running Count — the opening three cards
 * are already accounted for.
 */
function dealBeat3(state: State): State {
  const decision = state.decision ?? "stand";
  const table: Table = {
    hand: state.hand,
    dealer: state.dealer,
    shoe: state.shoe,
    model: state.model,
  };
  const result = playOut(table, decision, makeRng(SEED));

  const dealtToPlayer = result.playerRanks.slice(state.hand.length);
  const dealtToDealer = result.dealerRanks.slice(state.dealer.length);
  const dealt = [...dealtToPlayer, ...dealtToDealer];

  const shoe = removeCards(state.shoe, dealt);
  const discards = [...state.discards, ...dealt];
  const count = state.runningCount + runningCount(dealt);

  return {
    ...state,
    beat: 3,
    playOut: result,
    shoe,
    discards,
    runningCount: count,
    runningCountHighWaterMark: Math.max(state.runningCountHighWaterMark, count),
  };
}

/**
 * Beat 1's Hit/Stand buttons: records the visitor's Decision, made before any
 * probability is shown. The first time it is called this beat, it also moves
 * the visitor on to beat 2 — that is the one action a click on Hit or Stand
 * performs.
 */
export function decide(state: State, decision: Decision): State {
  return {
    ...state,
    decision,
    beat: state.beat === 1 ? 2 : state.beat,
  };
}

/**
 * The generic "move on" action behind beat 2 and beat 3's advance buttons.
 *
 * Beat 2 -> beat 3 is not generic, though it looks it from the outside: it is
 * the one advance that deals real cards, via `dealBeat3`.
 */
export function advanceBeat(state: State): State {
  if (state.act !== 1) return state;
  if (state.beat === 2) return dealBeat3(state);
  const beat = Math.min(4, state.beat + 1) as State["beat"];
  return { ...state, beat };
}

/**
 * Hash routing lands here. The visitor's hand, Shoe and Running Count travel
 * with them between Acts — only `act` changes.
 */
export function goToAct(state: State, act: State["act"]): State {
  return { ...state, act };
}

/** The single control switching between Finite Shoe and Independent Draw. */
export function setModel(state: State, model: DealModel): State {
  return { ...state, model };
}

/** Act 2 opens locked to the Deal Model alone; this is "Unlock free play". */
export function unlockFreePlay(state: State): State {
  return { ...state, act2FreePlay: true };
}

/** Drives the Play-out counter climbing toward 1,000 as the distribution fills. */
export function advanceSimulation(state: State, by: number): State {
  const playoutProgress = Math.min(
    PLAYOUT_TRIALS,
    Math.max(0, state.playoutProgress + by),
  );
  return { ...state, playoutProgress };
}

/**
 * "Try the other decision": returns to beat 2 with the Decision flipped, so
 * the two Play-out distributions can be compared from the same opening hand.
 *
 * Beat 3 deals real cards from the Shoe (`dealBeat3`), so a replay must
 * re-deal honestly from the opening Shoe rather than carry forward whatever
 * the previous run happened to draw — hand, dealer, Shoe, discards and the
 * Running Count all reset to match the opening deal, and the stored Play-out
 * is cleared so beat 3 shows nothing until the new Decision is carried to
 * settlement again. The high-water mark is a session figure, not a per-run
 * one, so it is never lowered by a reset — only ever raised, and only if the
 * reset count itself somehow exceeded it.
 */
export function replayWithOtherDecision(state: State): State {
  const discards = [...OPENING_HAND, ...OPENING_UPCARD];
  const shoe = removeCards(freshShoe(), discards);
  const count = runningCount(discards);

  return {
    ...state,
    decision: otherDecision(state.decision),
    beat: 2,
    hand: [...OPENING_HAND],
    dealer: [...OPENING_UPCARD],
    shoe,
    discards,
    playoutProgress: 0,
    playOut: null,
    runningCount: count,
    runningCountHighWaterMark: Math.max(state.runningCountHighWaterMark, count),
  };
}
