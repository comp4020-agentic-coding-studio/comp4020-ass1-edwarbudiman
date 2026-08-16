# Design system — Two-ink table print

Status: locked

The reference implementation is `styleframe.html` in this directory, viewable at
both viewports and both themes via `frames.html`. It is a proof sheet, not the
shipped page: it stacks every beat at once, its figures outside the exact
`5/13` split are illustrative, and it loads fonts from a CDN. Tickets lift tokens
and component CSS out of it into `styles.css`; the styleframe is deleted once
they have.

Reasoning for the surprising parts lives in `docs/adr/0003-two-ink-print-system.md`.
Vocabulary is `CONTEXT.md`.

## Tokens

Roles, never literals. Night mode redefines the same six names.

| Token | Day | Night | Means |
| --- | --- | --- | --- |
| `--stock` | `#e7e6e1` | `#16140f` | the table; page ground |
| `--card` | `#fbfaf7` | `#24211b` | card surface, lifted off the stock |
| `--card-lit` | `#ffffff` | `#302c23` | top of the card's face gradient |
| `--card-edge` | `#b3afa4` | `#4a4539` | card border, guilloché line |
| `--card-hi` | `#ffffff` | `#ffffff1f` | inset top edge — stock thickness |
| `--ink` | `#14110f` | `#edeae1` | all structure; **survive** |
| `--ink-dim` | `#636057` | `#a19b8e` | secondary, spent, captions |
| `--red` | `#c8102e` | `#f0564a` | **bust / loss only** |
| `--red-wash` | `#c8102e1f` | `#f0564a24` | bust fill |
| `--rule` | `#b8b6ae` | `#46423a` | hairlines, tracks, **push** |
| `--pin` | `#14110f` | `#edeae1` | the visitor's own result |

Contrast, smallest text on ground: ink 15.0:1 day / 15.3:1 night, dim 5.1:1 /
6.7:1, red 4.7:1 / 5.7:1. All pass AA at body size.

Night mode is `prefers-color-scheme` by default. The toggle sets `data-theme` on
`<html>` and lives outside the seam.

## Type

| Role | Face | Use |
| --- | --- | --- |
| Display | Archivo Narrow 600/700, uppercase, `0.1–0.2em` tracking | anything printed on the table: rules line, act headers, thesis, buttons |
| Body | Source Serif 4 | the argument, and every explanatory note |
| Data | JetBrains Mono, `tabular-nums` | every number that moves: probabilities, counts, the play-out counter |

The rule that matters: **prose is always the serif.** Mono is for numbers. Setting
paragraphs in mono was tried and makes the page read as a terminal.

Scale: `h1` `clamp(1.3125rem, 6vw, 2.125rem)`, `h2` `clamp(1.375rem, 6vw,
1.75rem)`, `h3` `0.75rem` caps, body `1.0625rem/1.6`, lede `1.1875rem`, note
`0.9375rem`, data `0.75rem`.

## Components

**Card.** `5/7` aspect, `8px` radius, face gradient `--card-lit → --card`, border
`--card-edge`, and a three-part shadow: `inset 0 1px 0 --card-hi` for stock
thickness, a tight contact shadow, then a soft cast. Hands overlap by `-0.85rem`
with rotations of about −2.5°, +1.5°, +5° so the hand looks placed rather than
laid out. Face-down cards get a guilloché back. A busting card takes a red border
and red rank. **Depth exists only here and on the Shoe.**

**The thirteen-rank axis.** `grid-template-columns: repeat(5, 1fr) 2px repeat(8,
1fr)`, gap `0.2rem`, exported as `--axis-cols` so every row that uses it aligns
exactly. The `2px` column is the bust line; it is `--ink`, stretches, and has
negative block margin so it pokes past the cards and reads as an edge rather than
a gap. Rows that share the template: the rank strip, Act 2's composition bars,
Act 3's Hi-Lo values.

**Bars.** Fill is `--ink` at 14%; the **top edge is a 2px solid data line**. A
solid fill at these heights reads as a black mass, not a chart.

**Waffle.** `repeat(40, 1fr)` × 25 rows = 1,000 marks, one per Play-out. Lost is
`--red-wash`, won is ink at 22%, push is `--rule` at 55%, and the visitor's own
Play-out is `--pin` solid with an outline — the only solid mark on the page. Marks
start `pending` and fill as the simulation runs; the counter is the fill, not an
animation over a finished number. Under `prefers-reduced-motion` it renders
complete. Needs a text equivalent on the container.

**Shoe.** An edge-on stack of card edges — `repeating-linear-gradient` at 2px/1px
— with a 2px ink cut line at the boundary and an empty remainder. It thins; it is
not a progress bar.

**Detail slot.** Bordered box pinned under the axis. Selected rank as a display
heading, then a `dl` of tabular figures. Replaces a popover deliberately.

**Buttons.** Every action is a real `<button>`. Hit and Stand carry identical
visual weight — the page must not nudge an intuition it is about to test. Advance
buttons are full-width at 390, `min-width: 20rem` from `60rem`. Focus is
`2px solid var(--ink)` at `3px` offset.

**Reference drawer.** A `<details>` holding shoe, upcard, push, draw, play-out,
running count. Keyboard-native, no modal. Terms are still defined inline at first
use; the drawer is for the second time you forget.

## Flow

Act 1 stages into four beats, each ended by a real button, so 390 never becomes
one long scroll:

1. **Decide** — dealer upcard, your hand, Hit / Stand. Nothing else on screen.
2. **The thirteen Draws** — the strip, `5/13 · 38.5%` survive against
   `8/13 · 61.5%` bust, and the confrontation copy. → *Play my hand*
3. **Your hand, dealt honestly** — played to settlement, copy responding to the
   actual result including the winning one. → *Show me 1,000 more hands*
4. **The thousand** — dealer final-total histogram (17/18/19/20/21/bust, real
   Monte Carlo, the chart that explains the loss) and the waffle with your mark
   in it. → *Try the other decision*

Act 2 holds the hand constant and offers one control: Finite Shoe against
Independent Draw. The composition bars move under the first and are pinned at 24
under the second.

Act 3 is free play from the depleting Shoe. The Hi-Lo rule is taught as the
annotated axis, with the value of the card that just left flashed on its own
column. The close is offered once the Running Count crosses roughly +6, with a
permanent escape hatch, so the visitor has genuinely earned the information the
Scripted Hand then fails to reward.

Layout is one column at 390 and two from `60rem` — table left, model right. Same
blocks, same order. Nothing in TypeScript knows which one it is in.
