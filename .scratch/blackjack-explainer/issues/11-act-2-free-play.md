# 11 — Act 2 free play, composition, and the discard tray

Status: ready-for-agent
Blocked by: 10, 09

## Why

Agency after the point has been made, rather than instead of it. This is where
the Shoe depletes and the Running Count starts being worth watching.

## What to do

- **Free play** from the same Shoe under whichever Deal Model is selected. Hands
  keep dealing; information accumulates instead of resetting.
- **Composition chart** — "how many of each rank are left", on the axis, scaled
  from zero against a dashed reference line at a full rank. Charts **counts, not
  probability**: depletion moves a rank's Draw probability by roughly 0.15%,
  which no bar scaled from zero can show, and a truncated axis is not available
  to a page arguing for honest numbers. The fill is light; the **top edge is the
  data line**.
- **Odds pair** — the live next-Draw survive/bust chance for the hand actually
  being held, so the chart is about this hand and not an abstract Shoe.
- **Count readout** beside the odds, with the Hi-Lo rule behind its `?`.
- **Detail slot** — pinned under the axis, not a popover, because these numbers
  get compared across thirteen ranks in a row. Selecting a rank shows cards left,
  exact chance next, what it was, and "about N in every 1,000 draws" — an
  expectation derived from exact arithmetic, worded so it never reads as a tally.
- **Discard tray** — a card stack, a count, and a button opening the **panel**
  popover laying the discards out on the thirteen-rank axis with a per-rank
  tally. Present under **both** Deal Models, and that is the argument: the same
  cards sit in the same tray and Independent Draw still does not move.

## Done when

Every number is internally consistent — discards plus remaining equals a full
rank, per-rank counts sum to cards remaining — because that consistency is what
the page is selling.

## References

Spec stories 24, 27, 29–32, 59, 60.
