# Blackjack Probability Explainer

A single-page interactive explainer. Blackjack is the mechanic; decision-making
under uncertainty is the subject. The thesis, and the last line on the page: **a
good decision is not a promise of a good outcome.**

Read before writing code:

- `CONTEXT.md` — the glossary. Use its terms exactly.
- `.scratch/blackjack-explainer/spec.md` — the spec.
- `docs/adr/` — decisions that are expensive to reverse.

`brief-idea/blackjack/idea.md` is a draft that predates the design. Where it
conflicts with `CONTEXT.md` or the spec, it loses. It also contains a factual
error: for a hand of 16, the surviving draws are A, 2, 3, 4 and 5 — five ranks
of thirteen — and the eight remaining ranks bust. Do not copy its outcome grid.

## Rules for this prototype

**State belongs to JavaScript, layout belongs to CSS.** Never read
`window.innerWidth`, `matchMedia`, or any viewport dimension in TypeScript.
Never branch behaviour on screen size. Layout is decided in CSS alone. This is
what makes resizing mid-interaction free, and a marker resizes mid-interaction.

**The static shell is not optional.** `index.html` must carry the `<nav>`, the
single `<h1>`, `lang`, `<title>`, the viewport meta and a `<noscript>` notice in
markup. `spec/invariants.test.ts` parses the built HTML with JSDOM and does not
execute scripts, so anything rendered only by JS is invisible to it and the
check goes red.

**Hash routing only.** One fragment per Act (`#act-1`). GitHub Pages serves
static files; a deep link to a path that is not a file returns 404.

**One seam.** A `State` type, pure transitions over it, pure math functions, and
a `render(state)` that returns an HTML string. Tests parse that string with
JSDOM. The DOM mount and hash listener are a thin shell outside the seam and
hold no logic.

**Restore focus after every re-render.** Replacing markup destroys focus, and
the page is marked by tabbing through it. Every action is a real `<button>`.

**No hardcoded probabilities.** Draw probabilities are computed exactly from the
shoe composition. Play-out distributions come from seeded Monte Carlo — the seed
is part of the tested contract, not a tuning knob. See ADR 0002.

**Deal honestly.** Only the closing Scripted Hand is chosen, and it says so on
screen. See ADR 0001.

**Build the 390×844 layout first.** Both viewports are marked in full; widening
is the easy direction.

## Working here

- Run `pnpm check` before every commit. Never commit a red state.
- Commit small and often — the history is read as evidence, not just the final
  state.
- Append a short entry to `session-recap.md` at the end of each session: what I
  was trying to do, what went wrong, what changed **in the harness** (a rule
  added here, a check wired up, an attempt discarded), and the commit range.
  `PROCESS.md` gets written from that file, not from memory.
- `pnpm check:evidence` gates the deploy. It needs `PROCESS.md` at the repo
  root with citations that resolve to real commits, and
  `reflections/assignment-1.md`.

## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/<feature-slug>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical roles, unchanged; recorded as a `Status:` line in each file. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
