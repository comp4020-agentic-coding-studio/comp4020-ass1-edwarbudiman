import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { handTotal, settle, type Rank } from "../src/engine/index.ts";
import { formatSignedCount } from "../src/explainer/format.ts";
import { render } from "../src/explainer/render.ts";
import { initialState, type State } from "../src/explainer/state.ts";
import { goToAct } from "../src/explainer/transitions.ts";

// Act 3 (ticket 12): the closing Scripted Hand. Prior art for the JSDOM
// approach is spec/act-1.test.ts and spec/act-2.test.ts.

function parse(html: string) {
  return new JSDOM(html).window.document;
}

function act3State(): State {
  return goToAct(initialState(), 3);
}

/**
 * figures.json's "scripted" gives only these ranks. Every total and the
 * settlement below are derived from them with the same engine functions
 * `acts/act-3.ts` uses (`handTotal`, `settle`) — never hardcoded — so the
 * tests below regress if the Scripted Hand is ever "chosen" into being wrong.
 */
const SCRIPTED_YOUR_HAND: readonly Rank[] = ["10", "10"];
const SCRIPTED_DEALER_HAND: readonly Rank[] = ["6", "5", "10"];

/** A State reachable only by playing well past the opening deal — a session
 *  high strictly above whatever `act3State()` starts with. */
function stateAtHigherHighWaterMark(delta: number): State {
  const base = act3State();
  const mark = base.runningCountHighWaterMark + delta;
  return { ...base, runningCount: mark, runningCountHighWaterMark: mark };
}

describe("the Chosen, not dealt stamp", () => {
  it("is present at the state Act 1's opening hands off", () => {
    const doc = parse(render(act3State()));
    expect(doc.querySelector(".stamp")?.textContent).toBe("Chosen, not dealt");
  });

  it("is present under a state with a much higher session-high count too", () => {
    const doc = parse(render(stateAtHigherHighWaterMark(11)));
    expect(doc.querySelector(".stamp")?.textContent).toBe("Chosen, not dealt");
  });

  it("is present under a state with a lower (but still valid) session-high count", () => {
    const doc = parse(render(stateAtHigherHighWaterMark(0)));
    expect(doc.querySelector(".stamp")?.textContent).toBe("Chosen, not dealt");
  });
});

describe("the Scripted Hand is chosen, but not wrong", () => {
  it("deals exactly the ranks figures.json's scripted hand gives, dealer then you", () => {
    const doc = parse(render(act3State()));
    const hands = [...doc.querySelectorAll(".table .seat")].map((seat) =>
      [...seat.querySelectorAll(".card .rank")].map((el) => el.textContent),
    );
    expect(hands).toEqual([[...SCRIPTED_DEALER_HAND], [...SCRIPTED_YOUR_HAND]]);
  });

  it("computes both totals and the settlement from the engine, not a typed constant", () => {
    const yours = handTotal(SCRIPTED_YOUR_HAND);
    const dealer = handTotal(SCRIPTED_DEALER_HAND);
    const settlement = settle(yours.total, yours.busted, dealer.total, dealer.busted);

    // The arithmetic behind the ticket's own description: a good decision
    // standing on 20 against a dealer's 21, and it still loses.
    expect(yours.total).toBe(20);
    expect(dealer.total).toBe(21);
    expect(settlement).toBe("lost");

    const html = render(act3State());
    const doc = parse(html);

    const totals = [...doc.querySelectorAll(".table .total b")].map((el) => el.textContent);
    expect(totals).toEqual([String(dealer.total), String(yours.total)]);

    expect(html).toContain(`You stand on ${yours.total}`);
    expect(html).toContain(
      `The dealer turned a ${SCRIPTED_DEALER_HAND[0]} into ${dealer.total}`,
    );
    expect(html).toContain(`You ${settlement}.`);
  });
});

describe("the thesis", () => {
  it("is present verbatim, and is never inside a [popover]", () => {
    const doc = parse(render(act3State()));
    const thesis = doc.querySelector(".thesis");

    expect(thesis).toBeTruthy();
    expect(thesis!.textContent).toBe(
      "A good decision is not a promise of a good outcome.",
    );
    expect(thesis!.closest("[popover]")).toBeNull();
  });
});

describe("the Running Count's high-water mark", () => {
  it("is read from State, and a higher mark renders a different figure", () => {
    const low = act3State();
    const high = stateAtHigherHighWaterMark(7);

    const lowDoc = parse(render(low));
    const highDoc = parse(render(high));

    const lowValue = lowDoc.querySelector("#act3-count-value")?.textContent;
    const highValue = highDoc.querySelector("#act3-count-value")?.textContent;

    expect(lowValue).toBe(formatSignedCount(low.runningCountHighWaterMark));
    expect(highValue).toBe(formatSignedCount(high.runningCountHighWaterMark));
    expect(highValue).not.toBe(lowValue);
  });
});

describe("copy discipline: never the gambler's fallacy", () => {
  it("does not claim the visitor is about to win or is owed a result", () => {
    const doc = parse(render(act3State()));
    const text = doc.querySelector("#act-3")?.textContent ?? "";
    expect(text).not.toMatch(/due|about to win|guaranteed|sure thing|can't lose|cannot lose/i);
  });

  it("holds at a higher session-high count too", () => {
    const doc = parse(render(stateAtHigherHighWaterMark(11)));
    const text = doc.querySelector("#act-3")?.textContent ?? "";
    expect(text).not.toMatch(/due|about to win|guaranteed|sure thing|can't lose|cannot lose/i);
  });
});

describe("no play happens in Act 3", () => {
  it("offers no data-action controls — nothing here is a Decision", () => {
    const doc = parse(render(act3State()));
    expect(doc.querySelectorAll("[data-action]")).toHaveLength(0);
  });
});
