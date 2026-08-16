import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import {
  bustSplit,
  freshShoe,
  makeRng,
  playOut,
  RANKS,
  SEED,
  settle,
  type PlayOut,
  type Table,
} from "../src/engine/index.ts";
import { formatPercent } from "../src/explainer/format.ts";
import { render } from "../src/explainer/render.ts";
import { initialState, type State } from "../src/explainer/state.ts";
import { advanceBeat, decide } from "../src/explainer/transitions.ts";

// Act 1, beats 2 and 3 (ticket 06). Beat 1 is covered by spec/contracts.test.ts
// and spec/seam.test.ts; this file covers what the visitor sees after
// deciding: every card that could come next, and their hand carried to
// settlement. Prior art for the JSDOM approach is spec/invariants.test.ts.

function parse(html: string) {
  return new JSDOM(html).window.document;
}

/** Beat 1's Hit button, taking the visitor to beat 2. */
function beat2State(): State {
  return decide(initialState(), "hit");
}

describe("beat 2 — every card that could come next", () => {
  it("shows exactly thirteen Draws, Ace-first, five surviving and eight busting", () => {
    const doc = parse(render(beat2State()));
    const draws = [...doc.querySelectorAll(".axis-row .draw")];

    expect(draws).toHaveLength(13);
    expect(draws.map((el) => el.textContent)).toEqual([...RANKS]);

    const surviving = draws.filter((el) => !el.classList.contains("draw--bust"));
    const busting = draws.filter((el) => el.classList.contains("draw--bust"));

    // A, 2, 3, 4, 5 survive a sixteen; the other eight bust it. Order must
    // stay Ace-first — see CONTEXT.md and docs/adr/0003.
    expect(surviving.map((el) => el.textContent)).toEqual(["A", "2", "3", "4", "5"]);
    expect(busting.map((el) => el.textContent)).toEqual([
      "6",
      "7",
      "8",
      "9",
      "10",
      "J",
      "Q",
      "K",
    ]);
  });

  it("states the survive/bust split as the percentages bustSplit computes from the state's own Shoe", () => {
    const state = beat2State();
    const split = bustSplit(state.hand, state.shoe, state.model);
    const html = render(state);

    expect(html).toContain(
      `${split.surviving.length} / 13 survive · ${formatPercent(split.surviveChance)}`,
    );
    expect(html).toContain(
      `${split.busting.length} / 13 bust · ${formatPercent(split.bustChance)}`,
    );

    // The regression this ticket calls out by name: a fresh Shoe reads
    // 38.5%/61.5%, not 38.8%/61.2%, because it has not had the three visible
    // cards removed from it. Prove the rendered figure is NOT that one.
    const freshSplit = bustSplit(state.hand, freshShoe(), state.model);
    expect(formatPercent(split.surviveChance)).not.toBe(
      formatPercent(freshSplit.surviveChance),
    );
  });

  it("says the one sentence the chart cannot say", () => {
    const html = render(beat2State());
    expect(html).toContain("Both choices lose more often than they win");
    expect(html).toContain("better Decision is the one that loses less");
  });

  it("offers a click-only ? popover on why standing does not help", () => {
    const doc = parse(render(beat2State()));
    const trigger = doc.querySelector(".why");

    expect(trigger?.tagName).toBe("BUTTON");
    expect(trigger?.getAttribute("type")).toBe("button");
    expect(trigger?.getAttribute("popovertarget")).toBe("why-stand");

    const note = doc.querySelector("#why-stand");
    expect(note?.hasAttribute("popover")).toBe(true);
    expect(note?.textContent).toContain("Standing does not avoid the loss");
  });

  it("advances to beat 3 with a real 'Play my hand' button", () => {
    const doc = parse(render(beat2State()));
    const button = doc.querySelector('[data-action="advance-beat"]');

    expect(button?.tagName).toBe("BUTTON");
    expect(button?.getAttribute("type")).toBe("button");
    expect(button?.textContent).toBe("Play my hand");
  });
});

describe("beat 3 — your hand, dealt honestly", () => {
  it("deals the Play-out in the transition, and renders the settlement the engine actually produced", () => {
    const afterDecision = beat2State();
    const table: Table = {
      hand: afterDecision.hand,
      dealer: afterDecision.dealer,
      shoe: afterDecision.shoe,
      model: afterDecision.model,
    };
    const expected = playOut(table, "hit", makeRng(SEED));

    const state = advanceBeat(afterDecision);
    expect(state.playOut).toEqual(expected);
    expect(state.beat).toBe(3);

    const doc = parse(render(state));
    expect(doc.querySelector(".total b")?.textContent).toBe(String(expected.playerTotal));
    expect(doc.querySelector(".data")?.textContent).toBe("Dealt from the shoe. Not chosen.");

    // At the shipped seed, hitting sixteen against a ten wins — the winning
    // copy is not a rare edge case here, it is what most visitors will read.
    expect(expected.settlement).toBe("won");
    const copy = doc.querySelector(".lede")?.textContent ?? "";
    expect(copy).toContain("does not prove the Decision was good");
    expect(copy).not.toContain("You busted");
  });

  it("removes any further Decision, Draw or advance-beat happening twice — beat 3 shows only its own advance button", () => {
    const state = advanceBeat(beat2State());
    const doc = parse(render(state));
    const buttons = [...doc.querySelectorAll("[data-action]")];

    expect(buttons).toHaveLength(1);
    expect(buttons[0]!.getAttribute("data-action")).toBe("advance-beat");
    expect(buttons[0]!.textContent).toBe("Show me 1,000 more hands");
  });

  it("updates the Shoe, discards and Running Count to match only the cards actually dealt", () => {
    const before = beat2State();
    const after = advanceBeat(before);

    const dealt = after.discards.length - before.discards.length;
    // The transition dealt at least the dealer's hole card, and exactly the
    // cards the stored Play-out says left the table.
    expect(dealt).toBeGreaterThan(0);
    expect(after.shoe.remaining).toBe(before.shoe.remaining - dealt);
    expect(after.discards.slice(0, before.discards.length)).toEqual(before.discards);
  });

  describe("copy branches on the actual result", () => {
    function withPlayOut(overrides: {
      playerRanks: string[];
      playerTotal: number;
      playerBusted: boolean;
      dealerRanks: string[];
      dealerTotal: number;
      dealerBusted: boolean;
    }): State {
      const settlement = settle(
        overrides.playerTotal,
        overrides.playerBusted,
        overrides.dealerTotal,
        overrides.dealerBusted,
      );
      const play: PlayOut = { ...overrides, settlement } as PlayOut;
      return { ...beat2State(), beat: 3, playOut: play };
    }

    it("busted: told they made the better Decision and still lost", () => {
      const state = withPlayOut({
        playerRanks: ["10", "6", "9"],
        playerTotal: 25,
        playerBusted: true,
        dealerRanks: ["10"],
        dealerTotal: 10,
        dealerBusted: false,
      });
      const html = render(state);
      const doc = parse(html);

      expect(html).toContain("You busted");
      expect(html).toContain("better Decision");
      expect(doc.querySelector(".card--bust")).toBeTruthy();
    });

    it("won: told winning does not prove the Decision was good either", () => {
      const state = withPlayOut({
        playerRanks: ["10", "6", "4"],
        playerTotal: 20,
        playerBusted: false,
        dealerRanks: ["10", "8"],
        dealerTotal: 18,
        dealerBusted: false,
      });
      expect(render(state)).toContain("does not prove the Decision was good");
    });

    it("lost without busting: told not busting is not the same as winning", () => {
      const state = withPlayOut({
        playerRanks: ["10", "6", "3"],
        playerTotal: 19,
        playerBusted: false,
        dealerRanks: ["10", "10"],
        dealerTotal: 20,
        dealerBusted: false,
      });
      const html = render(state);

      expect(html).toContain("without busting");
      expect(html).not.toContain("You busted");
    });

    it("push: told a push proves the Decision no more right than a loss would prove it wrong", () => {
      const state = withPlayOut({
        playerRanks: ["10", "6", "3"],
        playerTotal: 19,
        playerBusted: false,
        dealerRanks: ["10", "9"],
        dealerTotal: 19,
        dealerBusted: false,
      });
      expect(render(state)).toContain("push");
    });
  });
});

describe("every visitor action across beats 2 and 3 is a real button", () => {
  it("every [data-action] element is a <button type=\"button\">", () => {
    const docs = [
      parse(render(beat2State())),
      parse(render(advanceBeat(beat2State()))),
    ];

    for (const doc of docs) {
      const actionable = [...doc.querySelectorAll("[data-action]")];
      expect(actionable.length).toBeGreaterThan(0);
      for (const element of actionable) {
        expect(element.tagName).toBe("BUTTON");
        expect(element.getAttribute("type")).toBe("button");
      }
    }
  });
});
