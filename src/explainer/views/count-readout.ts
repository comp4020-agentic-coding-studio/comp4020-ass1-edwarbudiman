/**
 * The Running Count readout, and the Hi-Lo rule behind its `?`.
 *
 * The readout appears for the first time at Act 1 beat 4 — never earlier, and
 * a Decision has already been made without it (CONTEXT.md, and the beat 4
 * ticket). From here on it is meant to stay on screen; later Acts reuse this
 * same module rather than re-deriving the readout markup.
 *
 * The panel explains what the count DESCRIBES (the Shoe's remaining
 * composition), never what it PREDICTS. Hi-Lo −1 (tens and aces) is not
 * rendered in `--red`: a shoe rich in tens and aces favours the visitor, and
 * red is reserved for loss (see `docs/adr/0003` and `.axis-values .minus` in
 * `styles.css`).
 */

import { RANKS, hiLoValue, type Rank } from "../../engine/index.ts";
import { formatCount, formatSignedCount } from "../format.ts";
import { escapeHtml } from "../escape-html.ts";
import { axisRow } from "./axis.ts";

/** The `.locked` box: "New · from here on", the count itself, the Shoe
 *  remaining, and the one sentence describing what moved it. */
export function countReadoutHtml(runningCount: number, shoeRemaining: number): string {
  return (
    `<div class="locked">` +
    `<p class="locked-flag">New · from here on</p>` +
    `<p class="readout" style="border: 0; padding-top: 0">` +
    `<span>Running count</span>` +
    `<b>${escapeHtml(formatSignedCount(runningCount))}</b>` +
    `<button class="why" type="button" popovertarget="how-count" ` +
    `aria-label="How the running count works">?</button>` +
    `<span class="spacer"></span>` +
    `<span>Shoe <b>${escapeHtml(formatCount(shoeRemaining))}</b></span>` +
    `</p>` +
    `<p class="note" style="margin-top: 0.75rem">` +
    "Every card that has left the shoe moved this number. It describes " +
    "what is still in there — never what comes next. It stays on screen " +
    "for the rest of the page, and it is about to start mattering." +
    `</p>` +
    `</div>`
  );
}

function hiLoCellHtml(rank: Rank): string {
  const value = hiLoValue(rank);
  const className = value > 0 ? "plus" : value < 0 ? "minus" : "";
  const text = formatSignedCount(value);
  const classAttr = className ? ` class="${className}"` : "";
  return `<span${classAttr}>${escapeHtml(text)}</span>`;
}

/** The large centred `.panel`: the rank strip and its Hi-Lo values beneath,
 *  read off the same axis every other beat uses (`axisRow`). */
export function countRulePanelHtml(): string {
  const strip = axisRow(RANKS.map((rank) => `<div class="draw">${escapeHtml(rank)}</div>`));
  const values = axisRow(
    RANKS.map((rank) => hiLoCellHtml(rank)),
    { className: "axis-values", splitTransparent: true },
  );

  return (
    `<div id="how-count" popover class="panel">` +
    `<div class="panel-head">` +
    `<p class="pop-title">How the running count works</p>` +
    `<button class="panel-close" type="button" popovertarget="how-count" ` +
    `popovertargetaction="hide">Close</button>` +
    `</div>` +
    `<p>Every card that leaves the shoe moves one number. Low cards raise ` +
    `it, tens and aces lower it, sevens to nines do nothing.</p>` +
    strip +
    values +
    `<p style="margin-top: 1rem">Aces sit at one end of this row and tens ` +
    `at the other, and both count −1. The count does not care what a card ` +
    `is worth, only whether it is high or low.</p>` +
    `<p>A high count means the shoe still holds its tens and aces, which ` +
    `favours you <em>across many hands</em>. It never means the next card ` +
    `is good.</p>` +
    `</div>`
  );
}
