# Blackjack Explainer — the ticket set

Fifteen tickets. Read `spec.md` and `design.md` in the parent directory before
picking one up, and `CONTEXT.md` at the repo root for the vocabulary.

## Order

```
01 evidence gate ─┬─ 02 static shell ─┬─ 03 the seam ──────┬─ 06 Act 1 beats 1–3
                  │                   │                    │        │
                  │                   └─ 04 visual system  │        ▼
                  │                          │             │   07 Act 1 beat 4
                  │                          ▼             │        │
                  │                     05 axis + cards ───┘        ▼
                  └──────────────────────────────────────────► 08 DEPLOY
                                                                    │
              09 popovers ──────────────────────────────────────────┤
                                                                    ▼
                                              10 Act 2 locked ─► 11 Act 2 free
                                                                    │
                                                                    ▼
                                                              12 Act 3 close
                                                                    │
                       14 contracts (after 03)                      ▼
                       15 self-host fonts (after 08)         13 accessibility
```

**01 first** because `pnpm check:evidence` gates the deploy and currently fails.
**08 as early as it can go** — a first deployment attempted near the deadline is
the most common way a finished artefact scores nothing.

## Already done, do not re-do

- `src/engine/` — ranks and soft-Ace totals, Shoe composition, exact Draw
  probability under both Deal Models, dealer Play-out, seeded Monte Carlo,
  Hi-Lo. 27 tests in `spec/engine.test.ts`.
- `scripts/figures.ts` — runs the engine at the shipped seed.
- The visual system, locked in `design.md` and demonstrated in
  `styleframe.html`. Delete the styleframe and `frames.html` once 04, 05 and 09
  have lifted what they need out of it.

## Rules that apply to every ticket

- No figure is typed by a human. Everything comes from `src/engine/`.
- `render(state)` is a pure function of `State`. No TypeScript reads a viewport
  dimension, ever.
- `--red` means bust or loss and nothing else.
- Run `pnpm check` before every commit. Never commit a red state.
- Commit small and often — the history is read as evidence.
