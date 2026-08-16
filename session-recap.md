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
