/**
 * Pure transitions, `State -> State`, one per visitor action.
 *
 * None of these read `window`, `document`, or any viewport dimension or media
 * query — layout is CSS's job, not this module's. None of them mutate the
 * `State` they are given; each returns a new object. See
 * `spec/seam.test.ts` and `spec/contracts.test.ts` for the assertions.
 */

import {
  drawCard,
  freshShoe,
  makeRng,
  playOut,
  removeCards,
  runningCount,
  SEED,
  type DealModel,
  type Decision,
  type Rank,
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

/**
 * Whether `next` just pushed the Running Count's high-water mark past where
 * `previous` had it. This is the one signal `main.ts` (ticket 12) uses to
 * offer Act 3 unprompted — never a fixed count. design.md and spec.md are
 * explicit about why: Hi-Lo is a balanced count that returns toward zero as
 * the Shoe empties, so a magic threshold like the old `CLOSING_COUNT` is not
 * reliably reachable (measured over 300 Shoes, +6 arrives before 75%
 * penetration in only 74% of them). "The highest it has been all session"
 * always exists, so this is a pure comparison of two States rather than a
 * comparison against any constant.
 */
export function reachedNewHighWaterMark(previous: State, next: State): boolean {
  return next.runningCountHighWaterMark > previous.runningCountHighWaterMark;
}

/** The single control switching between Finite Shoe and Independent Draw. */
export function setModel(state: State, model: DealModel): State {
  return { ...state, model };
}

/**
 * A generator seeded from `SEED` plus how many cards have already left the
 * Shoe this session, rather than a module-level `Rng` held across calls.
 *
 * `render(state)` must stay pure and reproducible (the resize-safety contract
 * in `spec/contracts.test.ts` depends on calling it twice on the same `State`
 * and getting identical output back), and free play deals repeatedly — every
 * hand, every Hit, every Stand — from the same running session. A hidden
 * mutable generator would make each of those calls depend on how many times
 * the module has been used before, which is not part of `State` at all: two
 * sessions that reached the identical `State` by different paths could then
 * render differently, and a test could not reconstruct what a transition did
 * from its input alone. Deriving the seed from `state.discards.length`
 * instead means the same `State`, dealt from again, always deals the same
 * cards — and successive deals within one session still advance through a
 * different part of the generator's sequence, because the Shoe has
 * genuinely changed size by the time the next one runs.
 */
function freePlayRng(state: State) {
  return makeRng(SEED + state.discards.length);
}

/**
 * Deals one free-play hand from the Shoe the visitor has been playing from:
 * two cards to the visitor, one upcard to the dealer — the same shape as
 * Act 1's opening, but drawn from wherever the Shoe currently stands rather
 * than a fresh one. Every card dealt updates the Shoe, the discards, the
 * Running Count and its high-water mark, exactly like `dealBeat3` does for
 * Act 1's single dealt hand.
 */
function dealFreePlayHand(state: State): State {
  const rng = freePlayRng(state);
  let shoe = state.shoe;
  const hand: Rank[] = [];

  for (let i = 0; i < 2; i++) {
    const drawn = drawCard(shoe, state.model, rng);
    hand.push(drawn.rank);
    shoe = drawn.shoe;
  }
  const upcard = drawCard(shoe, state.model, rng);
  shoe = upcard.shoe;

  const dealt = [...hand, upcard.rank];
  const discards = [...state.discards, ...dealt];
  const count = state.runningCount + runningCount(dealt);

  return {
    ...state,
    shoe,
    discards,
    runningCount: count,
    runningCountHighWaterMark: Math.max(state.runningCountHighWaterMark, count),
    freePlayHand: hand,
    freePlayDealer: [upcard.rank],
    freePlayResult: null,
  };
}

/** Deals free play's first hand. Also used, under the name "Next hand", to
 *  deal every hand after the one before it settles — dealing a hand is the
 *  same act each time, whichever button asked for it. */
export function dealHand(state: State): State {
  return dealFreePlayHand(state);
}

/** The "Next hand" button once a free-play hand has settled. */
export function nextHand(state: State): State {
  return dealFreePlayHand(state);
}

/**
 * Hit or Stand for the current free-play hand: carries it to settlement via
 * the same `playOut` beat 2 -> beat 3 already uses, against the Shoe the
 * visitor has actually been depleting. Only the cards this deal actually
 * adds are folded into the Shoe, the discards and the Running Count — the
 * hand's own two cards and the dealer's upcard are already accounted for by
 * `dealFreePlayHand`.
 */
function settleFreePlayHand(state: State, decision: Decision): State {
  const hand = state.freePlayHand;
  const dealer = state.freePlayDealer;
  if (!hand || !dealer) return state;

  const table: Table = { hand, dealer, shoe: state.shoe, model: state.model };
  const result = playOut(table, decision, freePlayRng(state));

  const dealtToPlayer = result.playerRanks.slice(hand.length);
  const dealtToDealer = result.dealerRanks.slice(dealer.length);
  const dealt = [...dealtToPlayer, ...dealtToDealer];

  const shoe = removeCards(state.shoe, dealt);
  const discards = [...state.discards, ...dealt];
  const count = state.runningCount + runningCount(dealt);

  return {
    ...state,
    shoe,
    discards,
    runningCount: count,
    runningCountHighWaterMark: Math.max(state.runningCountHighWaterMark, count),
    freePlayResult: result,
  };
}

export function hitFreePlay(state: State): State {
  return settleFreePlayHand(state, "hit");
}

export function standFreePlay(state: State): State {
  return settleFreePlayHand(state, "stand");
}

/** Act 2's Detail slot: pins whichever rank the visitor last selected. */
export function selectRank(state: State, rank: Rank): State {
  return { ...state, act2SelectedRank: rank };
}

/** Act 2 opens locked to the Deal Model alone; this is "Unlock free play" —
 *  and, story 59, free play deals its first hand the moment it unlocks
 *  rather than leaving the visitor looking at an empty table. */
export function unlockFreePlay(state: State): State {
  return dealFreePlayHand({ ...state, act2FreePlay: true });
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
