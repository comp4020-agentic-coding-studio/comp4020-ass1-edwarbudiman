/**
 * The thirteen-rank axis — one template shared by Act 1's Draws, Act 2's Shoe
 * composition and the Running Count explainer panel. The bust line is a
 * PLACE on the strip (a `.split` cell after the fifth rank — Ace through 5,
 * the survivors of a sixteen), not a colour key. See CONTEXT.md and
 * `docs/adr/0003`.
 *
 * Not used by Act 1 beat 1 (built now so the file, and its contract, exist
 * for the tickets that build beats 2 onward).
 */

const RANK_COUNT = 13;
const SPLIT_AFTER = 5;

export interface AxisRowOptions {
  /** Extra class alongside `.axis-row`, e.g. "axis-bars". */
  className?: string;
  /** The split cell renders with no fill — used where the row is a values
   *  strip rather than the survive/bust line itself. */
  splitTransparent?: boolean;
}

/**
 * Lays already-built cell HTML out on the axis, inserting the `.split` cell
 * after the fifth cell. `cellsHtml` must have exactly thirteen entries, one
 * per Rank in `RANKS` order (Ace first).
 */
export function axisRow(
  cellsHtml: readonly string[],
  options: AxisRowOptions = {},
): string {
  if (cellsHtml.length !== RANK_COUNT) {
    throw new Error(`axisRow needs exactly ${RANK_COUNT} cells, got ${cellsHtml.length}`);
  }

  const classes = ["axis-row", options.className].filter(Boolean).join(" ");
  const splitStyle = options.splitTransparent ? ' style="background: none"' : "";
  const split = `<span class="split" aria-hidden="true"${splitStyle}></span>`;

  const cells = [
    ...cellsHtml.slice(0, SPLIT_AFTER),
    split,
    ...cellsHtml.slice(SPLIT_AFTER),
  ];

  return `<div class="${classes}">${cells.join("")}</div>`;
}
