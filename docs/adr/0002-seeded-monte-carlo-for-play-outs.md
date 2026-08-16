# Seeded Monte Carlo for Play-out distributions, exact arithmetic for Draws

Draw probabilities are computed exactly from the Shoe composition, because that
is trivial arithmetic. Play-out distributions — which require resolving the
dealer's turn against a depleting Shoe — are produced by Monte Carlo simulation
driven by a seeded pseudo-random generator instead of exact recursive
enumeration.

## Considered Options

Exact enumeration over the dealer's draws was the obvious choice and was
rejected on cost: it is fiddly under a depleting Shoe and the requirement was
never exactness, it was testability. A seeded generator is deterministic, so a
test can assert the resulting distribution just as firmly.

## Consequences

The on-screen counter climbing toward the total is the simulation actually
running, rather than an animation over a precomputed number — which is both
honest and cheaper than faking it. The seed becomes part of the tested contract:
changing it changes asserted values, so it must be treated as fixed rather than
as a tuning knob.
