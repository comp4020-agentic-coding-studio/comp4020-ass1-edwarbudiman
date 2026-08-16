# 07 — Act 1, beat 4: the thousand, and the count arrives

Status: ready-for-agent
Blocked by: 06

## Why

This beat is where the thesis lands: your one result placed inside the range it
came from.

## What to do

In order down the beat:

1. **The dealer's hand, hole card turned over**, with their total, plus one line
   noting that beat 1 only ever showed the upcard — which is all you get to
   decide on at a real table.
2. **The odds pair** — "your hit survived / it could have busted", the second in
   red.
3. **The dealer histogram** — 17/18/19/20/21/bust from a Monte Carlo run.
   Use `dealerDistribution`, **not** the settlement run: a busted player ends the
   hand before the dealer plays, so totals taken from the settlement run are
   silently conditioned on "the hands where you did not bust". The explanation of
   what the chart means goes in a `?` popover and in the chart's screen-reader
   description, not in a visible paragraph.
4. **The waffle** — 1,000 marks, one per Play-out, `repeat(40, 1fr)` × 25 rows.
   Lost `--red-wash`, won ink at 22%, push `--rule` at 55%. The visitor's own
   Play-out is filled in **its outcome colour** and ringed in `--pin`: fill is
   what happened, ring is who it was. Marks start pending and fill as the
   simulation runs — the counter **is** the fill, not an animation over a
   finished number. Renders complete under `prefers-reduced-motion`.
5. **The count arrives.** The Running Count readout appears here, at the end of
   Act 1, once the visitor has already decided without it, with its Hi-Lo rule
   behind a `?` in the large panel. It stays on screen for the rest of the page.

→ *Try the other decision* replays Act 1 with the other Decision so the two
distributions can be compared.

## Done when

Every figure comes from the engine, the waffle has a text equivalent, and the
count is visible from here onward but nowhere earlier.

## References

Spec stories 18, 19, 20, 57, 58, 63. ADR 0002 for the seeded simulation.
