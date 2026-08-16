import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { render } from "../src/explainer/render.ts";
import { initialState } from "../src/explainer/state.ts";
import { decide } from "../src/explainer/transitions.ts";

// The spec's four contracts (spec.md -> "Testing Decisions").
//
// 2. The Draw math — for a hand of 16 the surviving rank set is exactly
//    {A,2,3,4,5} and the busting set is the other eight.
//    Already covered: spec/engine.test.ts, "the draw split for a sixteen".
// 3. The Deal Models differ — after a rank is dealt, its Draw probability is
//    strictly lower under Finite Shoe and exactly unchanged under
//    Independent Draw.
//    Already covered: spec/engine.test.ts, "drawProbability".
//
// This file covers the two contracts that need the seam to exist: 1 and 4.

function parse(html: string) {
  return new JSDOM(html).window.document;
}

describe("contract 1: the core interaction", () => {
  it("applying a Decision to a State produces render output that differs from before", () => {
    const before = initialState();
    const beforeHtml = render(before);

    const after = decide(before, "hit");
    const afterHtml = render(after);

    expect(afterHtml).not.toBe(beforeHtml);

    // Not just any difference — specifically, the visitor has moved past
    // beat 1's Hit/Stand choice: it is no longer on screen, because a
    // Decision was just recorded.
    const beforeDoc = parse(beforeHtml);
    const afterDoc = parse(afterHtml);
    expect(beforeDoc.querySelector('[data-action="decide"]')).toBeTruthy();
    expect(afterDoc.querySelector('[data-action="decide"]')).toBeNull();
  });

  it("holds for the other Decision too", () => {
    const before = initialState();
    const afterHtml = render(decide(before, "stand"));
    expect(afterHtml).not.toBe(render(before));
  });
});

describe("contract 4: resize safety", () => {
  it("render(state) is identical under two different reported viewport widths", () => {
    const state = initialState();

    const originalInnerWidth = Object.getOwnPropertyDescriptor(globalThis, "innerWidth");
    const originalMatchMedia = (globalThis as { matchMedia?: unknown }).matchMedia;

    try {
      Object.defineProperty(globalThis, "innerWidth", {
        configurable: true,
        value: 390,
      });
      (globalThis as { matchMedia?: unknown }).matchMedia = (query: string) => ({
        matches: false,
        media: query,
      });
      const narrow = render(state);

      Object.defineProperty(globalThis, "innerWidth", {
        configurable: true,
        value: 1920,
      });
      (globalThis as { matchMedia?: unknown }).matchMedia = (query: string) => ({
        matches: true,
        media: query,
      });
      const wide = render(state);

      expect(wide).toBe(narrow);
    } finally {
      if (originalInnerWidth) {
        Object.defineProperty(globalThis, "innerWidth", originalInnerWidth);
      } else {
        delete (globalThis as { innerWidth?: unknown }).innerWidth;
      }
      if (originalMatchMedia === undefined) {
        delete (globalThis as { matchMedia?: unknown }).matchMedia;
      } else {
        (globalThis as { matchMedia?: unknown }).matchMedia = originalMatchMedia;
      }
    }
  });

  // The half above is aspirational on its own — a render that happened not to
  // read innerWidth this time proves nothing about next time. This makes the
  // promise mechanical: no source file behind the seam may reference any of
  // these viewport-reading APIs at all.
  it("no file under src/explainer/ reads viewport dimensions", () => {
    const root = join(import.meta.dirname, "..", "src", "explainer");
    const forbidden = /innerWidth|matchMedia|clientWidth|getBoundingClientRect/;

    function tsFiles(dir: string): string[] {
      return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) return tsFiles(path);
        return entry.name.endsWith(".ts") ? [path] : [];
      });
    }

    for (const path of tsFiles(root)) {
      const source = readFileSync(path, "utf8");
      expect(forbidden.test(source), `${path} must not reference a viewport dimension`).toBe(
        false,
      );
    }
  });
});
