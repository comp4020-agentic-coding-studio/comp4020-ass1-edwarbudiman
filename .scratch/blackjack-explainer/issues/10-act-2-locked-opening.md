# 10 — Act 2's locked opening

Status: done
Blocked by: 07

## Why

This is the only moment in the Explainer where exactly one variable moves. It is
what makes the Deal Model difference attributable rather than atmospheric.

## What to do

Act 2 opens **locked**: the same hand the visitor just played, with the Deal
Model as the only thing they can change. Two controls, each named in plain
language with a one-line description:

- **Finite shoe** — dealt cards are gone; what has appeared changes what can
  appear next
- **Independent draw** — every card from the same unchanging distribution; the
  past carries nothing

Switching re-computes the composition chart. Under Finite Shoe the bars move as
cards leave; under Independent Draw they return to a full rank and stay there,
whatever has been dealt.

Then an *Unlock free play* button.

Note the revision to spec story 21: the hand is held constant for **this
opening**, not for the whole Act.

## Done when

Toggling the model with nothing else changing produces a visible, attributable
difference, and a test asserts a dealt rank's Draw probability is strictly lower
under Finite Shoe and exactly unchanged under Independent Draw.

## References

Spec stories 21 (revised), 22–28.
