// The thin shell OUTSIDE the seam: mounts `render(state)`, listens for
// `hashchange`, and delegates clicks by `data-action`/`data-arg`. It holds no
// logic worth testing — everything meaningful lives behind
// `src/explainer/` (state, transitions, render).

import type { DealModel, Decision, Rank } from "./src/engine/index.ts";
import { formatSignedCount } from "./src/explainer/format.ts";
import { render } from "./src/explainer/render.ts";
import { initialState, PLAYOUT_TRIALS, type State } from "./src/explainer/state.ts";
import {
  advanceBeat,
  advanceSimulation,
  decide,
  goToAct,
  hitFreePlay,
  nextHand,
  reachedNewHighWaterMark,
  replayWithOtherDecision,
  selectRank,
  setModel,
  standFreePlay,
  unlockFreePlay,
} from "./src/explainer/transitions.ts";

const mount = document.getElementById("acts");

let state: State = initialState();

type Action = (state: State, arg: string | undefined) => State;

// One entry per transition a rendered `data-action` can name. Later tickets
// add buttons that reuse these names rather than inventing new ones.
const actions: Record<string, Action> = {
  decide: (s, arg) => decide(s, arg as Decision),
  "advance-beat": (s) => advanceBeat(s),
  "set-model": (s, arg) => setModel(s, arg as DealModel),
  "unlock-free-play": (s) => unlockFreePlay(s),
  "replay-other-decision": (s) => replayWithOtherDecision(s),
  "hit-free-play": (s) => hitFreePlay(s),
  "stand-free-play": (s) => standFreePlay(s),
  "next-hand": (s) => nextHand(s),
  "select-rank": (s, arg) => selectRank(s, arg as Rank),
};

function actFromHash(hash: string): State["act"] {
  if (hash === "#act-2") return 2;
  if (hash === "#act-3") return 3;
  return 1;
}

// The nav lives in static markup outside the mount point (`index.html`), so
// the seam cannot mark the current Act and must not try to: `render(state)`
// only ever returns the current Act's own `<section>`. This is shell logic,
// same footing as the theme toggle above.
const navLinks = document.querySelectorAll<HTMLAnchorElement>("nav a");

function updateNavCurrent(): void {
  const currentHash = `#act-${state.act}`;
  for (const link of navLinks) {
    if (link.getAttribute("href") === currentHash) {
      link.setAttribute("aria-current", "step");
    } else {
      link.removeAttribute("aria-current");
    }
  }
}

/** Replacing the markup destroys focus, but only for whatever was focused
 *  INSIDE `#acts` — everything else (the nav, the Reference `<summary>`, the
 *  Act 3 offer's link) lives outside the mount and is untouched by
 *  `mount.innerHTML = ...`. So a re-render only restores focus when it was
 *  inside the mount to begin with: to the control just activated where it
 *  still exists, otherwise to the Act section that changed (`tabindex="-1"`
 *  in `render.ts`'s output). If focus was elsewhere, this leaves it exactly
 *  where it was — replacing `#acts` cannot have destroyed a focus that was
 *  never inside it. */
function rerender(): void {
  updateNavCurrent();
  if (!mount) return;

  const active = document.activeElement;
  const wasInsideMount = active instanceof HTMLElement && mount.contains(active);
  const focusedId = wasInsideMount && active.id ? active.id : null;

  mount.innerHTML = render(state);

  if (!wasInsideMount) return;

  const target =
    (focusedId && document.getElementById(focusedId)) ||
    document.getElementById(`act-${state.act}`);
  if (target instanceof HTMLElement) target.focus();
}

function applyAction(name: string, arg: string | undefined): void {
  const action = actions[name];
  if (!action) return;
  const previous = state;
  state = action(state, arg);
  rerender();
  maybeOfferAct3(previous);
  maybeStartClimb();
}

mount?.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const trigger = target.closest<HTMLElement>("[data-action]");
  if (!trigger) return;
  applyAction(trigger.dataset.action ?? "", trigger.dataset.arg);
});

window.addEventListener("hashchange", () => {
  const previous = state;
  state = goToAct(state, actFromHash(location.hash));
  rerender();
  maybeOfferAct3(previous);
  maybeStartClimb();
});

// ---- Act 3's high-water-mark offer: shell chrome, outside the seam ----
//
// "The visitor arrives when they choose to, or when the page offers it at
// the Running Count's high-water mark" (ticket 12, design.md's Flow). No
// play happens in Act 3, so this only ever offers a link — it never
// navigates on its own. It has to survive whichever Act's markup
// `rerender()` just replaced, so it lives outside `#acts` entirely, exactly
// like the theme toggle above. `reachedNewHighWaterMark` — a pure, tested
// comparison of two States — is the entire trigger; there is no fixed
// threshold anywhere in this file.
//
// The banner's copy is static markup in `index.html`, not written here. The
// shell unhides it and fills in one number; authoring page content in the
// shell would put the same prose in a third place and leave it untested.
const offerBanner = document.getElementById("act3-offer");
const offerCount = document.getElementById("act3-offer-count");

document.getElementById("act3-offer-dismiss")?.addEventListener("click", () => {
  if (offerBanner) offerBanner.hidden = true;
});

function maybeOfferAct3(previous: State): void {
  if (!offerBanner) return;
  if (state.act === 3) {
    offerBanner.hidden = true;
    return;
  }
  // The offer may only fire once the Running Count is actually on screen and
  // accumulating in bulk — in practice, Act 2's free play (CONTEXT.md: "this
  // is where ... the Running Count becomes worth watching"). Act 1 beats 1-3
  // can push the high-water mark before the readout has even appeared (it
  // first renders in beat 4), and Act 2 opens locked to the same fixed hand
  // every time, so `act2FreePlay` — sticky once `unlockFreePlay` sets it,
  // CONTEXT.md's "Act 2" — is both the correct and the sufficient gate. This
  // is a gate on WHEN the offer is allowed, not a fixed count threshold: the
  // trigger stays `reachedNewHighWaterMark` alone.
  if (!state.act2FreePlay) return;
  if (reachedNewHighWaterMark(previous, state)) {
    if (offerCount) {
      offerCount.textContent = formatSignedCount(state.runningCountHighWaterMark);
    }
    offerBanner.hidden = false;
  }
}

// ---- Act 1 beat 4's Play-out counter: the shell drives the climb ----
//
// `render` stays pure over `state.playoutProgress` — the waffle fills exactly
// as many marks as that number says, nothing more. This is the only place
// that number is allowed to change on its own, and the only place
// `prefers-reduced-motion` is read: no file under `src/explainer/` may
// reference `matchMedia` (see `spec/contracts.test.ts`'s grep).
//
// Every re-render — including each climb frame — goes through `rerender()`,
// which only restores focus when it was inside `#acts` to begin with. A
// visitor tabbing through the nav, the Reference disclosure, or the Act 3
// offer's link is focused OUTSIDE `#acts`, so consecutive climb frames leave
// that focus alone instead of yanking it back to the Act section on every
// frame.
//
// `render(state)` re-runs both of beat 4's 1,000-trial simulations from
// scratch on every call, and only `playoutProgress` changes frame to frame —
// so the frame count IS the cost. `CLIMB_STEP` used to be 20 (50 renders to
// fill 1,000, ~1.2ms/frame warm + a ~14.8ms first render measured on desktop:
// ~72-94ms of blocking work per climb, worse on the 390px viewport). Bumping
// it to 100 cuts that to 10 renders (~14-16ms total, measured the same way —
// see the commit message). `CLIMB_INTERVAL_MS` then paces those 10 renders
// across roughly the same wall-clock time the old 50-frame climb took, by
// skipping `requestAnimationFrame` callbacks that land before the interval
// has elapsed — cheap (no `render` call) rather than free, but every frame
// still checks in, so `stopClimb` can still cancel promptly. Neither number
// moves simulation work into this file or behind the seam: `render(state)`
// is untouched and still pure.
const CLIMB_STEP = 100;
const CLIMB_INTERVAL_MS = 80;
let climbHandle: number | null = null;
let climbDue = 0;

function isBeat4Filling(s: State): boolean {
  return s.act === 1 && s.beat === 4 && s.playoutProgress < PLAYOUT_TRIALS;
}

function stopClimb(): void {
  if (climbHandle !== null) {
    cancelAnimationFrame(climbHandle);
    climbHandle = null;
  }
}

function tickClimb(now: number): void {
  if (now < climbDue) {
    climbHandle = requestAnimationFrame(tickClimb);
    return;
  }
  climbDue = now + CLIMB_INTERVAL_MS;
  state = advanceSimulation(state, CLIMB_STEP);
  rerender();
  climbHandle = isBeat4Filling(state) ? requestAnimationFrame(tickClimb) : null;
}

function maybeStartClimb(): void {
  stopClimb();
  if (!isBeat4Filling(state)) return;

  if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
    // The counter IS the fill, never an animation over a finished number —
    // so "no motion" means jumping straight to the finished total in one
    // render, not skipping the fill altogether.
    state = advanceSimulation(state, PLAYOUT_TRIALS);
    rerender();
    return;
  }

  climbDue = 0;
  climbHandle = requestAnimationFrame(tickClimb);
}

// A refresh or a pasted link lands in the right Act.
state = goToAct(state, actFromHash(location.hash));
if (mount) mount.innerHTML = render(state);
updateNavCurrent();
maybeStartClimb();

// ---- theme toggle: lives outside the seam, touches no State ----
const root = document.documentElement;
const themeButton = document.getElementById("theme");

const isDark = () =>
  root.dataset.theme === "dark" ||
  (!root.dataset.theme && matchMedia("(prefers-color-scheme: dark)").matches);

const updateThemeLabel = () => {
  if (themeButton) themeButton.textContent = isDark() ? "Day" : "Night";
};

updateThemeLabel();
new MutationObserver(updateThemeLabel).observe(root, {
  attributes: true,
  attributeFilter: ["data-theme"],
});
themeButton?.addEventListener("click", () => {
  root.dataset.theme = isDark() ? "light" : "dark";
});
