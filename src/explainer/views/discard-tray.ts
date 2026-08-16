/**
 * The discard tray (`design.md` -> Components -> "Discard tray"): a compact
 * overlapping card stack, a count, and a button opening a panel that lays the
 * discards out on the shared thirteen-rank axis with a per-rank tally
 * underneath — the axis's fourth use, after Act 1's Draws, Act 2's
 * composition bars and the Running Count rule panel.
 *
 * Present under both Deal Models, unconditionally: it depends only on
 * `state.shoe`, never on `state.model`. That is the point — the same cards
 * sit in the same tray under Independent Draw and the bars still do not
 * move.
 */

import { discarded, RANKS, type Shoe } from "../../engine/index.ts";
import { escapeHtml } from "../escape-html.ts";
import { formatCount } from "../format.ts";
import { axisRow } from "./axis.ts";
import { panelPopover } from "./popover.ts";

const STACK_CARDS = 5;
const TRAY_POPOVER_ID = "tray";

/** The compact `.tray`: an overlapping card stack, the discard count, and the
 *  trigger for the panel that breaks it down by rank. */
function trayHtml(total: number): string {
  const stack = `<span class="tray-stack" aria-hidden="true">${"<i></i>".repeat(STACK_CARDS)}</span>`;
  const count =
    `<span class="tray-count"><b>${formatCount(total)}</b> cards discarded</span>`;
  const trigger =
    `<button class="why why--inline" type="button" popovertarget="${TRAY_POPOVER_ID}">` +
    `See them</button>`;

  return `<div class="tray">${stack}${count}${trigger}</div>`;
}

/** The panel: the thirteen-rank axis once more, this time with how many of
 *  each rank are in the tray rather than how many are left in the Shoe.
 *  Wrapped in `.discard-axis` — the styling hook `styles.css` already
 *  carries for this exact strip-plus-tally pairing. */
function trayPanelHtml(shoe: Shoe, total: number): string {
  const strip = axisRow(RANKS.map((rank) => `<div class="draw">${escapeHtml(rank)}</div>`));
  const tallies = axisRow(
    RANKS.map((rank) => `<span>${discarded(shoe, rank)}</span>`),
    { className: "count" },
  );

  return panelPopover({
    id: TRAY_POPOVER_ID,
    title: `Out of the shoe · ${formatCount(total)} cards`,
    body:
      `<div class="discard-axis">${strip}${tallies}</div>` +
      `<p style="margin-top: 0.7rem">These cards are gone either way. Under Finite Shoe ` +
      `every number above already counts them. Under Independent Draw they are lying right ` +
      `there and the model does not care.</p>`,
  });
}

/** The tray and its panel together — always both, since one is meaningless
 *  without the other's per-rank breakdown. `discarded(shoe, rank)` and
 *  `fullRank(shoe)` are exact arithmetic over the same Shoe the composition
 *  chart reads, so `discarded` summed across all thirteen ranks always
 *  equals `shoe.size - shoe.remaining`, the count this tray shows. */
export function discardTrayHtml(shoe: Shoe): string {
  const total = shoe.size - shoe.remaining;
  return trayHtml(total) + trayPanelHtml(shoe, total);
}
