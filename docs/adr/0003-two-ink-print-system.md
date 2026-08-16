# Two inks on stock, and one axis across all three Acts

The Explainer is set as a printed table surface in exactly two inks. `--ink`
carries every structural mark and also means **survive**; `--red` means **bust or
loss** and nothing else, anywhere, ever. Night mode is the same press run on dark
stock, so the tokens are roles — `--stock`, `--card`, `--ink`, `--red`, `--rule`,
`--pin` — and inverting the page is a palette swap rather than a second design.

Two consequences follow that look like errors and are not:

**Cards are printed in a single ink whatever the suit.** Hearts and diamonds go
black. If suits are red, red stops meaning "you lost", and the closing Scripted
Hand loses the payoff three Acts have been earning for it.

**The thirteen-rank axis is a constant.** The same thirteen columns, in rank
order A→K, split by a hard rule between the 5 and the 6, appear in every Act
carrying a different quantity: survive/bust in Act 1, Shoe composition in Act 2,
Hi-Lo values in Act 3. The visitor learns one axis and reads it three ways, which
is what keeps three Acts from becoming three Explainers.

## Considered Options

A casino register — felt, chips, gold — was ruled out by the spec: the visual
register is editorial. A dark instrument panel was rejected as the closest of the
available directions to the register the spec excludes.

Ordering the axis 2→A would group the Hi-Lo −1 ranks together, but Act 1 needs
the Ace adjacent to 2–5 because those are exactly the ranks that survive a
sixteen. Act 1 wins, so aces and tens sit at opposite ends. This turns out to
teach the rule better than grouping would: the count does not care what a card is
worth, only whether it is high or low, and the split shows precisely that.

Depth was considered and rejected for the page as a whole, then adopted for cards
and the Shoe alone. Cards are the objects the visitor is asked to believe in;
giving them physicality while everything else stays flat print reinforces the
system instead of diluting it.

## Consequences

The theme toggle lives **outside the seam**. It flips `data-theme` on the root
element and touches no `State`, so `render(state)` remains a pure function of
`State` alone and the resize-safety contract is unaffected. `prefers-color-scheme`
is the default; the toggle only overrides it.

Optional detail is split by role, not by one mechanism. **Native `popover` with
CSS anchor positioning** carries ephemeral detail — definitions, "why this
matters", the discard tray — because it does its placement and its 390px reflow
entirely in CSS and so never touches the seam. An earlier draft of this ADR ruled
floating popovers out on the grounds that `CLAUDE.md` forbids branching on
viewport; that was wrong, the rule forbids *TypeScript* reading width. **The
pinned slot survives only for Act 2's per-rank numbers**, which get compared
thirteen times in a row — reopening a floating panel for each is worse than a slot
that updates in place. Activation is click/tap only: hover does not exist at
390×844 or for a keyboard user, and the page is marked by tabbing.

**Visible prose has to earn its place.** A sentence stays on screen only if it
says something the chart cannot, or a user story requires the visitor be told.
Everything else moves into a popover or becomes the chart's screen-reader
description — story 48 asks for a text equivalent, not a visible paragraph. Two
things are never behind a click: **the thesis, and any warning**. A warning you
have to open is not a warning.

Act 2 charts **cards remaining per rank**, not probability. Depletion moves a
rank's Draw probability by roughly 0.15%, which no bar chart scaled from zero can
show, and a truncated axis in an explainer about honest numbers is not available
to us. The counts move visibly, the exact probability lives in the detail slot,
and nothing on screen is exaggerated to be legible.

`--pin` means **identity, never outcome**. The visitor's own Play-out in the
waffle is filled in its outcome colour — solid red if it lost, solid ink if it won
— and ringed in `--pin`. An earlier version drew it white, which announced "this
one is yours" while hiding what happened to it, in the one figure whose whole
argument is that what happened to it does not matter.

Red is now load-bearing rather than decorative, which means any future element
that wants to be red has to be a loss.
