import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { render } from "../src/explainer/render.ts";
import { initialState, type State } from "../src/explainer/state.ts";
import {
  advanceBeat,
  advanceSimulation,
  decide,
  goToAct,
  selectRank,
  standFreePlay,
  unlockFreePlay,
} from "../src/explainer/transitions.ts";

// Ticket 13: keyboard, focus and screen reader pass. This file checks what is
// mechanically checkable from `render(state)`'s HTML string alone — a real
// keyboard/AT pass is not something JSDOM can stand in for, but "every action
// is a real button", "every chart has a text equivalent" and "ids are unique"
// all are.

function parse(html: string) {
  return new JSDOM(html).window.document;
}

// One state per beat of Act 1, plus Act 2 (locked and free play, mid-hand and
// settled), plus Act 3 — the full spread the ticket asks for.
function beat1(): State {
  return initialState();
}
function beat2(): State {
  return decide(initialState(), "hit");
}
function beat3(): State {
  return advanceBeat(decide(initialState(), "hit"));
}
function beat4(): State {
  return advanceBeat(advanceBeat(decide(initialState(), "hit")));
}
function act2Locked(): State {
  return goToAct(initialState(), 2);
}
function act2FreePlayMidHand(): State {
  return unlockFreePlay(goToAct(initialState(), 2));
}
function act2FreePlaySettled(): State {
  let state = unlockFreePlay(goToAct(initialState(), 2));
  state = standFreePlay(state);
  return state;
}
function act2FreePlayRankSelected(): State {
  return selectRank(unlockFreePlay(goToAct(initialState(), 2)), "3");
}
function act3(): State {
  return goToAct(initialState(), 3);
}

const states: Record<string, () => State> = {
  "act 1 beat 1": beat1,
  "act 1 beat 2": beat2,
  "act 1 beat 3": beat3,
  "act 1 beat 4": beat4,
  "act 2 locked": act2Locked,
  "act 2 free play (mid-hand)": act2FreePlayMidHand,
  "act 2 free play (settled)": act2FreePlaySettled,
  "act 2 free play (rank selected)": act2FreePlayRankSelected,
  act3,
};

describe("every [data-action] is a real, keyboard-activatable button", () => {
  for (const [name, build] of Object.entries(states)) {
    it(`holds for ${name}`, () => {
      const doc = parse(render(build()));
      const actionable = [...doc.querySelectorAll("[data-action]")];
      // Act 3 has no play (ticket 12) and so mints no `[data-action]` at all —
      // every other state must offer at least one.
      if (name !== "act3") expect(actionable.length).toBeGreaterThan(0);

      for (const el of actionable) {
        expect(el.tagName).toBe("BUTTON");
        expect(el.getAttribute("type")).toBe("button");
      }
    });
  }
});

describe("ids minted for action buttons are unique within a render", () => {
  for (const [name, build] of Object.entries(states)) {
    it(`holds for ${name}`, () => {
      const doc = parse(render(build()));
      const ids = [...doc.querySelectorAll("[data-action][id]")].map((el) => el.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  }
});

describe("charts carry a text equivalent, not only bars or colour", () => {
  it("the dealer histogram (beat 4) is visual-only and has a non-empty .vh description", () => {
    const doc = parse(render(beat4()));
    const chart = doc.querySelector(".hist");
    expect(chart?.getAttribute("aria-hidden")).toBe("true");
    expect((doc.querySelector(".vh")?.textContent ?? "").length).toBeGreaterThan(0);
  });

  it("the waffle (beat 4) carries its full composition as an accessible name", () => {
    const doc = parse(render(beat4()));
    const img = doc.querySelector('[role="img"]');
    const label = img?.getAttribute("aria-label") ?? "";
    expect(label.length).toBeGreaterThan(0);
    // The argument, not just numbers: it names what the marks are of.
    expect(label).toContain("play-outs");
  });

  it("the Act 1 draw strip (beat 2) has a .vh sentence naming which ranks survive and bust", () => {
    const doc = parse(render(beat2()));
    const text = doc.querySelector(".vh")?.textContent ?? "";
    expect(text.length).toBeGreaterThan(0);
    // The argument (which ranks), not only the aggregate proportion already
    // printed visibly below the chart.
    expect(text).toContain("Ace");
    expect(text).toMatch(/survive|alive/);
    expect(text).toMatch(/bust/);
  });

  it("Act 2's composition chart (locked) has a .vh text equivalent for the bars", () => {
    const doc = parse(render(act2Locked()));
    const bars = doc.querySelector(".axis-bars");
    expect(bars?.closest('[aria-hidden="true"]')).toBeTruthy();
    expect((doc.querySelector(".vh")?.textContent ?? "").length).toBeGreaterThan(0);
  });

  it("Act 2's composition chart (free play, interactive) has a .vh text equivalent too", () => {
    const doc = parse(render(act2FreePlayMidHand()));
    const bars = doc.querySelector(".axis-bars");
    expect(bars?.closest('[aria-hidden="true"]')).toBeTruthy();
    expect((doc.querySelector(".vh")?.textContent ?? "").length).toBeGreaterThan(0);
  });
});

describe("no interactive element relies on hover", () => {
  for (const [name, build] of Object.entries(states)) {
    it(`holds for ${name}`, () => {
      const html = render(build());
      // Every trigger in this codebase is click/tap (button, or native
      // popovertarget) — nothing here should carry a mouseover/mouseenter
      // handler or rely on a CSS-only hover reveal for content that matters.
      expect(html).not.toMatch(/onmouseover|onmouseenter|onhover/i);
    });
  }
});

describe("the settlement of a Decision is announced (story 49)", () => {
  it("Act 1 beat 3's settlement copy is in a status region", () => {
    const doc = parse(render(beat3()));
    const status = doc.querySelector('[role="status"]');
    expect(status).toBeTruthy();
    expect((status?.textContent ?? "").length).toBeGreaterThan(0);
  });

  it("free play's settlement copy is in a status region", () => {
    const doc = parse(render(act2FreePlaySettled()));
    const status = doc.querySelector('[role="status"]');
    expect(status).toBeTruthy();
    expect((status?.textContent ?? "").length).toBeGreaterThan(0);
  });

  it("beat 4's climb never introduces a fresh role=status per frame", () => {
    // Beat 4 re-renders every simulated frame (main.ts's climb) — nothing in
    // its own markup may be a live/status region, or a screen reader would
    // hear the counter every tick.
    const doc = parse(render(beat4()));
    expect(doc.querySelectorAll('[role="status"], [aria-live]')).toHaveLength(0);
  });
});

describe("focus restoration ids survive the transitions that keep their control", () => {
  it("the Deal Model buttons keep the same id whether Act 2 is locked or in free play", () => {
    const lockedDoc = parse(render(act2Locked()));
    const freeDoc = parse(render(act2FreePlayMidHand()));
    expect(lockedDoc.querySelector("#do-set-model-finite-shoe")).toBeTruthy();
    expect(freeDoc.querySelector("#do-set-model-finite-shoe")).toBeTruthy();
  });

  it("a rank-selection button keeps the same id across its own selection", () => {
    const before = parse(render(act2FreePlayMidHand()));
    const after = parse(render(act2FreePlayRankSelected()));
    expect(before.querySelector("#do-select-rank-3")).toBeTruthy();
    expect(after.querySelector("#do-select-rank-3")).toBeTruthy();
    expect(after.querySelector("#do-select-rank-3")?.getAttribute("aria-pressed")).toBe(
      "true",
    );
  });

  it("Hit/Stand ids do not survive into the next beat (control genuinely gone)", () => {
    const doc = parse(render(beat2()));
    expect(doc.querySelector("#do-decide-hit")).toBeNull();
    expect(doc.querySelector("#do-decide-stand")).toBeNull();
  });
});

describe("popover triggers keep a stable id across beat 4's climb", () => {
  // main.ts's `rerender()` restores focus by id, and beat 4 re-renders every
  // animation frame while the play-out fills (`tickClimb`). If a keyboard
  // visitor tabs to a `?` popover trigger mid-climb and that trigger has no
  // stable id, the very next frame's re-render cannot find it again and
  // yanks focus back to the section — every frame, for as long as the climb
  // runs. These triggers are rendered unconditionally regardless of
  // `playoutProgress`, so their ids must be identical at every point along
  // the climb, not just present once.
  it("the dealer '?' and Running Count '?' triggers have the same id at two different progress points", () => {
    const mid = advanceSimulation(beat4(), 200);
    const later = advanceSimulation(beat4(), 800);
    const midDoc = parse(render(mid));
    const laterDoc = parse(render(later));

    expect(midDoc.querySelector("#do-why-dealer")).toBeTruthy();
    expect(laterDoc.querySelector("#do-why-dealer")).toBeTruthy();
    expect(midDoc.querySelector("#do-how-count")).toBeTruthy();
    expect(laterDoc.querySelector("#do-how-count")).toBeTruthy();
  });
});

describe("the survive/bust distinction is available in text, not only via a class", () => {
  it("beat 2's draw strip states it outside of any classList", () => {
    const doc = parse(render(beat2()));
    const vh = doc.querySelector(".vh")?.textContent ?? "";
    const axisKey = doc.querySelector(".axis-key")?.textContent ?? "";
    // Between the hidden argument sentence and the visible proportion line,
    // the split is stated as text somewhere outside `.draw--bust`.
    expect(vh + axisKey).toMatch(/survive/);
    expect(vh + axisKey).toMatch(/bust/);
  });
});
