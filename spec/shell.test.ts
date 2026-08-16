import { JSDOM } from "jsdom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { formatSignedCount } from "../src/explainer/format.ts";
import { initialState, type State } from "../src/explainer/state.ts";
import {
  advanceBeat,
  decide,
  goToAct,
  nextHand,
  reachedNewHighWaterMark,
  standFreePlay,
  unlockFreePlay,
} from "../src/explainer/transitions.ts";

/**
 * `main.ts` is the thin shell OUTSIDE the seam (CLAUDE.md's "one seam"): the
 * State/transitions/render triangle is already covered by spec/seam.test.ts
 * and friends. This file covers only the shell's own two confirmed defects
 * (findings 3 and 4 of the shell-defects ticket): the Act 3 offer's gating,
 * and focus restoration being scoped to `#acts`.
 *
 * Unlike the rest of spec/, this runs main.ts as a real module against a real
 * (jsdom) DOM rather than parsing rendered HTML — this file's whole subject
 * is what main.ts does to the DOM around a render, which a string-parse
 * can't see. Every expected outcome below is computed from the real,
 * already-tested seam functions (`reachedNewHighWaterMark` and friends), not
 * hardcoded, per CLAUDE.md's "No hardcoded probabilities" spirit.
 */

// A trimmed stand-in for index.html: only the elements main.ts actually reads
// or writes (`document.getElementById`/`querySelectorAll`). Real markup and
// copy stay in index.html; duplicating it here would just be a second, more
// fragile copy of the same shell.
const SHELL_HTML = `<!doctype html>
<html lang="en">
  <body>
    <button id="theme" type="button">Night</button>
    <nav aria-label="Acts">
      <ol>
        <li><a href="#act-1">1 &middot; How blackjack works</a></li>
        <li><a href="#act-2">2 &middot; Two kinds of blackjack</a></li>
        <li><a href="#act-3">3 &middot; The conclusion</a></li>
      </ol>
    </nav>
    <div id="act3-offer" hidden>
      <p class="offer-text">New high &mdash; <b id="act3-offer-count">+0</b></p>
      <a id="act3-offer-link" href="#act-3">Go to Act 3</a>
      <button id="act3-offer-dismiss" type="button">&times;</button>
    </div>
    <main id="acts"></main>
    <details class="reference"><summary id="ref-summary">Reference</summary></details>
  </body>
</html>`;

let dom: JSDOM;

/** Sets up a fresh jsdom document as the global DOM main.ts's module-scope
 *  code reads at import time, and stubs the browser APIs it reads that jsdom
 *  otherwise leaves unimplemented. `prefers-reduced-motion` is forced true so
 *  beat 4's climb (finding 5 — not this file's subject) always takes the
 *  single-render branch: this file has no animation frames to give it, and
 *  the climb's own behaviour is exercised elsewhere. */
function installGlobals(): void {
  dom = new JSDOM(SHELL_HTML, { url: "https://explainer.test/" });
  const { window } = dom;

  Object.assign(globalThis, {
    window,
    document: window.document,
    location: window.location,
    HTMLElement: window.HTMLElement,
    HTMLAnchorElement: window.HTMLAnchorElement,
    MutationObserver: window.MutationObserver,
  });

  (globalThis as unknown as { matchMedia: (q: string) => MediaQueryList }).matchMedia = (
    query: string,
  ) =>
    ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;

  (
    globalThis as unknown as { requestAnimationFrame: (cb: FrameRequestCallback) => number }
  ).requestAnimationFrame = (cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 0) as unknown as number;
  (globalThis as unknown as { cancelAnimationFrame: (id: number) => void }).cancelAnimationFrame = (
    id: number,
  ) => clearTimeout(id as unknown as ReturnType<typeof setTimeout>);
}

function uninstallGlobals(): void {
  for (const key of [
    "window",
    "document",
    "location",
    "HTMLElement",
    "HTMLAnchorElement",
    "MutationObserver",
    "matchMedia",
    "requestAnimationFrame",
    "cancelAnimationFrame",
  ]) {
    delete (globalThis as Record<string, unknown>)[key];
  }
  dom?.window.close();
}

/** Fresh globals, then a fresh import of main.ts — `vi.resetModules()` makes
 *  the dynamic import below re-run main.ts's module-scope setup (the mount
 *  lookup, the initial render, every `addEventListener`) against the new
 *  document, rather than reusing whatever the previous test's import left
 *  wired to the previous test's (by-then-closed) document. */
async function loadMain(): Promise<void> {
  installGlobals();
  vi.resetModules();
  await import("../main.ts");
}

function click(selector: string): void {
  const el = document.querySelector(selector);
  if (!el) throw new Error(`test setup: no element for ${selector}`);
  el.dispatchEvent(new dom.window.Event("click", { bubbles: true }));
}

function goToHash(hash: string): void {
  location.hash = hash;
  window.dispatchEvent(new dom.window.Event("hashchange"));
}

afterEach(() => {
  uninstallGlobals();
});

describe("Act 3 offer gating (finding 3)", () => {
  it("does not fire during Act 1, even when a beat pushes a new high-water mark", async () => {
    await loadMain();

    // Ground truth from the real seam functions: hitting sixteen and
    // carrying it to settlement (the beat 2 -> beat 3 transition) pushes the
    // high-water mark from initialState()'s -1 up to 0 — this is exactly the
    // bug's own scenario, confirming the assertions below are not vacuous.
    const s0 = initialState();
    const s1 = decide(s0, "hit");
    const s2 = advanceBeat(s1);
    expect(reachedNewHighWaterMark(s1, s2)).toBe(true);

    const offer = document.getElementById("act3-offer") as HTMLElement;
    expect(offer.hidden).toBe(true);

    click("#do-decide-hit"); // beat 1 -> beat 2
    expect(offer.hidden).toBe(true);

    click("#do-advance-beat"); // beat 2 -> beat 3: the deal above, count -> 0
    expect(offer.hidden).toBe(true);

    click("#do-advance-beat"); // beat 3 -> beat 4: the readout itself appears
    expect(offer.hidden).toBe(true);

    goToHash("#act-2"); // Act 2 opens locked; act2FreePlay is still false
    expect(offer.hidden).toBe(true);
  });

  it("fires once Act 2 free play pushes a new high, with the high-water mark's own count", async () => {
    await loadMain();

    click("#do-decide-hit");
    click("#do-advance-beat");
    click("#do-advance-beat");
    goToHash("#act-2");
    click("#do-unlock-free-play"); // act2FreePlay -> true, first free-play hand dealt

    const offer = document.getElementById("act3-offer") as HTMLElement;
    const offerCount = document.getElementById("act3-offer-count") as HTMLElement;

    // The same path, replayed through the real seam functions to compute
    // ground truth: which click (if any, within a generous bound) is the
    // first to push a new high, and what the high-water mark is then.
    let cur: State = unlockFreePlay(
      goToAct(advanceBeat(advanceBeat(decide(initialState(), "hit"))), 2),
    );
    const clickSequence: { selector: string; apply: (s: State) => State }[] = [];
    for (let i = 0; i < 20; i++) {
      clickSequence.push({ selector: "#do-stand-free-play", apply: standFreePlay });
      clickSequence.push({ selector: "#do-next-hand", apply: nextHand });
    }

    let revealedAtCount: number | null = null;
    for (const step of clickSequence) {
      const before = cur;
      cur = step.apply(cur);
      if (revealedAtCount === null && reachedNewHighWaterMark(before, cur)) {
        revealedAtCount = cur.runningCountHighWaterMark;
      }

      click(step.selector);
      expect(offer.hidden, `after clicking ${step.selector}`).toBe(revealedAtCount === null);
      if (revealedAtCount !== null) break;
    }

    expect(
      revealedAtCount,
      "the deterministic seeded free-play path never pushed a new high within 20 hands — widen the loop bound",
    ).not.toBeNull();
    expect(offer.hidden).toBe(false);
    expect(offerCount.textContent).toBe(formatSignedCount(revealedAtCount as number));
  });
});

describe("focus restoration is scoped to #acts (finding 4)", () => {
  it("leaves focus alone when it was outside the mount during a re-render", async () => {
    await loadMain();

    const navLink = document.querySelector('nav a[href="#act-1"]') as HTMLElement;
    navLink.focus();
    expect(document.activeElement).toBe(navLink);

    // A hash change re-renders `#acts` from scratch — the simplest transition
    // that goes through rerender(), and stands in for one of the ~10 climb
    // frames a visitor tabbing through the nav could land on mid-climb.
    goToHash("#act-2");

    expect(document.activeElement).toBe(navLink);
  });

  it("still restores focus inside #acts when the focused id survives the re-render", async () => {
    await loadMain();

    click("#do-decide-hit"); // beat 1 -> beat 2

    const advanceButton = document.getElementById("do-advance-beat") as HTMLElement;
    advanceButton.focus();
    expect(document.activeElement).toBe(advanceButton);

    // Beat 2 -> beat 3 re-renders #acts, but beat 3's own advance button
    // reuses the same id ("do-advance-beat") — the case rerender()'s
    // still-inside-the-mount branch exists for.
    click("#do-advance-beat");

    const mount = document.getElementById("acts") as HTMLElement;
    expect(mount.contains(document.activeElement)).toBe(true);
    expect(document.activeElement?.id).toBe("do-advance-beat");
  });
});
