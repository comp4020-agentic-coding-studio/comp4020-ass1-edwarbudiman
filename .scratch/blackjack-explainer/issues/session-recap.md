
---

## 2 — Locking the design, and building the engine that broke it

**What I was trying to do.** Get from an approved spec to a ticket set, but see
and lock the visual design first rather than discover it ticket by ticket.

**What went wrong, or was wrong to begin with.**

- The first styleframe's signature figure was **meaningless**. It pinned the
  visitor's result at a horizontal position inside a "lost" segment — but nothing
  orders that segment, so the position encoded nothing while looking like it
  encoded something. I only found out because I couldn't understand my own
  chart. Replaced with a dealer-total histogram plus a 1,000-mark waffle.
- I set three-line paragraphs in the monospace face on the first pass, having
  just written the rule that mono is for numbers. It read as a terminal.
- The proof sheet printed **10 + 6 + 9 = 26**. It is 25. A typed number in a
  page about getting numbers right — the same class of error as the brief's
  5-busts-16 that the last session caught.
- I recorded a reason in ADR 0003 that was **wrong**: that floating popovers
  were ruled out because the harness forbids branching on viewport. It forbids
  *TypeScript* reading width; CSS anchor positioning is fine. Corrected in the
  ADR rather than quietly changed.
- The visitor's mark in the waffle was white — announcing identity and hiding
  outcome, in the one figure arguing the outcome doesn't matter.
- **The Acts in the spec and the Acts in my head were different documents**, and
  we had been designing against both for several rounds. Free play was Act 3 in
  the spec and Act 2 in the user's model. That single mismatch caused most of
  the circling.

**Where the engine overruled the design.** Building `src/engine/` was demanded
after the arithmetic error, and it immediately contradicted three things I had
drawn by hand:

- The honest deal gives a **4**, not a bust — the visitor makes 20 and **wins**.
  ADR 0001 said copy must answer whichever result turns up; that was theory
  until the deal disagreed with the mock.
- Real settlement is **757 lost / 57 push / 186 won**, not the invented
  540/380/80. The argument got stronger.
- The **+6 closing count does not work**. Hi-Lo is balanced and returns toward
  zero as the shoe empties: measured over 300 shoes, +6 arrives before 75%
  penetration in only 74% of them and takes ~14 hands when it does. Replaced
  with the count's high-water mark, which always exists.

Also caught before it shipped: the dealer histogram would have been silently
conditioned on "the hands where you did not bust", because a busted player ends
the hand before the dealer plays. It needed its own simulation run.

**What changed in the harness.**

- `docs/adr/0003-two-ink-print-system.md` — two inks on stock, one-ink cards so
  red can only mean loss, the Ace-first axis reused across all three Acts, the
  theme toggle outside the seam, `--pin` as identity not outcome.
- `src/engine/` and `spec/engine.test.ts` — 27 tests, including regressions for
  both known arithmetic errors. `scripts/figures.ts` writes every figure the
  proof sheet shows, so no number is typed anywhere.
- `tsconfig.json` — `allowImportingTsExtensions`, so `node scripts/figures.ts`
  runs the engine directly with no build step.
- `CONTEXT.md` — the three Acts named explicitly, because naming them loosely is
  what sent the conversation in circles; plus "high-water mark", and an explicit
  note that a high count never says the next card is good.
- `.scratch/blackjack-explainer/spec.md` — Acts re-cut, story 21 revised, stories
  29–35 moved to Act 2, stories 56–63 added.
- `.scratch/blackjack-explainer/design.md` — the ticket-facing visual reference.
- `.scratch/blackjack-explainer/issues/` — fifteen tickets plus a README.

**What I'm carrying into the next session.** Ticket 01, the evidence gate, which
still fails and still blocks the deploy. Then the shell, the seam, Act 1, and
**deploy at ticket 08** rather than at the end.

**Commits.** `516d69d..bd70ccc`.
