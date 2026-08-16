import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import {
  bustSplit,
  dealerDistribution,
  freshShoe,
  removeCards,
  simulate,
  simulateTrials,
  type PlayOut,
} from "../src/engine/index.ts";
import { formatPercent } from "../src/explainer/format.ts";
import { render } from "../src/explainer/render.ts";
import {
  initialState,
  OPENING_HAND,
  OPENING_UPCARD,
  PLAYOUT_TRIALS,
  type State,
} from "../src/explainer/state.ts";
import { advanceBeat, decide } from "../src/explainer/transitions.ts";

// Act 1 beat 4 (ticket 07): the thousand Play-outs and the Running Count's
// first appearance. Every expected figure below is derived from the engine
// itself, never hardcoded — see CLAUDE.md's "no hardcoded probabilities".

function parse(html: string) {
  return new JSDOM(html).window.document;
}

/** Beat 4, reached honestly: decide, deal to settlement, advance once more. */
function beat4State(decision: "hit" | "stand" = "hit"): State {
  return advanceBeat(advanceBeat(decide(initialState(), decision)));
}

/** The shoe as it stood at the moment of decision — before the Play-out's own
 *  dealt cards left it. `state.hand`/`state.dealer` never change through Act
 *  1, so this is reconstructable from the same opening constants `state.ts`
 *  itself deals from. */
const openingShoe = removeCards(freshShoe(), [...OPENING_HAND, ...OPENING_UPCARD]);

describe("beat 4 — the dealer's hand, hole card turned over", () => {
  it("reveals the dealer's full hand, total, and notes beat 1 only showed the upcard", () => {
    const state = beat4State();
    const play = state.playOut!;
    const doc = parse(render(state));

    const seat = doc.querySelector(".seat");
    expect(seat?.querySelector(".total")?.textContent).toContain(String(play.dealerTotal));

    const note = doc.querySelector(".note")?.textContent ?? "";
    expect(note).toContain(`The hole card was ${play.dealerRanks[1]}`);
    expect(note).toContain(state.dealer[0]!);
  });
});

describe("beat 4 — the odds pair, computed not typed", () => {
  it("states the same survive/bust split beat 2 read, from the opening shoe", () => {
    const state = beat4State();
    const split = bustSplit(state.hand, openingShoe, state.model);
    const html = render(state);
    const doc = parse(html);

    expect(html).toContain(formatPercent(split.surviveChance));
    expect(html).toContain(formatPercent(split.bustChance));

    const miss = doc.querySelector(".odds .miss");
    expect(miss?.textContent).toContain("It could have busted");
    expect(miss?.textContent).toContain(formatPercent(split.bustChance));
  });
});

describe("beat 4 — the dealer histogram", () => {
  it("comes from dealerDistribution, never from the settlement run", () => {
    const state = beat4State();
    const expectedDist = dealerDistribution(
      state.dealer,
      openingShoe,
      state.model,
      PLAYOUT_TRIALS,
    );
    const settlementRun = simulate(
      { hand: state.hand, dealer: state.dealer, shoe: freshShoe(), model: state.model },
      "hit",
      PLAYOUT_TRIALS,
    );

    // The regression this ticket calls out by name: a busted player never
    // lets the dealer play, so the settlement run's own dealer totals are
    // silently conditioned on "hands where the visitor did not bust" — prove
    // the rendered figures are the (unconditioned) dealerDistribution ones,
    // not those.
    expect(expectedDist.totals).not.toEqual(settlementRun.dealerTotals);

    const html = render(state);
    for (const bucket of ["17", "18", "19", "20", "21", "bust"] as const) {
      expect(html).toContain(formatPercent(expectedDist.totals[bucket] / PLAYOUT_TRIALS));
    }

    // Ground truth at the shipped seed (.scratch/blackjack-explainer/figures.json).
    expect(expectedDist.totals).toEqual({
      "17": 109,
      "18": 118,
      "19": 110,
      "20": 332,
      "21": 126,
      bust: 205,
    });
  });

  it("is visual only, and reaches assistive tech through a text equivalent, never a visible paragraph", () => {
    const state = beat4State();
    const doc = parse(render(state));

    const chart = doc.querySelector(".hist");
    expect(chart?.getAttribute("aria-hidden")).toBe("true");

    const text = doc.querySelector(".vh")?.textContent ?? "";
    expect(text.length).toBeGreaterThan(0);
    expect(text).toContain(formatPercent(109 / PLAYOUT_TRIALS));
    expect(text).toContain(formatPercent(332 / PLAYOUT_TRIALS));

    // The explanation of what the chart means is a popover, not prose on the
    // page — the visible copy around the chart must not restate the figures.
    const visibleParas = [...doc.querySelectorAll("p:not(.vh)")].map(
      (el) => el.textContent ?? "",
    );
    expect(visibleParas.some((t) => t.includes(formatPercent(332 / PLAYOUT_TRIALS)))).toBe(
      false,
    );
  });
});

describe("beat 4 — the waffle", () => {
  function expectedTrials(decision: "hit" | "stand"): PlayOut[] {
    return simulateTrials(
      { hand: OPENING_HAND, dealer: OPENING_UPCARD, shoe: freshShoe(), model: "finite-shoe" },
      decision,
      PLAYOUT_TRIALS,
    );
  }

  it("draws exactly 1,000 marks, and the visitor's own hand is trial zero of the same run", () => {
    const state = beat4State();
    const trials = expectedTrials("hit");

    expect(trials).toHaveLength(PLAYOUT_TRIALS);
    expect(trials[0]).toEqual(state.playOut);

    const doc = parse(render({ ...state, playoutProgress: PLAYOUT_TRIALS }));
    const marks = [...doc.querySelectorAll(".waffle > span")];
    expect(marks).toHaveLength(PLAYOUT_TRIALS);

    const yours = marks[0]!;
    expect(yours.classList.contains("you")).toBe(true);
    expect(yours.classList.contains(state.playOut!.settlement)).toBe(true);
  });

  it("fills exactly playoutProgress marks and leaves the rest pending", () => {
    const state = beat4State();
    const progress = 250;
    const doc = parse(render({ ...state, playoutProgress: progress }));
    const marks = [...doc.querySelectorAll(".waffle > span")];

    expect(marks).toHaveLength(PLAYOUT_TRIALS);
    const filled = marks.filter((el) => !el.classList.contains("pending"));
    const pending = marks.filter((el) => el.classList.contains("pending"));
    expect(filled).toHaveLength(progress);
    expect(pending).toHaveLength(PLAYOUT_TRIALS - progress);
  });

  it("has a text equivalent describing the full 1,000-trial composition", () => {
    const state = beat4State();
    const trials = expectedTrials("hit");
    const settlements = { lost: 0, push: 0, won: 0 };
    for (const t of trials) settlements[t.settlement]++;

    const doc = parse(render({ ...state, playoutProgress: 10 }));
    const img = doc.querySelector('[role="img"]');
    const label = img?.getAttribute("aria-label") ?? "";

    expect(label).toContain(String(settlements.lost));
    expect(label).toContain(String(settlements.won));
    expect(label).toContain(String(settlements.push));

    // Ground truth settlements for "hit" at the shipped seed.
    expect(settlements).toEqual({ lost: 757, push: 57, won: 186 });
  });

  it("matches the ground-truth Play-out for the visitor's own hand", () => {
    const state = beat4State();
    expect(state.playOut).toMatchObject({
      playerRanks: ["10", "6", "4"],
      playerTotal: 20,
      dealerRanks: ["10", "8"],
      dealerTotal: 18,
      settlement: "won",
    });
  });
});

describe("beat 4 — the count arrives", () => {
  it("shows the Running Count readout here, and nowhere in beats 1 through 3", () => {
    const decided = decide(initialState(), "hit");
    const dealt = advanceBeat(decided);
    const beat4 = advanceBeat(dealt);

    for (const state of [initialState(), decided, dealt]) {
      const doc = parse(render(state));
      expect(doc.querySelector(".readout")).toBeNull();
    }

    const doc = parse(render(beat4));
    const readout = doc.querySelector(".readout");
    expect(readout).not.toBeNull();
    expect(readout?.textContent).toContain("Running count");
  });

  it("puts the Hi-Lo rule behind a ? opening a large panel with the annotated rank axis", () => {
    const doc = parse(render(beat4State()));
    const trigger = doc.querySelector(".readout .why");
    expect(trigger?.getAttribute("popovertarget")).toBe("how-count");

    const panel = doc.querySelector("#how-count");
    expect(panel?.classList.contains("panel")).toBe(true);
    expect(panel?.hasAttribute("popover")).toBe(true);

    const axisRows = panel?.querySelectorAll(".axis-row") ?? [];
    expect(axisRows.length).toBe(2);
    expect(panel?.querySelectorAll(".axis-row")[0]?.textContent).toContain("A");
  });

  it("offers Try the other decision as a real button", () => {
    const doc = parse(render(beat4State()));
    const button = doc.querySelector('[data-action="replay-other-decision"]');
    expect(button?.tagName).toBe("BUTTON");
    expect(button?.getAttribute("type")).toBe("button");
    expect(button?.textContent).toBe("Try the other decision");
  });
});
