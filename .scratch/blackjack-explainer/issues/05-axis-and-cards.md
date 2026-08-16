# 05 — The thirteen-rank axis and the cards

Status: done
Blocked by: 04

## Why

Two components carry the whole page. The axis appears in every Act; the cards
are the only objects with physical presence.

## What to do

**The axis.** `grid-template-columns: var(--axis-cols)` — five columns, a 2px
bust line, then eight. Rows that share it must align exactly: the rank strip,
Act 2's composition bars, Act 3's Hi-Lo values, the discard tally. The bust line
is `--ink`, stretches, and has negative block margin so it pokes past the cards
and reads as an edge rather than a gap.

Rank order is Ace-first and is not negotiable: Act 1 needs the Ace beside 2–5,
because those are exactly the ranks that survive a sixteen.

**The cards.** `5/7` aspect, `8px` radius, face gradient, a three-part shadow
(inset top edge for stock thickness, tight contact shadow, soft cast). Hands
overlap by about `-0.85rem` with rotations of roughly −2.5°, +1.5°, +5° so a
hand looks placed rather than laid out. Face-down cards get a guilloché back. A
busting card takes a red border and red rank.

The thirteen mini cards in the strip stay **flat** — shadows at 24px turn to mud,
and the strip is a printed reference, not cards on a table.

**The Shoe.** An edge-on stack of card edges that thins. Not a progress bar.

## Done when

Both render at 390 and at 1920 in both themes, and the axis rows line up to the
pixel.

## References

`.scratch/blackjack-explainer/design.md` → Components. ADR 0003 for why the axis
order is fixed.
