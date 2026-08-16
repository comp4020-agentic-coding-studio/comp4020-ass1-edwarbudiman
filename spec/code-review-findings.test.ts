import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import {
  discarded,
  freshShoe,
  fullRank,
  makeRng,
  playOut,
  RANKS,
  removeCards,
  type Decision,
  type Rank,
} from "../src/engine/index.ts";
import { render } from "../src/explainer/render.ts";
import { initialState, OPENING_HAND, OPENING_UPCARD, type State } from "../src/explainer/state.ts";
import {
  decide,
  advanceBeat,
  goToAct,
  hitFreePlay,
  nextHand,
  replayWithOtherDecision,
  setModel,
  standFreePlay,
  unlockFreePlay,
} from "../src/explainer/transitions.ts";

// Regression coverage for code-review findings 2, 6, 7, 8 and 9 — see
// CLAUDE.md's "no hardcoded probabilities": every expected figure below is
// either derived from the engine directly or is a fixed input to a real
// engine call, never a typed-in percentage.

function parse(html: string) {
  return new JSDOM(html).window.document;
}

/** Beat 4, reached honestly: decide, deal to settlement, advance once more. */
function beat4State(decision: "hit" | "stand" = "hit"): State {
  return advanceBeat(advanceBeat(decide(initialState(), decision)));
}

/** Act 2 with free play unlocked and its first hand dealt. */
function freePlayState(): State {
  return unlockFreePlay(goToAct(initialState(), 2));
}

function seatFor(doc: Document, label: string) {
  return [...doc.querySelectorAll(".seat")].find((seat) =>
    seat.querySelector(".total")?.textContent?.startsWith(label),
  );
}

describe("finding 6 — beat 4 reads the Deal Model recorded at deal time, not the live one", () => {
  it("renders identically after Act 2 changes state.model and the visitor returns to beat 4", () => {
    const dealt = beat4State("hit");
    const before = render(dealt);

    let after = goToAct(dealt, 2);
    after = setModel(after, "independent-draw");
    after = goToAct(after, 1);

    // The live model really did change...
    expect(after.model).toBe("independent-draw");
    // ...but the Play-out was dealt under Finite Shoe, and beat 4 is a report
    // on that Play-out, so its recorded model must not have moved with it.
    expect(after.playOutModel).toBe("finite-shoe");

    // Every figure beat 4 shows (the odds pair, the dealer histogram, the
    // waffle) is derived from `playOutModel`, so none of them should have
    // shifted just because Act 2's control was touched and the visitor came
    // back. A pre-fix `renderBeat4` reading the live `state.model` instead
    // would recompute the survive/bust split and the dealer histogram under
    // Independent Draw here, producing different percentages and failing
    // this comparison.
    expect(render(after)).toBe(before);
  });
});

describe("finding 7 — the hole-card reveal never fabricates a hole card that was never dealt", () => {
  it("omits the reveal note when the player busted and the dealer never drew", () => {
    // A hand that reliably busts on a hit under the shipped RNG seed, so
    // `playOut` genuinely returns a dealer hand with only the upcard in it —
    // the one shape `play.dealerRanks[1]` is undefined for.
    const HAND: Rank[] = ["10", "9"];
    const UPCARD: Rank[] = ["10"];
    const decision: Decision = "hit";
    const openingDiscards = [...HAND, ...UPCARD];
    const dealShoe = removeCards(freshShoe(), openingDiscards);

    const result = playOut(
      { hand: HAND, dealer: UPCARD, shoe: dealShoe, model: "finite-shoe" },
      decision,
      makeRng(0),
    );

    // Confirms the fixture actually exercises the case this finding is
    // about, rather than silently testing nothing.
    expect(result.playerBusted).toBe(true);
    expect(result.dealerRanks).toHaveLength(1);

    const dealtToPlayer = result.playerRanks.slice(HAND.length);
    const dealtToDealer = result.dealerRanks.slice(UPCARD.length);
    const dealt = [...dealtToPlayer, ...dealtToDealer];
    const shoe = removeCards(dealShoe, dealt);
    const discards = [...openingDiscards, ...dealt];

    const state: State = {
      ...initialState(),
      hand: HAND,
      dealer: UPCARD,
      decision,
      beat: 4,
      shoe,
      discards,
      playOut: result,
      playOutModel: "finite-shoe",
    };

    const html = render(state);

    // The bug: `play.dealerRanks[1] ?? upcard` falls back to the upcard,
    // which then reads as though it were a distinct hole card the dealer
    // secretly held — even though the dealer never drew one. (Beat 4 has a
    // second, unrelated `.note` from the Running Count readout, so the
    // regression is checked by the exact sentence, not by "no .note at all".)
    expect(html).not.toContain("The hole card was");
  });

  it("still shows the reveal note when a hole card genuinely exists", () => {
    // The shipped default scenario: the dealer does draw a hole card.
    const state = beat4State("hit");
    const play = state.playOut!;
    expect(play.dealerRanks.length).toBeGreaterThan(1);

    const html = render(state);
    expect(html).toContain(`The hole card was ${play.dealerRanks[1]}`);
  });
});

describe("finding 2 — replaying the other Decision resets Act 2 free play alongside the Shoe", () => {
  it("never leaves a held free-play hand whose cards are simultaneously back in the Shoe", () => {
    let state = beat4State("hit");
    state = goToAct(state, 2);
    state = unlockFreePlay(state);
    state = hitFreePlay(state);
    state = nextHand(state);

    // A live free-play hand really is held going into the replay.
    expect(state.freePlayHand).not.toBeNull();
    expect(state.freePlayDealer).not.toBeNull();

    state = goToAct(state, 1);
    const replayed = replayWithOtherDecision(state);

    // The bug this guards against: if these fields survived the reset
    // untouched, the Shoe would be reset to the opening deal (returning every
    // card free play had dealt) while free play's own fields kept holding a
    // hand made of those exact cards — the same cards simultaneously "in the
    // shoe" and "held".
    expect(replayed.freePlayHand).toBeNull();
    expect(replayed.freePlayDealer).toBeNull();
    expect(replayed.freePlayResult).toBeNull();
    expect(replayed.act2FreePlay).toBe(false);

    // With nothing held, the Shoe's composition must be exactly the opening
    // deal's — no residue of free play's own depletion left behind, and no
    // card double-counted between "discarded" and "in the shoe".
    const expectedShoe = removeCards(freshShoe(), [...OPENING_HAND, ...OPENING_UPCARD]);
    expect(replayed.shoe).toEqual(expectedShoe);

    for (const rank of RANKS) {
      expect(discarded(replayed.shoe, rank) + replayed.shoe.composition[rank]).toBe(
        fullRank(replayed.shoe),
      );
    }
    expect(replayed.shoe.size - replayed.shoe.remaining).toBe(replayed.discards.length);
  });
});

describe("finding 8 — the odds pair is for the held hand only", () => {
  it("renders while a free-play hand is still undecided", () => {
    const state = freePlayState();
    expect(state.freePlayResult).toBeNull();
    const doc = parse(render(state));
    expect(doc.querySelector(".odds")).not.toBeNull();
  });

  it("is omitted once the free-play hand has settled", () => {
    let state = freePlayState();
    state = standFreePlay(state);
    expect(state.freePlayResult).toBeTruthy();

    const doc = parse(render(state));
    // The bug: a fallback to `freePlayResult?.playerRanks` kept `heldHand`
    // truthy after settlement, so the odds pair kept rendering beside a hand
    // that will never draw again — nonsensical once-off 0%/100% odds.
    expect(doc.querySelector(".odds")).toBeNull();
  });
});

describe("finding 9 — a settled dealer hand never visibly loses a card", () => {
  it("updates freePlayDealer to the full drawn hand once the dealer actually draws a hole card", () => {
    // The first free-play hand under `freePlayRng`: the dealer does not bust
    // and draws a genuine hole card, so `dealerRanks` grows from the upcard
    // alone to two cards — a case `state.freePlayDealer` staying frozen at
    // just the upcard (the pre-fix behaviour) would visibly get wrong.
    const state = hitFreePlay(freePlayState());
    const result = state.freePlayResult!;
    expect(result.dealerRanks.length).toBeGreaterThan(1);
    expect(state.freePlayDealer).toEqual(result.dealerRanks);
  });

  it("keeps two dealer cards on screen when the player busts before the dealer draws", () => {
    // Deterministic under `freePlayRng` (seeded from `discards.length`): the
    // first free-play hand settles without busting, the second busts on a
    // hit with the dealer never getting to draw a hole card.
    let state = freePlayState();
    state = hitFreePlay(state);
    state = nextHand(state);
    state = hitFreePlay(state);

    const result = state.freePlayResult!;
    // Confirms the fixture actually reaches the case this finding is about.
    expect(result.playerBusted).toBe(true);
    expect(result.dealerRanks).toHaveLength(1);

    // `state.ts` documents `freePlayDealer` as "filled to the full dealer
    // hand once freePlayResult is set" — on a bust that "full dealer hand"
    // is honestly just the one upcard, so this must equal `result.dealerRanks`
    // exactly, not silently stay frozen at whatever `dealFreePlayHand` dealt.
    expect(state.freePlayDealer).toEqual(result.dealerRanks);

    const doc = parse(render(state));
    const dealerSeat = seatFor(doc, "Dealer");
    // Two cards stayed on screen: the upcard, face up, and a face-down
    // placeholder for the hole card that was never dealt — not one card
    // visibly vanishing at the moment the hand settles, and not an invented
    // hole-card rank either (see finding 7's same principle, ADR 0001).
    expect(dealerSeat!.querySelectorAll(".card")).toHaveLength(2);
    expect(dealerSeat!.querySelectorAll(".card--back")).toHaveLength(1);
  });
});
