# 12 — Act 3, the conclusion

Status: done
Blocked by: 11

## Why

The thesis delivered at its strongest point: maximum legitimate information, a
correct decision, and a loss anyway.

## What to do

No play happens in Act 3. The visitor arrives when they choose to, or when the
page offers it at the Running Count's **high-water mark**.

Do not use a fixed threshold. Hi-Lo is a balanced count: it returns toward zero
as the Shoe empties. Measured over 300 shoes, +6 arrives before 75% penetration
in only 74% of them and takes about fourteen hands when it does. The high-water
mark always exists, and "the highest it has been all session" is a truer line.

**What you built** — the count at its session high, cards remaining, the deep
discard tray. This is information the visitor earned.

**The Scripted Hand** — stamped *Chosen, not dealt*, on screen, always. The
visitor holds 20; the dealer turns a 6 into 21. Standing on 20 is not a close
call, which is the point: there is nothing to blame.

Copy discipline, and this one is load-bearing: the setup says **every legitimate
signal favours you and the decision is correct**. It must never say the visitor
is about to win. A high count favours the player across many hands and says
nothing about the next card — claiming otherwise would teach the gambler's
fallacy in the middle of an argument against it.

Totals and settlement still go through `src/engine/`. A Scripted Hand is allowed
to be chosen; it is not allowed to be wrong.

Close on the thesis, short and unhedged, and let the visitor return to any Act.

## References

Spec stories 33–39, 61, 62. ADR 0001. `CONTEXT.md` → Running Count, high-water
mark.
