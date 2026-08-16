// The thin shell OUTSIDE the seam: mounts `render(state)`, listens for
// `hashchange`, and delegates clicks by `data-action`/`data-arg`. It holds no
// logic worth testing — everything meaningful lives behind
// `src/explainer/` (state, transitions, render).

import type { DealModel, Decision } from "./src/engine/index.ts";
import { render } from "./src/explainer/render.ts";
import { initialState, PLAYOUT_TRIALS, type State } from "./src/explainer/state.ts";
import {
  advanceBeat,
  advanceSimulation,
  decide,
  goToAct,
  replayWithOtherDecision,
  setModel,
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
};

function actFromHash(hash: string): State["act"] {
  if (hash === "#act-2") return 2;
  if (hash === "#act-3") return 3;
  return 1;
}

/** Replacing the markup destroys focus, so every re-render restores it: to
 *  the control just activated where it still exists, otherwise to the Act
 *  section that changed (`tabindex="-1"` in `render.ts`'s output). */
function rerender(): void {
  if (!mount) return;

  const active = document.activeElement;
  const focusedId = active instanceof HTMLElement && active.id ? active.id : null;

  mount.innerHTML = render(state);

  const target =
    (focusedId && document.getElementById(focusedId)) ||
    document.getElementById(`act-${state.act}`);
  if (target instanceof HTMLElement) target.focus();
}

function applyAction(name: string, arg: string | undefined): void {
  const action = actions[name];
  if (!action) return;
  state = action(state, arg);
  rerender();
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
  state = goToAct(state, actFromHash(location.hash));
  rerender();
  maybeStartClimb();
});

// ---- Act 1 beat 4's Play-out counter: the shell drives the climb ----
//
// `render` stays pure over `state.playoutProgress` — the waffle fills exactly
// as many marks as that number says, nothing more. This is the only place
// that number is allowed to change on its own, and the only place
// `prefers-reduced-motion` is read: no file under `src/explainer/` may
// reference `matchMedia` (see `spec/contracts.test.ts`'s grep).
//
// Every re-render — including each climb frame — goes through `rerender()`,
// which restores focus to whatever was focused before the render. Since
// nothing else moves focus during the climb, that is always the same
// element (typically the Act 1 section itself), so the climb never steals
// keyboard focus from a visitor tabbing through the page.
const CLIMB_STEP = 20;
let climbHandle: number | null = null;

function isBeat4Filling(s: State): boolean {
  return s.act === 1 && s.beat === 4 && s.playoutProgress < PLAYOUT_TRIALS;
}

function stopClimb(): void {
  if (climbHandle !== null) {
    cancelAnimationFrame(climbHandle);
    climbHandle = null;
  }
}

function tickClimb(): void {
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

  climbHandle = requestAnimationFrame(tickClimb);
}

// A refresh or a pasted link lands in the right Act.
state = goToAct(state, actFromHash(location.hash));
if (mount) mount.innerHTML = render(state);
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
