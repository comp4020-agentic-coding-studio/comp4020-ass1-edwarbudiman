# Assignment 1 reflection

**The breakthrough.** I expected the hard part of this assignment to be the
interaction design — the waffle chart, the resize behaviour, the seeded
Monte Carlo. It wasn't. The breakthrough was finding out, before writing a
line of code, that my own draft brief contained a wrong number (a hand of 16
does not bust on a 5) and a self-contradicting idea (scripting a loss to
prove that outcomes don't validate decisions, in an explainer whose entire
point is that outcomes don't validate decisions). Both survived several
readings by me. They only surfaced when I made the agent grill the draft
against the published brief and the glossary terms, sentence by sentence,
instead of accepting my summary of what I'd already decided to build. The
same pattern repeated later at a different layer: an ADR recorded a real
rule ("no viewport branching in TypeScript") as a broader one than it
actually was, and a hand-drawn mock's settlement numbers and closing count
didn't survive contact with the engine that computed them for real. The
lesson generalises past this project: a draft, a design doc, and a styleframe
are all claims, and none of them are validated until something — a second
reading, a test, a running engine — is allowed to disagree with them.

**What this changed about the developer I want to be.** I used to treat
"process" as overhead that happens after the real work — write the code,
then write up what I did. Watching `pnpm check:evidence` block a deploy
because `PROCESS.md` and `CLAUDE.md` had been moved out of the root changed
that: the harness isn't a report on the work, it's part of the work, and a
broken sensor is exactly as blocking as a broken build. I want to keep
writing the rule down the first time it's needed rather than re-explaining it
to the next session, and keep treating "the agent got this wrong" as a
prompt to fix the harness, not just the output.
