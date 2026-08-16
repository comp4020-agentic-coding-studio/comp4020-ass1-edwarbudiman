# 04 — The visual system in styles.css

Status: done
Blocked by: 02

## Why

The design is locked and the reference implementation exists. This ticket lifts
it out of the proof sheet into the shipped stylesheet.

## What to do

Port from `.scratch/blackjack-explainer/styleframe.html` into `styles.css`:

- the token block, as roles not literals: `--stock`, `--card`, `--card-lit`,
  `--card-edge`, `--card-hi`, `--ink`, `--ink-dim`, `--red`, `--red-wash`,
  `--rule`, `--pin`
- night mode: `prefers-color-scheme` by default, plus `[data-theme]` overrides
  so a toggle wins in both directions
- the type roles: Archivo Narrow caps for table print, Source Serif for prose,
  JetBrains Mono `tabular-nums` for numbers that move
- `--axis-cols` and `--axis-gap`
- the 390 layout first; the two-column spread from `60rem`

The theme toggle lives **outside the seam**: it flips `data-theme` on the root
element and touches no `State`.

Discipline to preserve, all of it load-bearing:

- `--red` means bust or loss and nothing else, anywhere
- cards are printed in one ink whatever the suit
- prose is always the serif; mono is for numbers
- depth belongs to cards and the Shoe only; nothing else casts a shadow

## Done when

`pnpm check` green including stylelint, both themes render, and resizing between
390 and 1920 changes no JavaScript state.

## References

`.scratch/blackjack-explainer/design.md`, `docs/adr/0003-two-ink-print-system.md`.
