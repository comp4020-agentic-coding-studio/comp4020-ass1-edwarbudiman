// The thin shell OUTSIDE the seam: mounts `render(state)`, listens for
// `hashchange`, and delegates clicks by `data-action`/`data-arg`. It holds no
// logic worth testing — everything meaningful lives behind
// `src/explainer/` (state, transitions, render).

import type { DealModel, Decision } from "./src/engine/index.ts";
import { render } from "./src/explainer/render.ts";
import { initialState, type State } from "./src/explainer/state.ts";
import {
  advanceBeat,
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
});

// A refresh or a pasted link lands in the right Act.
state = goToAct(state, actFromHash(location.hash));
if (mount) mount.innerHTML = render(state);

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
