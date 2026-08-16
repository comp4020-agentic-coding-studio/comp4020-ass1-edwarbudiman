# 03 — The seam: State, transitions, render

Status: done
Blocked by: 02

## Why

One module boundary, everything behind it pure, so tests can drive the whole
Explainer without a DOM harness beyond JSDOM.

## What to do

Behind `src/explainer/`:

- a `State` describing current Act, Act 1 beat, the hand, the Shoe, the Deal
  Model, the Decision, Play-out progress and the Running Count
- pure transitions `State -> State`, one per visitor action
- `render(state)` returning an **HTML string**

Outside it, a thin shell in `main.ts` that mounts the string, listens for
`hashchange`, and delegates events. The shell holds no logic worth testing.

Hard rules:

- `render` is a pure function of `State` alone. No transition and no math
  function may read `window.innerWidth`, `matchMedia`, or any viewport
  dimension. Layout is CSS's job.
- Hash routing only, one fragment per Act (`#act-1`). GitHub Pages 404s a deep
  link to a path that is not a file.
- All maths comes from `src/engine/`. Nothing here computes its own figure.
- After every re-render, restore focus: to the control just activated where it
  still exists, otherwise to the region that changed. Treat this as part of the
  render cycle, not a polish pass.

## Done when

Applying a Decision to a `State` produces `render` output that differs from the
output before it, asserted in `spec/`. Refresh and pasted links land in the
right Act. Tabbing through the page never dumps focus at the top of the
document after an action.

## References

`CLAUDE.md` — "One seam", "Restore focus after every re-render". Spec:
Implementation Decisions → The Explainer module.
