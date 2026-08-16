# Blackjack Probability Explainer

Status: ready-for-agent

## Problem Statement

Most people judge a decision by how it turned out. If you hit on 16 and bust,
you feel you made a mistake; if you stand and the dealer busts, you feel you
were right. This is backwards, and it is not a gambling problem — it is how
people assess their own choices about careers, money, health and risk in
general. The confusion is invisible from the inside, because a single result
always *feels* like evidence about the decision that produced it.

There is a second, quieter confusion underneath it: people talk about
probability as though it were a fixed property of a situation, rather than
something that moves as information arrives. Someone who believes "the odds are
the odds" has no way to understand why a card counter would bother.

A visitor has no cheap way to feel either of these. Reading the sentence "a good
decision is not a promise of a good outcome" changes nothing, because they
already agree with the sentence and still don't believe it about their own last
bad result.

## Solution

A single-page interactive Explainer that uses blackjack as its mechanic and
decision-making under uncertainty as its subject. The visitor plays, and the
page argues.

It moves through three Acts, holding one layout and revealing progressively
more:

- **Act 1** — a fixed hand of 16 against a dealer 10. The visitor must choose
  Hit or Stand on intuition. Then the Explainer shows all thirteen possible
  Draws, and the visitor discovers that *both* choices lose more often than they
  win, and that the better choice is the one that loses *less*. Their hand is
  then honestly played out.
- **Act 2** — the same hand, held constant, with the Deal Model as the only
  variable. Under Finite Shoe the Draw distribution moves as cards leave; under
  Independent Draw it never moves. One variable, one visible difference.
- **Act 3** — free play from a depleting Shoe with a Hi-Lo Running Count. The
  visitor accumulates the best information a blackjack player can legitimately
  have, and then a labelled Scripted Hand takes it away from them anyway.

The closing line is the thesis: **a good decision is not a promise of a good
outcome.** Card counting is not a tangent — it is the strongest form of the
argument, because it shows that even maximum information does not buy a good
result on any particular hand.

## User Stories

### Arriving

1. As a visitor, I want the page to load with a readable heading and framing
   question before any script runs, so that I know what I have arrived at even
   on a slow connection.
2. As a visitor with JavaScript disabled, I want a plain message telling me the
   Explainer needs JavaScript, so that I am not staring at an empty page
   wondering if it is broken.
3. As a visitor, I want the opening screen to show me very little, so that I am
   pushed into making an intuitive Decision rather than reading a tutorial.
4. As a visitor, I want to see the table rules stated in one line, so that I know
   the Explainer is not hiding simplifications from me.
5. As a visitor who knows blackjack, I want Double and Split to be explicitly
   named as omitted, so that I read their absence as a choice rather than an
   error.

### Act 1 — the Decision

6. As a visitor, I want to see the dealer's upcard and my two cards with my hand
   total, so that I understand the situation without knowing blackjack.
7. As a visitor, I want Hit and Stand offered as two obvious controls, so that
   the Decision in front of me is unmistakable.
8. As a visitor, I want to make my Decision before seeing any probability, so
   that my intuition is recorded honestly rather than corrected in advance.
9. As a visitor, after I decide, I want to see all thirteen possible Draws laid
   out with which survive and which bust, so that the abstraction becomes
   something I can count.
10. As a visitor, I want the survive/bust split stated as a proportion as well as
    shown, so that I can take away a number and not only an impression.
11. As a visitor, I want to discover that hitting 16 busts more often than not,
    so that my instinct to avoid busting is confronted with what busting
    actually costs.
12. As a visitor, I want to learn that Standing on 16 also loses most of the
    time, so that I understand this is a choice between two bad options.
13. As a visitor, I want to see that the better Decision is the one that loses
    less, so that I acquire a definition of "better" that does not depend on
    winning.
14. As a visitor, I want my chosen hand to actually be played out to settlement,
    so that I see a real consequence rather than a statistic.
15. As a visitor, I want the Play-out to be dealt honestly, so that the Explainer
    is not lying about the very thing it is explaining.
16. As a visitor who busts, I want to be told I made the better Decision and
    still lost, so that the thesis lands on my own result.
17. As a visitor who wins, I want to be told that winning does not prove the
    Decision was good either, so that the lesson is not something I can escape
    by getting lucky.
18. As a visitor, I want to see the distribution of many Play-outs of the
    Decision I made, so that my single result is placed inside the range of
    results it came from.
19. As a visitor, I want the Play-out counter to visibly climb as the
    distribution fills, so that probability feels like an accumulation rather
    than a number handed to me.
20. As a visitor, I want to be able to replay Act 1 with the other Decision, so
    that I can compare the two distributions rather than take the claim on
    trust.

### Act 2 — the Deal Model

21. As a visitor, I want the hand to stay exactly the same when I reach Act 2, so
    that I can attribute any change to the Deal Model and nothing else.
22. As a visitor, I want a single control switching between Finite Shoe and
    Independent Draw, so that the comparison is one action wide.
23. As a visitor, I want each Deal Model named in plain language on the control,
    so that I do not have to already know the jargon to use it.
24. As a visitor, I want to see the Shoe's remaining count and composition, so
    that "cards are removed" is a thing I watch rather than a claim I accept.
25. As a visitor under Finite Shoe, I want the Draw probabilities to change as
    cards leave, so that I can see the past constraining the future.
26. As a visitor under Independent Draw, I want the Draw probabilities to stay
    fixed no matter what has been dealt, so that the contrast is unmistakable.
27. As a visitor, I want to see a before-and-after probability for a specific
    rank once a card of that rank has been dealt, so that the effect is concrete
    rather than atmospheric.
28. As a visitor, I want to understand that only one of these two worlds makes
    remembering worthwhile, so that Act 3 has a reason to exist.

### Act 3 — the Running Count

29. As a visitor, I want to keep playing hands from the same Shoe, so that
    information accumulates instead of resetting.
30. As a visitor, I want cards to visibly leave the Shoe and gather somewhere,
    so that depletion is a physical fact on screen.
31. As a visitor, I want a Running Count that updates as each card appears, so
    that I can watch information being extracted from the past.
32. As a visitor, I want the Hi-Lo values shown for the card that just left, so
    that I can learn the rule by watching it applied rather than by reading it.
33. As a visitor, I want to be told what a rising Running Count means about the
    remaining Shoe, so that I do not mistake it for a prediction of the next
    card.
34. As a visitor, I want to be explicitly warned that the Running Count does not
    say what comes next, so that I do not leave with the gambler's fallacy in a
    new costume.
35. As a visitor with a strongly positive Running Count, I want to feel that I
    now hold the best information available, so that the closing beat has
    something to take away from me.

### The close

36. As a visitor, I want a final Scripted Hand that I lose despite holding good
    information, so that the thesis is delivered at its strongest point.
37. As a visitor, I want the Scripted Hand to be clearly labelled as chosen
    rather than dealt, so that the Explainer does not undermine its own subject
    to make its point.
38. As a visitor, I want the closing statement to be short and unhedged, so that
    I leave with one sentence rather than a summary.
39. As a visitor, I want to be able to return to any Act after finishing, so that
    I can re-examine a step now that I know where it was going.

### Moving through the Explainer

40. As a visitor, I want the URL to reflect which Act I am in, so that I can
    return to or share a particular step.
41. As a visitor, I want a refresh or a pasted link to land me in the right Act,
    so that the address bar is not lying to me.
42. As a visitor, I want my Shoe and my Running Count preserved when I move
    between Acts, so that Act 3 is about accumulated information rather than a
    fresh start.
43. As a visitor, I want the navigation landmark to list the real Acts, so that
    the page's structure is available to me and to a screen reader.

### Keyboard and assistive technology

44. As a keyboard user, I want to reach Hit, Stand, the Deal Model control and
    every other action by tabbing, so that I can use the whole Explainer without
    a mouse.
45. As a keyboard user, I want every action to be a real button, so that Enter
    and Space behave the way I expect.
46. As a keyboard user, I want focus to land somewhere sensible after the page
    re-renders, so that a Decision does not throw me back to the top of the
    document.
47. As a keyboard user, I want a visible focus indicator throughout, so that I
    always know what I am about to activate.
48. As a screen reader user, I want every probability chart to have a text
    equivalent, so that the argument does not live only in the bars.
49. As a screen reader user, I want the result of my Decision announced, so that
    I learn the outcome without polling the page.

### Viewports and resizing

50. As a phone visitor at 390×844, I want the cards to stay recognisably
    card-shaped, so that the central visual language survives the small screen.
51. As a phone visitor, I want the thirteen Draws laid out as a compact grid, so
    that I can take in the survive/bust split at a glance without scrolling.
52. As a phone visitor, I want the distribution bars to run full width, so that
    proportions remain readable.
53. As a desktop visitor at 1920×1080, I want the table and the probability model
    side by side, so that I can watch cause and effect together.
54. As a visitor who resizes mid-use, I want my Decision, my Shoe and my
    Play-out progress to continue exactly where they were, so that the layout
    changing does not cost me my place.
55. As a visitor who resizes mid-Play-out, I want the counter to keep climbing
    rather than restart, so that nothing on screen suggests the work was thrown
    away.

## Implementation Decisions

### Shape

- One page, `index.html`, static and client-side throughout. Plain TypeScript —
  no UI framework. Vite is the build; the existing config already emits relative
  asset URLs, so no base-path work is needed.
- The static markup carries the header, the navigation landmark, the single
  top-level heading, the language, the title, the viewport meta and a `noscript`
  notice. Scripts render the Acts into the main region. This is not stylistic:
  the shipped invariants parse the built HTML with JSDOM and do not execute
  scripts, so anything rendered only by JavaScript is invisible to them.
- Routing is hash-based, one fragment per Act. Path routing is ruled out: GitHub
  Pages serves static files and a deep link to a path that is not a file returns
  404.

### The Explainer module — the single seam

Everything meaningful sits behind one module boundary, and everything behind it
is pure:

- a `State` describing the current Act, the hand, the Shoe, the Deal Model, the
  Decision, the Play-out progress and the Running Count;
- transitions from `State` to `State` for each visitor action;
- math functions over `State`;
- a `render(state)` returning an **HTML string**.

Returning a string, rather than mutating the DOM, is what makes the seam
testable with the tools already installed: tests parse the output with JSDOM
exactly as `spec/invariants.test.ts` does, needing no vitest environment
configuration.

Outside the seam sits a thin shell that mounts the string, listens for hash
changes and delegates events. The shell holds no logic worth testing.

### State and layout are separate

No transition and no math function may read viewport dimensions, and `render`
must be a pure function of `State` alone. Layout is decided entirely in CSS.
This is what makes resizing mid-use free rather than a feature, and it is
asserted by a test so it cannot quietly regress.

### Focus

Replacing the rendered markup destroys focus, and the marking routine includes
tabbing through the page. After every re-render, focus must be restored to a
sensible element — the control just activated where it still exists, otherwise
the region that changed. Treat this as a requirement of the render cycle, not a
polish pass.

### Table rules

Six-deck Shoe, dealer stands on all 17s, Hit and Stand only. These are stated on
the page. `Decision` is modelled as a type that admits Double and Split so the
seam exists, but neither is implemented or offered.

### The math

- **Draw** probabilities are computed exactly by arithmetic over the Shoe
  composition. Under Independent Draw the composition is treated as unchanging;
  under Finite Shoe it depletes.
- **Play-out** distributions are produced by Monte Carlo simulation driven by a
  **seeded** pseudo-random generator. Seeding is the point: the results are
  deterministic, so a test can assert them, and the on-screen counter climbing
  toward the total is literally the simulation running rather than an animation
  over a precomputed figure.
- No probability appearing anywhere on the page is a hardcoded constant.
- For a hand of 16, the surviving Draws are exactly Ace, 2, 3, 4 and 5 — five of
  thirteen ranks — and the busting Draws are the remaining eight. The source
  brief at `brief-idea/blackjack/idea.md` states this incorrectly, marking the 5
  as a bust; a test exists specifically to stop that error reappearing.

### Honesty

Act 1's Play-out is dealt honestly and the copy responds to whichever result
occurs, including the winning one. Only the closing beat uses a Scripted Hand,
and it is labelled as chosen on screen. An unlabelled scripted result is
prohibited: the Explainer's subject is probability, and faking a draw would make
the artefact contradict its own argument.

## Testing Decisions

A good test here asserts what the Explainer does, not how it is built: it calls
a transition or a math function and checks the resulting `State` or rendered
output. It never reaches for internal helpers, never asserts on class names or
element structure that carries no meaning, and never asserts a probability the
implementation happens to produce rather than the one the domain requires.

Prior art is `spec/invariants.test.ts`: read HTML, parse with JSDOM, query the
document, assert. New tests follow the same shape, differing only in that the
HTML comes from `render(state)` rather than from disk.

Tests live in `spec/` alongside the invariants, where `pnpm check` already picks
up any `spec/*.test.ts`.

Four contracts:

1. **The core interaction** — applying a Decision to a `State` produces a
   `render` output that differs from the output before it. This is the brief's
   requirement that the visitor does something that changes what they see,
   written as an assertion.
2. **The Draw math** — for a hand of 16, the surviving rank set is exactly
   `{A, 2, 3, 4, 5}` and the busting set is the other eight. A pure function
   test, no DOM. This is the regression test for the error in the source brief.
3. **The Deal Models differ** — after a rank is dealt, that rank's Draw
   probability is strictly lower under Finite Shoe and exactly unchanged under
   Independent Draw. A pure function test, no DOM. This is the assertion that
   Act 2 has something to show.
4. **Resize safety** — `render` called twice on the same `State` under different
   reported viewport widths produces identical output, and no transition mutates
   `State` in response to a width. This makes the mid-resize promise mechanical.

`spec/starter.test.ts` describes the starter page and is designed to fail once
that page is replaced. Delete it as part of this work rather than making it
pass.

The shipped invariants must stay green throughout, which in practice means the
static shell keeps its navigation landmark, single top-level heading, language,
title and viewport meta.

## Out of Scope

- Double, Split, Surrender, Insurance and side bets. The `Decision` type leaves
  room for the first two; nothing implements them.
- True Count, decks-remaining estimation, and betting strategy. The Running
  Count alone carries Act 3's lesson; True Count requires explaining an
  estimation step that costs more scope than it returns.
- Penetration and the cut-card shuffle wiping the Running Count. A strong
  closing image and a genuine stretch goal — attempt only if everything above is
  done and deployed.
- Any second explainer hiding inside this one. Card counting is present as the
  final form of the thesis, not as a subject in its own right.
- Multiplayer, persistence, accounts, sound, and any server.
- Composition-dependent basic strategy deviations.
- Recreating a casino interface. The visual register is editorial, not gambling.

## Further Notes

The deployed page is the deliverable, marked live in Chrome at 1920×1080 and
390×844, with both counting in full. Build the phone layout first; widening is
the easy direction.

Deploy as soon as Act 1 works rather than when everything is done. A first
deployment attempted near the deadline is the most common way a finished
artefact scores nothing.

`pnpm check:evidence` fails at the time of writing — `PROCESS.md` sits under
`meta/` rather than at the repository root, and the reflection entry for this
deliverable does not exist. Evidence gates the deploy, so this blocks shipping
regardless of the state of the Explainer, and it should be fixed before any
feature work begins.

Two decisions here are recorded as ADRs because they are surprising without
their reasoning and expensive to revisit once the copy and tests are built on
them: dealing Act 1 honestly rather than scripting the loss, and using seeded
Monte Carlo rather than exact enumeration for Play-out distributions.

The vocabulary in this spec is defined in `CONTEXT.md`. Where the source brief
at `brief-idea/blackjack/idea.md` conflicts with it, `CONTEXT.md` wins — the
brief predates the design and blurs Draw against Play-out throughout.
