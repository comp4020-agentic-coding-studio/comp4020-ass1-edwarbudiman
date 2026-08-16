import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import {
  discarded,
  drawProbability,
  fullRank,
  RANKS,
  type Shoe,
} from "../src/engine/index.ts";
import { formatPercent } from "../src/explainer/format.ts";
import { render } from "../src/explainer/render.ts";
import { initialState, type State } from "../src/explainer/state.ts";
import { goToAct, setModel } from "../src/explainer/transitions.ts";

// Act 2's locked opening (ticket 10). Prior art for the JSDOM approach is
// spec/act-1.test.ts and spec/seam.test.ts.

function parse(html: string) {
  return new JSDOM(html).window.document;
}

/** Act 2's locked opening, from the state Act 1 hands off. */
function act2State(): State {
  return goToAct(initialState(), 2);
}

/** The rank `renderAct2` features in its before-and-after slot — mirrors
 *  `mostDepletedRank` in `acts/act-2.ts` without importing an internal. */
function mostDepletedRank(shoe: Shoe) {
  return RANKS.reduce((thinnest, rank) =>
    shoe.composition[rank] < shoe.composition[thinnest] ? rank : thinnest,
  );
}

describe("the locked opening", () => {
  it("shows the same hand Act 1 handed off, not the opening deal", () => {
    const state = act2State();
    const doc = parse(render(state));

    const locked = doc.querySelector(".locked");
    expect(locked).toBeTruthy();
    expect(locked!.querySelector(".locked-flag")).toBeTruthy();

    const ranksShown = [...locked!.querySelectorAll(".card .rank")].map(
      (el) => el.textContent,
    );
    expect(ranksShown).toEqual(state.hand);
  });

  it("says nothing here moves except the Deal Model", () => {
    const html = render(act2State());
    expect(html).toContain("Nothing here moves except the Deal Model");
  });
});

describe("the Deal Model controls", () => {
  it("are two real <button>s carrying aria-pressed, exactly one pressed", () => {
    const doc = parse(render(act2State()));
    const models = [...doc.querySelectorAll(".model")];

    expect(models).toHaveLength(2);
    for (const button of models) {
      expect(button.tagName).toBe("BUTTON");
      expect(button.getAttribute("type")).toBe("button");
      expect(["true", "false"]).toContain(button.getAttribute("aria-pressed"));
    }

    const pressed = models.filter((el) => el.getAttribute("aria-pressed") === "true");
    expect(pressed).toHaveLength(1);
  });

  it("name Finite shoe and Independent draw in plain language, each with a description", () => {
    const doc = parse(render(act2State()));
    const models = [...doc.querySelectorAll(".model")];
    const names = models.map((el) => el.querySelector(".name")?.textContent ?? "");

    expect(names.some((name) => name.includes("Finite shoe"))).toBe(true);
    expect(names.some((name) => name.includes("Independent draw"))).toBe(true);
    for (const button of models) {
      expect(button.querySelector("small")?.textContent?.length).toBeGreaterThan(0);
    }
  });

  it("carry set-model with the two real DealModel args, ids matching actionButton's shape", () => {
    const doc = parse(render(act2State()));
    const models = [...doc.querySelectorAll('[data-action="set-model"]')];
    const args = models.map((el) => el.getAttribute("data-arg")).sort();

    expect(args).toEqual(["finite-shoe", "independent-draw"]);
    for (const button of models) {
      expect(button.id).toBe(`do-set-model-${button.getAttribute("data-arg")}`);
    }
  });

  it("defaults to Finite shoe pressed, matching the initial State's model", () => {
    const state = act2State();
    expect(state.model).toBe("finite-shoe");

    const doc = parse(render(state));
    const pressed = doc.querySelector('.model[aria-pressed="true"]');
    expect(pressed?.querySelector(".name")?.textContent).toContain("Finite shoe");
  });

  it("toggling the model with nothing else changing produces different rendered output", () => {
    const state = act2State();
    const finiteHtml = render(state);
    const independentHtml = render(setModel(state, "independent-draw"));

    expect(independentHtml).not.toBe(finiteHtml);
  });
});

describe("the Shoe's remaining count", () => {
  it("shows the count and a thinning stack, not a progress bar", () => {
    const state = act2State();
    const doc = parse(render(state));

    expect(doc.querySelector(".meter-head b")?.textContent).toContain(
      String(state.shoe.remaining),
    );
    expect(doc.querySelector(".shoe .remaining")).toBeTruthy();
    expect(doc.querySelector(".shoe .spent")).toBeTruthy();
  });
});

describe("the composition chart", () => {
  it("renders thirteen bars in Ace-first order on the shared axis", () => {
    const doc = parse(render(act2State()));
    const bars = [...doc.querySelectorAll(".axis-bars .bar")];
    expect(bars).toHaveLength(13);

    const labelRows = [...doc.querySelectorAll(".axis-row .draw")];
    expect(labelRows.map((el) => el.textContent)).toEqual([...RANKS]);
  });

  it("shows a dashed full-rank reference and labels the full-rank count", () => {
    const state = act2State();
    const doc = parse(render(state));
    const full = fullRank(state.shoe);
    expect(doc.querySelector(".axis-full-label")?.textContent).toContain(String(full));
  });

  it("under Finite Shoe, bars reflect the actual composition (not all full height)", () => {
    const state = act2State();
    const full = fullRank(state.shoe);
    const doc = parse(render(state));
    const heights = [...doc.querySelectorAll(".axis-bars .bar")].map((el) =>
      parseFloat((el as HTMLElement).style.height),
    );

    // The opening deal removed two 10s and a 6 — at least one rank must read
    // below a full rank's height once Finite Shoe is selected.
    expect(heights.some((height) => height < 100)).toBe(true);
    expect(state.shoe.composition["10"]).toBeLessThan(full);
  });

  it("under Independent Draw, every bar returns to a full rank regardless of what was dealt", () => {
    const state = setModel(act2State(), "independent-draw");
    const doc = parse(render(state));
    const heights = [...doc.querySelectorAll(".axis-bars .bar")].map((el) =>
      parseFloat((el as HTMLElement).style.height),
    );

    for (const height of heights) {
      expect(height).toBeCloseTo(100, 5);
    }
  });
});

describe("the before-and-after rank probability (story 27)", () => {
  it("is strictly lower under Finite Shoe once a card of that rank has been dealt", () => {
    const state = act2State();
    const rank = mostDepletedRank(state.shoe);
    const full = fullRank(state.shoe);

    const before = full / state.shoe.size;
    const after = drawProbability(state.shoe, rank, "finite-shoe");

    expect(discarded(state.shoe, rank)).toBeGreaterThan(0);
    expect(after).toBeLessThan(before);

    const html = render(setModel(state, "finite-shoe"));
    expect(html).toContain(formatPercent(before));
    expect(html).toContain(formatPercent(after));
  });

  it("is exactly unchanged under Independent Draw", () => {
    const state = setModel(act2State(), "independent-draw");
    const rank = mostDepletedRank(state.shoe);
    const full = fullRank(state.shoe);

    const before = full / state.shoe.size;
    const after = drawProbability(state.shoe, rank, "independent-draw");

    expect(after).toBe(before);

    const html = render(state);
    expect(html).toContain(formatPercent(before));
    // Only one figure should be needed here since before and after coincide.
    expect(formatPercent(before)).toBe(formatPercent(after));
  });
});

describe("Unlock free play", () => {
  it("is a real button, and a placeholder appears once act2FreePlay flips", () => {
    const state = act2State();
    const doc = parse(render(state));
    const button = doc.querySelector('[data-action="unlock-free-play"]');

    expect(button?.tagName).toBe("BUTTON");
    expect(button?.getAttribute("type")).toBe("button");

    const unlocked = { ...state, act2FreePlay: true };
    const unlockedDoc = parse(render(unlocked));
    expect(unlockedDoc.querySelector(".locked")).toBeNull();
    expect(unlockedDoc.querySelector("#act-2")).toBeTruthy();
  });
});
