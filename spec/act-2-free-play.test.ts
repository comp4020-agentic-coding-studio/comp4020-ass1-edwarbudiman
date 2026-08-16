import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import {
  discarded,
  fullRank,
  RANKS,
  runningCount,
  type Rank,
} from "../src/engine/index.ts";
import { render } from "../src/explainer/render.ts";
import { initialState, type State } from "../src/explainer/state.ts";
import {
  goToAct,
  hitFreePlay,
  nextHand,
  selectRank,
  setModel,
  standFreePlay,
  unlockFreePlay,
} from "../src/explainer/transitions.ts";

// Act 2's free play (ticket 11). Prior art for the JSDOM approach is
// spec/act-2.test.ts. Every expected figure here is derived from the engine
// itself — see CONTEXT.md's "No hardcoded probabilities" and ADR 0002 — this
// file hardcodes no probability, count, or card of its own.

function parse(html: string) {
  return new JSDOM(html).window.document;
}

/** Act 2 with free play unlocked and its first hand dealt. */
function freePlayState(): State {
  return unlockFreePlay(goToAct(initialState(), 2));
}

describe("internal consistency (the ticket's done-when)", () => {
  it("discards + remaining equals a full rank, for every one of the thirteen ranks", () => {
    let state = freePlayState();
    // Push a little further so more than one hand's worth of cards has moved.
    state = standFreePlay(state);
    state = nextHand(state);

    const full = fullRank(state.shoe);
    for (const rank of RANKS) {
      expect(discarded(state.shoe, rank) + state.shoe.composition[rank]).toBe(full);
    }
  });

  it("per-rank counts in the shoe sum to exactly the cards remaining", () => {
    const state = freePlayState();
    const sum = RANKS.reduce((total, rank) => total + state.shoe.composition[rank], 0);
    expect(sum).toBe(state.shoe.remaining);
  });

  it("per-rank discard tallies sum to exactly the cards discarded", () => {
    let state = freePlayState();
    state = hitFreePlay(state);

    const sum = RANKS.reduce((total, rank) => total + discarded(state.shoe, rank), 0);
    expect(sum).toBe(state.shoe.size - state.shoe.remaining);
  });
});

describe("dealing a hand", () => {
  it("removes exactly the cards dealt from the Shoe and adds exactly those to discards", () => {
    const before = goToAct(initialState(), 2);
    const after = unlockFreePlay(before);

    // Exactly three cards are dealt to open a free-play hand: two to the
    // visitor, one dealer upcard — the same shape as Act 1's opening.
    expect(after.discards.length).toBe(before.discards.length + 3);
    expect(after.shoe.remaining).toBe(before.shoe.remaining - 3);

    const dealt = after.discards.slice(before.discards.length);
    expect(dealt).toEqual([...after.freePlayHand!, ...after.freePlayDealer!]);

    // Every card that left is accounted for in the Shoe's composition too.
    for (const rank of RANKS) {
      const dealtOfRank = dealt.filter((r) => r === rank).length;
      expect(before.shoe.composition[rank] - after.shoe.composition[rank]).toBe(
        dealtOfRank,
      );
    }
  });

  it("hitting or standing removes exactly the cards the Play-out actually added", () => {
    const dealt = freePlayState();
    const settled = standFreePlay(dealt);

    expect(settled.freePlayResult).toBeTruthy();
    const result = settled.freePlayResult!;
    const newlyDealt = [
      ...result.playerRanks.slice(dealt.freePlayHand!.length),
      ...result.dealerRanks.slice(dealt.freePlayDealer!.length),
    ];

    expect(settled.discards.length).toBe(dealt.discards.length + newlyDealt.length);
    expect(settled.shoe.remaining).toBe(dealt.shoe.remaining - newlyDealt.length);
    expect(settled.discards.slice(dealt.discards.length)).toEqual(newlyDealt);
  });
});

describe("Running Count", () => {
  it("after dealing a hand, equals runningCount(discards) computed independently", () => {
    const state = freePlayState();
    expect(state.runningCount).toBe(runningCount(state.discards));
  });

  it("after a full hand settles, still equals runningCount(discards)", () => {
    let state = freePlayState();
    state = hitFreePlay(state);
    expect(state.runningCount).toBe(runningCount(state.discards));

    state = nextHand(state);
    state = standFreePlay(state);
    expect(state.runningCount).toBe(runningCount(state.discards));
  });
});

describe("the high-water mark", () => {
  it("never decreases across a sequence of free-play transitions", () => {
    let state = freePlayState();
    let mark = state.runningCountHighWaterMark;
    expect(mark).toBe(state.runningCount);

    const steps: Array<(s: State) => State> = [
      (s) => hitFreePlay(s),
      (s) => nextHand(s),
      (s) => standFreePlay(s),
      (s) => nextHand(s),
      (s) => hitFreePlay(s),
      (s) => nextHand(s),
    ];

    for (const step of steps) {
      state = step(state);
      expect(state.runningCountHighWaterMark).toBeGreaterThanOrEqual(mark);
      expect(state.runningCountHighWaterMark).toBeGreaterThanOrEqual(state.runningCount);
      mark = state.runningCountHighWaterMark;
    }
  });
});

describe("the discard tray", () => {
  it("renders under Finite Shoe", () => {
    const state = setModel(freePlayState(), "finite-shoe");
    const doc = parse(render(state));
    expect(doc.querySelector(".tray")).toBeTruthy();
    expect(doc.querySelector(".tray-count")?.textContent).toContain(
      String(state.shoe.size - state.shoe.remaining),
    );
  });

  it("renders under Independent Draw too — same cards, same tray", () => {
    const state = setModel(freePlayState(), "independent-draw");
    const doc = parse(render(state));
    expect(doc.querySelector(".tray")).toBeTruthy();
    expect(doc.querySelector(".tray-count")?.textContent).toContain(
      String(state.shoe.size - state.shoe.remaining),
    );
  });

  it("its per-rank panel tallies sum to the same discard count shown on the stack", () => {
    const state = freePlayState();
    const doc = parse(render(state));
    const tallies = [...doc.querySelectorAll(".discard-axis .count span:not(.split)")].map(
      (el) => Number(el.textContent),
    );
    expect(tallies).toHaveLength(13);
    expect(tallies.reduce((a, b) => a + b, 0)).toBe(state.shoe.size - state.shoe.remaining);
  });
});

describe("the odds pair reflects the hand actually held", () => {
  it("differs from Act 1's frozen opening hand once free play has dealt its own", () => {
    const state = freePlayState();
    const doc = parse(render(state));

    // Act 2's own hand is on screen, not Act 1's sixteen-against-a-ten.
    const youSeat = [...doc.querySelectorAll(".seat")].find((seat) =>
      seat.querySelector(".total")?.textContent?.startsWith("You"),
    );
    const ranksShown = [...youSeat!.querySelectorAll(".card .rank")].map(
      (el) => el.textContent,
    );
    expect(ranksShown).toEqual(state.freePlayHand);
    expect(ranksShown).not.toEqual(state.hand);
  });

  it("updates once the hand settles, to the settled Play-out's own cards", () => {
    let state = freePlayState();
    state = hitFreePlay(state);
    const doc = parse(render(state));

    const youSeat = [...doc.querySelectorAll(".seat")].find((seat) =>
      seat.querySelector(".total")?.textContent?.startsWith("You"),
    );
    const ranksShown = [...youSeat!.querySelectorAll(".card .rank")].map(
      (el) => el.textContent,
    );
    expect(ranksShown).toEqual(state.freePlayResult!.playerRanks);
  });
});

describe("the Detail slot", () => {
  it("selecting a rank pins that rank's figures under the axis", () => {
    const target: Rank = "7";
    const state = selectRank(freePlayState(), target);
    const doc = parse(render(state));

    expect(state.act2SelectedRank).toBe(target);
    expect(doc.querySelector(".slot-rank")?.textContent).toContain("7");
    expect(doc.querySelector(".slot .expectation")).toBeTruthy();
  });

  it("the rank buttons are real buttons carrying aria-pressed for the selected rank", () => {
    const state = selectRank(freePlayState(), "A");
    const doc = parse(render(state));
    const pressed = doc.querySelector('.draw[aria-pressed="true"]');
    expect(pressed?.tagName).toBe("BUTTON");
    expect(pressed?.textContent).toBe("A");
  });
});

describe("the Running Count warning (stories 33/34)", () => {
  it("is on screen unconditionally, never behind a popover trigger", () => {
    const html = render(freePlayState());
    expect(html).toContain(
      "It does not say anything about the very next card.",
    );
    // Never phrased as though it forecasts what is coming.
    expect(html.toLowerCase()).not.toContain("the next card will be good");
  });
});

describe("transitions are deterministic", () => {
  it("the same starting State through the same sequence produces identical render output", () => {
    const run = () => {
      let state = unlockFreePlay(goToAct(initialState(), 2));
      state = hitFreePlay(state);
      state = nextHand(state);
      state = standFreePlay(state);
      return state;
    };

    const first = run();
    const second = run();

    expect(second).toEqual(first);
    expect(render(second)).toBe(render(first));
  });

  it("render(state) called twice on the same State returns identical output", () => {
    const state = freePlayState();
    expect(render(state)).toBe(render(state));
  });
});
