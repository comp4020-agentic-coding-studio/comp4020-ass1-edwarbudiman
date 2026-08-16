# 06 — Act 1, beats 1 to 3

Status: done
Blocked by: 03, 05

## Why

Act 1 is the introduction and carries the thesis. Beats keep 390 from becoming
one endless scroll and give the visitor something to do.

## What to do

**Beat 1 — decide.** Dealer upcard and hole card face down, the visitor's two
cards, both totals. Hit and Stand as two real buttons of **identical visual
weight** — the page must not nudge an intuition it is about to test. Nothing
else on screen. No probability before the Decision.

**Beat 2 — every card that could come next.** The thirteen-rank strip with
survivors in ink and busts in red, the split stated as `5 / 13 survive · 38.8%`
against `8 / 13 bust · 61.2%`, and the one sentence the chart cannot say: both
choices lose more often than they win, and the better decision is the one that
loses less. A `?` popover carries why standing does not help.
→ *Play my hand*

**Beat 3 — your hand, dealt honestly.** Played to settlement from the real Shoe,
labelled "Dealt from the shoe. Not chosen." The copy **branches on the actual
result**, including the winning one — at the shipped seed the visitor draws a 4,
makes 20 and wins, so the losing branch is not the only one that has to read
well. → *Show me 1,000 more hands*

Figures come from `src/engine/`. Percentages are computed from the Shoe with the
three visible cards already removed, which is why they are 38.8/61.2 and not the
fresh-shoe 38.5/61.5.

## Done when

The beats advance on real buttons, focus lands sensibly after each, and no
figure in the markup was typed by a human.

## References

Spec stories 1–20, 56. ADR 0001 for why the deal is honest.
