# 14 — The four spec contracts as tests

Status: done
Blocked by: 03

## Why

The spec names four contracts. Two are already covered by `spec/engine.test.ts`;
two need the seam to exist first.

## What to do

1. **The core interaction** — applying a Decision to a `State` produces a
   `render` output that differs from the output before it. Parse with JSDOM, as
   `spec/invariants.test.ts` does.
2. **The Draw math** — for a hand of 16 the surviving rank set is exactly
   `{A,2,3,4,5}` and the busting set is the other eight. *Already covered.*
3. **The Deal Models differ** — after a rank is dealt its Draw probability is
   strictly lower under Finite Shoe and exactly unchanged under Independent
   Draw. *Already covered.*
4. **Resize safety** — `render` called twice on the same `State` under different
   reported viewport widths produces identical output, and no transition mutates
   `State` in response to a width.

A good test here asserts what the Explainer does, not how it is built. It never
reaches for internal helpers, never asserts on class names carrying no meaning,
and never asserts a probability the implementation happens to produce rather than
the one the domain requires.

## Done when

All four hold, and the shipped invariants are still green.

## References

Spec → Testing Decisions.
