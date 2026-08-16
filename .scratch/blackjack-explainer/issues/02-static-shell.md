# 02 — The static shell

Status: done
Blocked by: 01

## Why

`spec/invariants.test.ts` parses the **built** HTML with JSDOM and does not
execute scripts. Anything rendered only by JavaScript is invisible to it. The
shell therefore has to be real markup or the shipped checks go red.

## What to do

Replace the starter content in `index.html` with the Explainer's shell, in
markup:

- `lang` on `<html>`, a `<title>`, the viewport meta
- `<nav aria-label="Acts">` listing the three real Acts as hash links
- exactly one `<h1>`
- the one-line table rules: six decks, dealer stands on all 17s, hit and stand
  only, no double, no split
- a `<noscript>` notice saying the Explainer needs JavaScript
- an empty mount point for the Acts

Delete `spec/starter.test.ts` — it describes the starter page and is designed to
fail once that page is replaced. Delete it rather than making it pass.

## Done when

`pnpm check` is green with `spec/starter.test.ts` gone, and the built
`dist/index.html` carries nav, single `h1`, `lang`, `title`, viewport meta and
`noscript` without any script running.

## References

`CLAUDE.md` — "The static shell is not optional". Spec: Implementation
Decisions → Shape.
