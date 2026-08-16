# 09 — Two popover sizes, and the reference drawer

Status: ready-for-agent
Blocked by: 04

## Why

Visible prose has to earn its place, so the explanations it displaces need
somewhere to live that costs nothing to ignore.

## What to do

Native `[popover]` + `popovertarget` throughout. **Click/tap only — no hover.**
Hover does not exist at 390×844 or for a keyboard user, and this page is marked
by tabbing, so a hover-only affordance would be an accessibility regression.

**Note** — small, anchored with `position-area` and
`position-try-fallbacks: flip-block, flip-inline` so it reflows at 390 in CSS
alone. No backdrop. Trigger is a small `?` button, or an inline button where the
word is the question (`push?`). Carries definitions and "why this matters".

**Panel** — large, centred, up to `36rem`, with a dimmed `::backdrop`, its own
heading and a close button. Carries the Hi-Lo rule and the discard tray.

Anchor positioning is CSS, so none of this touches the seam. Where it is
unsupported a note falls back to the top layer's centred default, which is fine.

**Reference drawer** — a `<details>` holding shoe, upcard, push, draw, play-out
and running count. Keyboard-native, no modal. Terms are still defined inline at
first use; the drawer is for the second time you forget.

The copy rule these enforce: a sentence stays visible only if it says something
the chart cannot, or a user story requires the visitor be told. Everything else
moves into a popover **or becomes the chart's screen-reader description** — story
48 asks for a text equivalent, not a visible paragraph. Never behind a click: the
thesis, and any warning.

## Done when

Esc closes an open popover and returns focus to the button that opened it, with
no JavaScript of ours involved.

## References

`design.md` → Components → Popover. ADR 0003.
