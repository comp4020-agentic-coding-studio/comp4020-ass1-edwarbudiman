/**
 * Act 1 beat 4's dealer histogram — 17/18/19/20/21/bust from `dealerDistribution`.
 *
 * Deliberately never fed from the settlement run: a busted player ends the
 * hand before the dealer plays, so dealer totals taken from the settlement run
 * are silently conditioned on "the hands where you did not bust". See the
 * ticket and CONTEXT.md's Draw vs Play-out entry. The chart itself is visual
 * only (`aria-hidden`); the numbers reach assistive tech through
 * `histogramText`, never a visible paragraph.
 */

import { DEALER_TOTALS, type DealerTotal } from "../../engine/index.ts";
import { formatCount, formatPercent } from "../format.ts";
import { escapeHtml } from "../escape-html.ts";

type DealerTotals = Record<DealerTotal, number>;

function bucketLabel(bucket: DealerTotal): string {
  return bucket === "bust" ? "Bust" : bucket;
}

/** The visual bars — hairline tracks, a bare `i` filling by proportion of the
 *  tallest bucket, exactly the `.hist` vocabulary already in `styles.css`. */
export function histogramHtml(totals: DealerTotals, trials: number): string {
  const worst = Math.max(...DEALER_TOTALS.map((bucket) => totals[bucket]));

  const rows = DEALER_TOTALS.map((bucket) => {
    const count = totals[bucket];
    const width = worst === 0 ? 0 : (count / worst) * 100;
    const rowClass = bucket === "bust" ? " hist-row--bust" : "";
    return (
      `<div class="hist-row${rowClass}">` +
      `<span class="hist-label">${escapeHtml(bucketLabel(bucket))}</span>` +
      `<span class="hist-track"><i style="width: ${width}%"></i></span>` +
      `<span class="hist-value">${escapeHtml(formatPercent(count / trials))}</span>` +
      `</div>`
    );
  });

  return `<div class="hist" aria-hidden="true">${rows.join("")}</div>`;
}

/** The same figures as one sentence — the chart's screen-reader description,
 *  and the only place this beat explains what the chart means in prose. */
export function histogramText(totals: DealerTotals, trials: number): string {
  const parts = DEALER_TOTALS.map(
    (bucket) => `${bucketLabel(bucket)} ${formatPercent(totals[bucket] / trials)}`,
  );
  return `Dealer final totals over ${formatCount(trials)} simulated hands: ${parts.join(", ")}.`;
}
