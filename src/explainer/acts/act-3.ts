/**
 * Act 3 — The conclusion. Placeholder: a later ticket builds the closing
 * Scripted Hand. See `docs/adr/0001-honest-deal-over-scripted-loss.md`.
 */

import { escapeHtml, section } from "../render.ts";
import type { State } from "../state.ts";

const ACT_3_HEADING = "Act 3 — The conclusion";

export function renderAct3(_state: State): string {
  return section("act-3", `<h2>${escapeHtml(ACT_3_HEADING)}</h2>`);
}
