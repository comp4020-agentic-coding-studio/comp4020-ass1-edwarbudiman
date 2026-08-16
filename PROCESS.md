# Process overview

A reading-guide to how this repo came together — a map to the process, not an
essay about it. Follow the citations for the evidence.

## What I built

The Blackjack Probability Explainer: a single-page interactive site where
Blackjack is the mechanic and decision-making under uncertainty is the subject.
Three Acts carry one visitor's hand from a single honest deal, through the
mechanics of the shoe, to the strongest form of the thesis — even a maximised
information state (a tracked count) does not buy a good outcome on one hand.
Draw probabilities are exact arithmetic over the shoe; Play-out distributions
are seeded Monte Carlo, so the counter animation on screen is the simulation
actually running, not a fake count-up. The last line on the page is the point
of the whole thing: a good decision is not a promise of a good outcome.

## The moments that mattered

1. **Two factual errors were caught before any code existed, by grilling the
   draft rather than trusting it.** `brief-idea/blackjack/idea.md` marked a
   hand of 16 as busting on a 5 — it doesn't, 16 + 5 = 21 — and called for
   scripting a losing play-through into the closing beat. Both would have
   shipped a probability explainer that lied about probability, and the second
   one contradicts its own thesis: faking a result to make a point about
   results not mattering. Fixed by writing `CONTEXT.md`'s Draw/Play-out
   distinction and `docs/adr/0001`, which requires the closing hand be dealt
   honestly and only ever *labelled* as scripted
   ([`e863878`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-edwarbudiman/commit/e863878)).

2. **`docs/adr/0003` recorded a wrong reason, and the fix was to correct the
   record rather than quietly change the decision.** It had ruled out floating
   popovers on the grounds that the harness "forbids branching behaviour on
   viewport" — but that rule is about TypeScript reading width, not CSS anchor
   positioning, which a native `popover` with CSS anchor positioning does not
   do. I knew it was wrong because a popover a keyboard user or a 390px
   viewport actually needs (the discard tray, "why this matters") had been
   designed away for a reason that didn't hold up under rereading the actual
   rule. The ADR itself was edited to show the earlier reasoning and why it
   failed, so the history stays honest instead of erasing the mistake
   ([`a5c6177...45cc79d`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-edwarbudiman/compare/a5c6177...45cc79d)).

3. **Building `src/engine/` immediately contradicted three things drawn by
   hand before any arithmetic backed them.** The honest Act 1 deal gives the
   visitor a 4, not a bust — a win, not a loss, which is what made ADR 0001's
   "answer whichever result turns up" a real constraint instead of a
   hypothetical. Real settlement over the simulated shoes came back
   757 lost / 57 push / 186 won, nothing like the invented 540/380/80 the
   mock had used. And the styleframe's closing count of +6 turned out not to
   survive Hi-Lo's balance — measured over 300 shoes it arrives before 75%
   penetration only 74% of the time — so the design changed to the count's
   high-water mark, which always exists. I knew these were right because the
   engine has its own test suite (`spec/engine.test.ts`, 27 tests, including
   regressions for both known arithmetic errors) and `scripts/figures.ts`
   computes every number the proof sheet shows, so no figure on the page is
   typed by hand
   ([`d948241`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-edwarbudiman/commit/d948241)).

4. **The evidence gate itself was found broken in session one and left
   unfixed through session two, on purpose, until it could go first.**
   `pnpm check:evidence` failed from the start — `PROCESS.md` and `CLAUDE.md`
   had been moved to `meta/` in the initial commit
   ([`0d7329b`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-edwarbudiman/commit/0d7329b)),
   which meant the harness that's supposed to steer the agent wasn't in the
   root where either the agent or the checker would find it. Rather than fix
   it immediately and lose the thread of the design work, I ticketed it as
   issue 01 with the deploy pulled forward to issue 08, so a finished
   prototype is never blocked at the deadline by process evidence that could
   have been fixed in minutes at any point along the way
   ([`432708a`](https://github.com/comp4020-agentic-coding-studio/comp4020-ass1-edwarbudiman/commit/432708a)).

## Before you ship

The full session-by-session account, dead ends included, is in
`session-recap.md` at the repo root — this file is a curated subset of it, not
a replacement.
