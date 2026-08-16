/**
 * The waffle — 1,000 marks, one per Play-out (`repeat(40, 1fr)` x 25 rows,
 * already in `styles.css`). Lost is `--red-wash`, won is ink at 22%, push is
 * `--rule` at 55%; the visitor's own Play-out is filled in its outcome colour
 * and ringed in `--pin` — fill is what happened, the ring is who it was.
 *
 * Marks start `pending` and fill as the simulation runs: `render` stays pure,
 * so which marks are filled is entirely a function of `progress`
 * (`State.playoutProgress`), never an animation this module drives itself. See
 * `docs/adr/0002` and the beat 4 ticket's hard constraint (b).
 */

import type { Decision, PlayOut, Settlement } from "../../engine/index.ts";
import { formatCount } from "../format.ts";
import { escapeHtml } from "../escape-html.ts";

type Settlements = Record<Settlement, number>;

function tally(trials: readonly PlayOut[]): Settlements {
  const settlements: Settlements = { lost: 0, push: 0, won: 0 };
  for (const trial of trials) settlements[trial.settlement]++;
  return settlements;
}

/** The 1,000-cell grid itself. The visitor's own Play-out is always trial
 *  zero — the same table, decision and seed `dealBeat3` used for the real
 *  deal, consumed in the same order (see `simulateTrials`) — so it is
 *  genuinely one of these 1,000, not a lookalike stitched in after the fact. */
function gridHtml(trials: readonly PlayOut[], progress: number): string {
  const cells = trials.map((trial, index) => {
    const isYou = index === 0;
    if (index >= progress) {
      return `<span class="pending"></span>`;
    }
    const classes = isYou ? `${trial.settlement} you` : trial.settlement;
    return `<span class="${classes}"></span>`;
  });
  return `<div class="waffle">${cells.join("")}</div>`;
}

function ariaLabel(trials: number, settlements: Settlements, decision: Decision): string {
  const verb = decision === "hit" ? "hitting" : "standing on";
  return (
    `${formatCount(trials)} play-outs of ${verb} this hand: ` +
    `${formatCount(settlements.lost)} lost, ${formatCount(settlements.won)} won, ` +
    `${formatCount(settlements.push)} pushed. Your own hand is one of them.`
  );
}

function headHtml(decision: Decision, progress: number, trials: number): string {
  const label = decision === "hit" ? "Hit" : "Stand";
  return (
    `<div class="waffle-head">` +
    `<span>${escapeHtml(label)} · seeded simulation</span>` +
    `<span>${formatCount(progress)} / ${formatCount(trials)}</span>` +
    `</div>`
  );
}

/** Fill swatch for the visitor's own mark in the legend: same outcome colour
 *  the waffle uses, since fill always means the outcome and never anything
 *  else. */
function youSwatch(mine: Settlement): string {
  const background =
    mine === "lost" ? "var(--red)" : mine === "won" ? "var(--ink)" : "var(--ink-dim)";
  return `<i style="background: ${background}; outline: 2px solid var(--pin); outline-offset: 1px"></i>`;
}

function legendHtml(settlements: Settlements, mine: Settlement): string {
  return (
    `<p class="waffle-legend">` +
    `<span><i style="background: var(--red-wash); outline: 1px solid var(--red)"></i>` +
    `<span>${formatCount(settlements.lost)} lost</span></span>` +
    `<span><i style="background: color-mix(in srgb, var(--ink) 22%, transparent)"></i>` +
    `<span>${formatCount(settlements.won)} won</span></span>` +
    `<span><i style="background: color-mix(in srgb, var(--rule) 55%, transparent)"></i>` +
    `<span>${formatCount(settlements.push)}</span> ` +
    `<button class="why why--inline" type="button" id="do-why-push" popovertarget="why-push" ` +
    `style="anchor-name: --a-push">push?</button></span>` +
    `<span>${youSwatch(mine)}you</span>` +
    `</p>` +
    `<div id="why-push" popover style="position-anchor: --a-push">` +
    `<p class="pop-title">Push</p>` +
    `<p>Nobody won. Your bet comes back.</p>` +
    `</div>`
  );
}

function copyHtml(trials: number, settlements: Settlements, mine: Settlement): string {
  const verb = mine === "won" ? "won" : mine === "push" ? "pushed" : "lost";
  const others = settlements[mine] - 1;
  const text =
    `You are the ringed mark — the first of the ${formatCount(trials)}, and the ` +
    `only one that actually happened to you. You ${verb}, along with ` +
    `${formatCount(others)} others. One mark out of ${formatCount(trials)} is not ` +
    "evidence about the decision that produced it.";
  return `<p class="lede">${escapeHtml(text)}</p>`;
}

/**
 * Every one of the thousand Play-outs: the head counter, the grid, the
 * legend (with the push definition one tap away), and the closing copy. The
 * container carries the text equivalent the ticket requires via `aria-label`,
 * describing the full 1,000-trial composition regardless of how much of the
 * grid has visibly filled — that composition is already fully determined by
 * `trials`, `progress` only controls the reveal.
 */
export function waffleSectionHtml(
  trials: readonly PlayOut[],
  progress: number,
  decision: Decision,
): string {
  const settlements = tally(trials);
  const mine = trials[0]?.settlement ?? "lost";
  const label = ariaLabel(trials.length, settlements, decision);

  return (
    headHtml(decision, progress, trials.length) +
    `<div role="img" aria-label="${escapeHtml(label)}">` +
    gridHtml(trials, progress) +
    `</div>` +
    legendHtml(settlements, mine) +
    copyHtml(trials.length, settlements, mine)
  );
}
