/**
 * Act 2 — Two kinds of blackjack. Placeholder: a later ticket builds the
 * locked opening and free play. See `.scratch/blackjack-explainer/design.md`.
 */

import { escapeHtml, section } from "../render.ts";
import type { State } from "../state.ts";

const ACT_2_HEADING = "Act 2 — Two kinds of blackjack";

export function renderAct2(_state: State): string {
  return section("act-2", `<h2>${escapeHtml(ACT_2_HEADING)}</h2>`);
}
