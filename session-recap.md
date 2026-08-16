# Session recap

Append-only, newest at the bottom. One entry per working session, in four
parts: what I was trying to do, what went wrong, what changed in the harness,
and the commit range. `PROCESS.md` is written from this file at the end — it is
a record, not a highlight reel, so dead ends and overrules belong here too.

---

## 1 — Grilling the brief into a spec

**What I was trying to do.** Turn `brief-idea/blackjack/idea.md` — a long,
enthusiastic draft — into something buildable, and find out whether it matched
the actual Assignment 1 brief before writing any code.

**What went wrong, or was wrong to begin with.**

The agent pulled the published brief and assessment page rather than working
from my summary, and three things came back that changed the shape of the work:

- Process is **45%** of the mark and wants a history that grew with the work.
  My repo was two commits, one of which had moved `CLAUDE.md` and `PROCESS.md`
  out of the way. That made process, not the artefact, the binding constraint.
- `pnpm check:evidence` was failing and **gates the deploy** — `PROCESS.md` was
  under `meta/` instead of the root, and `reflections/assignment-1.md` did not
  exist. No amount of finished prototype would have shipped.
- The marker's routine is specific: both viewports, uses the core interaction
  for a minute, **resizes mid-use, and tabs through it**. That turned resize
  behaviour and keyboard support from nice-to-haves into scored behaviour.

Two errors in my own draft came out under questioning:

- The outcome grid at `idea.md:72` marks a **5** as busting a hand of 16. It
  doesn't — 16 + 5 = 21. The real split is five surviving ranks against eight
  busting ones. A wrong number in a probability explainer is the worst possible
  error to ship, and it was sitting in the file my agent would read first.
- The draft called for **intentionally scripting a losing play-through**. In an
  explainer whose entire subject is that a result doesn't prove anything about
  the decision, faking the result is the artefact contradicting itself.

**Where I overruled the agent.** It pushed hard to cut to a single idea and drop
the finite-shoe and card-counting material, on the grounds that the brief asks
for "one strong idea and nothing else". I kept all three, but as one
progression rather than three explainers, and we then rebuilt the through-line
so card counting became the *strongest form* of the thesis rather than a
tangent: even maximum information doesn't buy a good outcome on one hand. The
scope discipline the agent wanted got applied inside each Act instead — Hit and
Stand only, Running Count without True Count, no penetration.

**What changed in the harness.**

- `CONTEXT.md` created, then grown twice as terms settled. It fixes the
  distinction the draft blurs throughout: a **Draw** is one next card, a
  **Play-out** is a hand carried to settlement. They are different charts
  teaching different things and the draft used "simulate 1,000 times" for both.
  Also names the **Scripted Hand** with the condition that it must be labelled
  on screen.
- `docs/adr/0001` — deal honestly, script only the labelled closing beat.
- `docs/adr/0002` — exact arithmetic for Draws, seeded Monte Carlo for
  Play-outs. The agent had recommended exact enumeration and revised itself once
  it noticed the real requirement was *testability*, not exactness; a seeded
  generator is deterministic, so a test can assert it, and the counter animation
  becomes the simulation actually running rather than a fake count-up.
- `.scratch/blackjack-explainer/spec.md` — the spec, 55 user stories, one
  testing seam, and four named contracts.
- `CLAUDE.md` rewritten from a six-line stub into the actual rules, so future
  sessions inherit them instead of me re-pasting context. The load-bearing ones:
  state belongs to JS and layout to CSS with no viewport reads in TypeScript;
  the static shell must carry `nav`, the single `h1`, `lang`, `title` and the
  viewport meta because `spec/invariants.test.ts` parses built HTML with JSDOM
  **without executing scripts**, so a JS-rendered heading is invisible to it;
  hash routing only, because GitHub Pages 404s a deep link to a non-file path.
- `docs/agents/triage-labels.md` added to complete the skills config.

**What I'm carrying into the next session.** The evidence gate first, before any
feature work, because it blocks the deploy. Then the seam and the math, then Act
1, then **deploy immediately** rather than at the end.

**Commits.** `e863878` — the whole design landed as one commit, deliberately
before any implementation, so the history shows the thinking happened first.

## Session 3 — build it, ship it

**What I was trying to do.** Work the fifteen tickets to done, with smaller
models writing the code and me reviewing every diff rather than typing any of
it. Deploy as soon as Act 1 stood up, not at the end.

**How it went.** Fourteen tickets landed, one closed `wontfix` by decision. The
Explainer is live and all three Acts work. Roughly: evidence gate and shell
first, then the seam, then the visual system, then Act 1 in two passes, deploy,
then Act 2's locked opening and free play, Act 3, and the accessibility pass.

**What went wrong, and it was almost always the same thing.** Parallel agents
each did their own ticket correctly and left the seams between them broken:

- The shell agent produced structurally correct markup carrying none of the
  design's class names, so the ported stylesheet slid straight off it.
- The stylesheet agent correctly dropped `.plate-label` as proof-sheet
  scaffolding; two later agents re-emitted it from the styleframe, and it would
  have shipped as unstyled body text. Fixed twice.
- Nothing set `aria-current`, though the stylesheet had always styled it.
- The Act 3 offer banner was assembled with `innerHTML` in `main.ts`, putting
  page prose in a third place and outside every test.

The lesson for the harness: **an agent given one ticket optimises for that
ticket.** The integration between tickets is not anyone's ticket, and it has to
be someone's job. It was mine, and it was most of the work.

**The one factual error I caught before it propagated.** My own brief to the
seam agent said the dealer holds "upcard + hole card". The engine holds only
the upcard — the hole card is dealt honestly at play-out, which is the whole of
ADR 0001. Left alone it would have removed four cards from the opening Shoe
instead of three and shifted every probability off the shipped figures. Caught
by reading `scripts/figures.ts` rather than trusting my own instruction, and
corrected mid-flight with a check the agent could verify against: an Ace must
come out at exactly 24/309.

**Three violations of ADR 0003, all inherited faithfully.** `--red` means bust
or loss "and nothing else, anywhere, ever" — and the styleframe breaks its own
ADR three times: Hi-Lo `−1` values, the thinnest composition bar, and the
"Chosen, not dealt" stamp. A faithful port inherited all three. Two of them
actively inverted the argument: `−1` is tens and aces, and the thinnest rank at
the shipped figures is the 3s — both of which *favour* the visitor. The
styleframe is a proof sheet; where it and the ADR disagree, the ADR wins.

**What changed in the harness.**
- `.stylelintrc.json` gained a `selector-class-pattern` override permitting the
  design's BEM `--modifier` names, replacing seven scattered
  `stylelint-disable` comments. The config says it once instead of the
  stylesheet apologising seven times.
- `actionButton()` in `render.ts` now mints a stable id per action. Focus
  restoration looks controls up by id, so a button without one can never be
  found again — the shell's "restore to the control just activated" branch was
  unreachable dead code until this existed.
- `render.ts` split into `acts/act-1.ts`, `act-2.ts`, `act-3.ts` so Acts could
  be built in parallel without colliding.
- `src/engine/simulate.ts` gained `simulateTrials`, and `simulate` now reduces
  its output rather than sampling a second time — one loop, so the aggregate
  and the per-trial list can never drift. Verified by regenerating
  `figures.json` and diffing: byte-identical, so the RNG order is unchanged.

**An attempt discarded.** Ticket 15 (self-host the fonts) was closed `wontfix`
after asking: the CDN `<link>` was chosen instead. The cost is written into the
ticket rather than left to be rediscovered — with Google blocked the page falls
back to Helvetica Neue / Georgia / ui-monospace, and the marked page now
depends on a third party being reachable.

**Commits.** `d6215f8...` through the accessibility pass — 178 tests across 12
files, green, deployed at
https://comp4020-agentic-coding-studio.github.io/comp4020-ass1-edwarbudiman/

### The code review, and what it caught

Running `/code-review` over the whole range afterwards returned ten findings
against a green 178-test suite. That number is the point: **every one of these
was invisible to the tests the same agents had just written.** Confirmed each
before acting rather than taking the review at face value.

The one that mattered most: `dealerDistribution` removes the dealer's cards
from the Shoe itself, and both `acts/act-1.ts` and `scripts/figures.ts` handed
it a Shoe those cards were *already* gone from. Three tens removed for two
cards on the table. Verified directly — the opening Shoe holds 22 tens, the
histogram was simulating from 21 — and it had been baked into the shipped
`figures.json` since the engine was built. The dealer histogram moved on the
fix: 20 went 332 → 335, bust 205 → 207.

Two more were structural rather than arithmetic:

- `replayWithOtherDecision` reset the Shoe to the opening deal but left Act 2's
  free-play hand alone, so the Explainer could hold a hand whose exact cards
  were simultaneously back in the Shoe, beside a tray claiming three discards.
- Beat 4 recomputed from `state.model`, so switching the Deal Model in Act 2
  and returning rewrote a report on a hand that had already been played — 38.8%
  silently becoming 38.5% under copy still reading "the only one that actually
  happened to you". Fixed by recording the Deal Model in force at deal time.

And the accessibility pass had fixed exactly half of a focus bug: it gave every
control inside the mount a stable id, but the shell still restored focus when
the focused element was *outside* the mount, so the beat 4 climb yanked focus
off the nav and the Reference drawer on every frame. Scoping restoration to the
mount fixed the half a targeted pass had no reason to look at.

**The harness lesson, again.** Tests written by the agent that wrote the code
inherit that agent's blind spots. The review was worth more than any single
ticket in the set, and it should run before the work is called done, not after
it is already deployed.
