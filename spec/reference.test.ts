/**
 * Ticket 09 — the reference drawer and the two popover sizes.
 *
 * The drawer half runs against the BUILT site, exactly like
 * `spec/invariants.test.ts`: `<details>` is real markup in `index.html`
 * (CLAUDE.md's "static shell"), so it must survive being parsed with JSDOM
 * WITHOUT executing any script. Run `pnpm build` first — `pnpm check` does
 * this for you.
 *
 * The popover half is a unit test of `src/explainer/views/popover.ts`,
 * checked with the same JSDOM-parse approach as the rest of `spec/`.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";
import { notePopover, panelPopover } from "../src/explainer/views/popover.ts";

function parse(html: string) {
  return new JSDOM(html).window.document;
}

describe("the reference drawer (built dist/index.html, scripts not executed)", () => {
  const dom = new JSDOM(readFileSync(resolve("dist/index.html"), "utf8"));
  const doc = dom.window.document;

  it("is a real <details class=\"reference\">, present without any script running", () => {
    const drawer = doc.querySelector("details.reference");
    expect(drawer).toBeTruthy();
  });

  it("is keyboard-native rather than a modal: a <details>/<summary>, not a [popover]", () => {
    const drawer = doc.querySelector("details.reference");
    expect(drawer?.hasAttribute("popover")).toBe(false);
    expect(drawer?.querySelector("summary")).toBeTruthy();
  });

  it("defines all six terms", () => {
    const drawer = doc.querySelector("details.reference")!;
    const terms = [...drawer.querySelectorAll("dt")].map((dt) => dt.textContent?.trim());
    expect(terms).toEqual(["Shoe", "Upcard", "Push", "Draw", "Play-out", "Running Count"]);
  });

  it("every term has a definition", () => {
    const drawer = doc.querySelector("details.reference")!;
    const definitions = [...drawer.querySelectorAll("dd")];
    expect(definitions).toHaveLength(6);
    for (const dd of definitions) {
      expect(dd.textContent?.trim()).not.toBe("");
    }
  });

  it("states the Running Count in terms of what remains, never what comes next", () => {
    const drawer = doc.querySelector("details.reference")!;
    const dts = [...drawer.querySelectorAll("dt")];
    const runningCountDt = dts.find((dt) => dt.textContent?.trim() === "Running Count");
    const dd = runningCountDt?.nextElementSibling;

    expect(dd?.tagName).toBe("DD");
    const text = (dd?.textContent ?? "").replace(/\s+/g, " ").trim();
    expect(text).toMatch(/remains? in the shoe/i);
    expect(text).not.toMatch(/next card is (good|bad)/i);
  });

  it("lives near the end of .page, is present on every Act (no state needed)", () => {
    const page = doc.querySelector(".page");
    const drawer = page?.querySelector("details.reference");
    expect(page).toBeTruthy();
    expect(drawer).toBeTruthy();
    // Static markup outside <main id="acts">, so it renders whichever Act's
    // hash the page loaded on and needs no `render(state)` output to exist.
    expect(drawer?.closest("main#acts")).toBeNull();
  });
});

describe("notePopover", () => {
  const html = notePopover({
    id: "why-example",
    title: "Why this matters",
    body: "<p>Because the chart cannot say it.</p>",
    triggerLabel: "?",
    triggerAriaLabel: "Why this matters",
  });
  const doc = parse(`<div>${html}</div>`);

  it("emits a real <button popovertarget> whose target id exists in the returned markup", () => {
    const button = doc.querySelector("button[popovertarget]");
    expect(button).toBeTruthy();

    const targetId = button?.getAttribute("popovertarget");
    expect(targetId).toBe("why-example");
    expect(doc.getElementById(targetId!)).toBeTruthy();
  });

  it("the target is a native [popover], not a dialog or a custom widget", () => {
    const target = doc.getElementById("why-example");
    expect(target?.hasAttribute("popover")).toBe(true);
    expect(target?.tagName).toBe("DIV");
  });

  it("carries no hover-dependent activation", () => {
    expect(html).not.toMatch(/onmouseover|onmouseenter|:hover/i);
    const button = doc.querySelector("button[popovertarget]")!;
    expect(button.getAttribute("onmouseover")).toBeNull();
  });

  it("supports the inline word-as-trigger form", () => {
    const inlineHtml = notePopover({
      id: "why-push",
      title: "What a push means",
      body: "<p>Nothing changes hands.</p>",
      triggerLabel: "push?",
      inline: true,
    });
    const inlineDoc = parse(`<div>${inlineHtml}</div>`);
    const button = inlineDoc.querySelector("button[popovertarget]");
    expect(button?.className).toContain("why--inline");
    expect(button?.textContent).toBe("push?");
  });
});

describe("panelPopover", () => {
  const html = panelPopover({
    id: "how-example",
    title: "How this works",
    body: "<p>The full explanation.</p>",
  });
  const doc = parse(`<div>${html}</div>`);

  it("is a large centred [popover].panel with its own heading", () => {
    const panel = doc.getElementById("how-example");
    expect(panel?.hasAttribute("popover")).toBe(true);
    expect(panel?.classList.contains("panel")).toBe(true);
    expect(panel?.querySelector(".pop-title")?.textContent).toBe("How this works");
  });

  it("has a close button targeting its own id", () => {
    const closeButton = doc.querySelector(".panel-close");
    expect(closeButton).toBeTruthy();
    expect(closeButton?.getAttribute("popovertarget")).toBe("how-example");
    expect(closeButton?.getAttribute("popovertargetaction")).toBe("hide");
  });

  it("carries no hover-dependent activation", () => {
    expect(html).not.toMatch(/onmouseover|onmouseenter/i);
  });
});

// Esc-closes-and-returns-focus (the ticket's "Done when") is native browser
// behaviour with no JavaScript of ours involved — that is the point of this
// ticket — and JSDOM does not implement `[popover]` dismissal, so it is
// deliberately not asserted here.
