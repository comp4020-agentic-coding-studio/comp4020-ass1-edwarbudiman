# 01 — Clear the evidence gate

Status: done
Blocked by: —

## Why first

`pnpm check:evidence` gates the deploy. It currently fails, so no amount of
finished Explainer ships. Fixing it costs minutes and unblocks everything.

Current output:

```
✗ current reflection is missing — the marker reads reflections/assignment-1.md for assignment-1
✗ no PROCESS.md in the repo root
```

## What to do

- Move `meta/PROCESS.md` to the repository root. Strip the template boilerplate.
  Every citation must be a markdown link whose text is an abbreviated SHA, or a
  `sha...sha` range, resolving to a real commit in this repo.
- Write `reflections/assignment-1.md`.
- `PROCESS.md` is written **from `session-recap.md`**, not from memory. See the
  "Working here" section of `CLAUDE.md`.
- Leave `meta/CLAUDE.md` alone.

## Done when

`pnpm check:evidence` exits 0, and `pnpm check` is still green.
