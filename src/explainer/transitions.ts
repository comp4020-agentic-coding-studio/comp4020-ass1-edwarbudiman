/**
 * Pure transitions, `State -> State`, one per visitor action.
 *
 * None of these read `window`, `document`, or any viewport dimension or media
 * query — layout is CSS's job, not this module's. None of them mutate the
 * `State` they are given; each returns a new object. See
 * `spec/seam.test.ts` and `spec/contracts.test.ts` for the assertions.
 */

import { freshShoe, removeCards, type DealModel, type Decision } from "../engine/index.ts";
import { OPENING_HAND, OPENING_UPCARD, PLAYOUT_TRIALS, type State } from "./state.ts";

function otherDecision(decision: Decision | null): Decision {
  return decision === "hit" ? "stand" : "hit";
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

/** The generic "move on" action behind beat 2 and beat 3's advance buttons. */
export function advanceBeat(state: State): State {
  if (state.act !== 1) return state;
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
 * Nothing beyond the opening three cards has been dealt at this point in the
 * seam — beats 2-4 are still placeholders (ticket 03) — so resetting
 * hand/dealer/Shoe/discards to the opening deal is not lossy. A later ticket
 * that deals further cards during beats 2-4 will need to reconcile what this
 * resets against whatever was actually dealt in the run being replayed.
 */
export function replayWithOtherDecision(state: State): State {
  const discards = [...OPENING_HAND, ...OPENING_UPCARD];
  const shoe = removeCards(freshShoe(), discards);

  return {
    ...state,
    decision: otherDecision(state.decision),
    beat: 2,
    hand: [...OPENING_HAND],
    dealer: [...OPENING_UPCARD],
    shoe,
    discards,
    playoutProgress: 0,
  };
}
