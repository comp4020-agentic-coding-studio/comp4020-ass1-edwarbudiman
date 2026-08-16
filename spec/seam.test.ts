import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { render } from "../src/explainer/render.ts";
import { initialState, type State } from "../src/explainer/state.ts";
import {
  advanceBeat,
  decide,
  goToAct,
  replayWithOtherDecision,
  setModel,
  unlockFreePlay,
} from "../src/explainer/transitions.ts";

// Ticket 03's seam: State, pure transitions, render(state) -> HTML string.
// Prior art is spec/invariants.test.ts — parse with JSDOM, query, assert.
// spec/contracts.test.ts covers the four spec contracts; this file covers the
// seam's own shape: hash routing, transition purity, and real buttons.

function parse(html: string) {
  return new JSDOM(html).window.document;
}

describe("hash routing lands in the right Act", () => {
  it("goToAct changes which Act's section is rendered", () => {
    const state = initialState();
    expect(parse(render(state)).querySelector("#act-1")).toBeTruthy();

    const act2 = goToAct(state, 2);
    const doc2 = parse(render(act2));
    expect(doc2.querySelector("#act-2")).toBeTruthy();
    expect(doc2.querySelector("#act-1")).toBeNull();

    const act3 = goToAct(state, 3);
    const doc3 = parse(render(act3));
    expect(doc3.querySelector("#act-3")).toBeTruthy();
  });

  it("preserves the hand, Shoe and Running Count across Acts", () => {
    const state = initialState();
    const moved = goToAct(state, 2);
    expect(moved.hand).toEqual(state.hand);
    expect(moved.shoe).toEqual(state.shoe);
    expect(moved.runningCount).toBe(state.runningCount);
  });
});

describe("transitions are pure", () => {
  // A deep clone taken before each transition, compared against the original
  // object afterwards — this is what "never mutate the input" means as an
  // assertion rather than an aspiration.
  function assertUnchanged(before: State, original: State): void {
    expect(before).toEqual(original);
  }

  it("decide does not mutate its input", () => {
    const state = initialState();
    const original = structuredClone(state);
    decide(state, "hit");
    assertUnchanged(state, original);
  });

  it("advanceBeat does not mutate its input", () => {
    const state = decide(initialState(), "hit");
    const original = structuredClone(state);
    advanceBeat(state);
    assertUnchanged(state, original);
  });

  it("goToAct does not mutate its input", () => {
    const state = initialState();
    const original = structuredClone(state);
    goToAct(state, 2);
    assertUnchanged(state, original);
  });

  it("setModel does not mutate its input", () => {
    const state = initialState();
    const original = structuredClone(state);
    setModel(state, "independent-draw");
    assertUnchanged(state, original);
  });

  it("unlockFreePlay does not mutate its input", () => {
    const state = goToAct(initialState(), 2);
    const original = structuredClone(state);
    unlockFreePlay(state);
    assertUnchanged(state, original);
  });

  it("replayWithOtherDecision does not mutate its input", () => {
    const state = decide(initialState(), "hit");
    const original = structuredClone(state);
    replayWithOtherDecision(state);
    assertUnchanged(state, original);
  });

  it("every transition returns a new object, not the same reference", () => {
    const state = initialState();
    expect(decide(state, "hit")).not.toBe(state);
    expect(advanceBeat(state)).not.toBe(state);
    expect(goToAct(state, 2)).not.toBe(state);
    expect(setModel(state, "independent-draw")).not.toBe(state);
    expect(unlockFreePlay(state)).not.toBe(state);
    expect(replayWithOtherDecision(state)).not.toBe(state);
  });
});

describe("every visitor action is a real button", () => {
  it("beat 1's Hit and Stand are <button> elements with data-action", () => {
    const doc = parse(render(initialState()));
    const actionable = [...doc.querySelectorAll("[data-action]")];

    expect(actionable.length).toBeGreaterThan(0);
    for (const element of actionable) {
      expect(element.tagName, `data-action="${element.getAttribute("data-action")}" must be a <button>`).toBe(
        "BUTTON",
      );
      expect(element.getAttribute("type")).toBe("button");
    }
  });

  it("Hit and Stand carry the decide action with the two offered Decisions", () => {
    const doc = parse(render(initialState()));
    const args = [...doc.querySelectorAll('[data-action="decide"]')].map((el) =>
      el.getAttribute("data-arg"),
    );
    expect(args.sort()).toEqual(["hit", "stand"]);
  });

  it("Hit and Stand share identical classes — same visual weight", () => {
    const doc = parse(render(initialState()));
    const buttons = [...doc.querySelectorAll('[data-action="decide"]')];
    expect(buttons).toHaveLength(2);
    expect(buttons[0]!.className).toBe(buttons[1]!.className);
  });
});
