# Blackjack Probability Explainer

An interactive explainer that uses blackjack as a mechanic to teach how
probability behaves under changing information, and why a good decision is not a
promise of a good outcome.

Blackjack is the mechanism. Decision-making under uncertainty is the subject.

## Language

**Explainer**:
The single deployed page, read start to finish as one continuous argument.
_Avoid_: Game, app, site, simulator

**Act**:
One of the three stages the Explainer moves through. The layout stays largely
constant across Acts; what changes is how much is revealed.
_Avoid_: Page, screen, step, level, section

The three Acts have fixed jobs, and naming them loosely is what makes design
conversations go in circles. They are:

**Act 1 — How blackjack works**:
The introduction. The table, the hand, the Decision, and what a single Draw can
do to it. The visitor decides on intuition before seeing any probability, is
shown all thirteen Draws, has their hand dealt honestly to settlement, and then
sees the thousand Play-outs their one result came from. The Running Count is
present as a number from here on, but Act 1 never stops to teach it.
_Avoid_: Tutorial, demo, intro screen

**Act 2 — Two kinds of blackjack**:
Opens locked: the same hand, with the Deal Model as the only variable, so any
change is attributable to it and nothing else. Once the visitor has seen that,
free play unlocks from the same Shoe under whichever Deal Model they choose.
This is where the Shoe depletes, where composition and Draw odds move, and where
the Running Count becomes worth watching.
_Avoid_: Sandbox, playground, free mode

**Act 3 — The conclusion**:
One Scripted Hand, labelled as chosen. The discards are deep, the Running Count
is at its high-water mark, every legitimate signal is in the visitor's favour and
the Decision is correct. It loses anyway, and the Explainer closes on its thesis.
_Avoid_: Ending, finale, boss hand

**Deal Model**:
The rule that decides how the next card is produced. Exactly two exist: Finite
Shoe and Independent Draw. Switching it is the visitor's central experiment.
_Avoid_: Mode, deck mode, difficulty, setting

**Finite Shoe**:
A Deal Model in which a dealt card is removed and does not return, so what has
already appeared changes what can appear next.
_Avoid_: Real deck, without replacement, realistic mode

**Independent Draw**:
A Deal Model in which every card is drawn from the same unchanging distribution,
so previous cards carry no information.
_Avoid_: Random mode, infinite deck, fake deck

**Shoe**:
The finite collection of cards a Finite Shoe deals from. Has a size, a remaining
count, and a composition.
_Avoid_: Deck, pack (a deck is 52 cards; a Shoe is several decks)

## Units of simulation

The Explainer simulates two different things and must never blur them. Every
chart is a chart of one or the other.

**Draw**:
A single next card, considered on its own. The Act 1 strip shows all thirteen
possible Draws against the visitor's hand.
_Avoid_: Hit, card, next card, deal

**Play-out**:
One hand carried from the visitor's Decision through the dealer's turn to
settlement. Answers what the Decision paid, not what the next card was.
_Avoid_: Game, round, simulation, run, hand

**Decision**:
The visitor's choice at the table. Currently Hit or Stand; the seam admits
Double and Split, which the Explainer does not offer.
_Avoid_: Move, action, play, choice

**Scripted Hand**:
A Play-out the Explainer chooses rather than deals, used once at the close to
demonstrate the thesis. Always labelled as chosen; an unlabelled Scripted Hand
would make the Explainer lie about its own subject.
_Avoid_: Rigged hand, fixed hand, demo, cutscene

**Running Count**:
The Hi-Lo tally of cards that have left the Shoe: low cards raise it, tens and
aces lower it. Describes what remains in the Shoe, never what comes next.
_Avoid_: Count, card counting, edge, advantage

A high Running Count means the Shoe is rich in tens and aces, which favours the
player **across many hands**. It never means the next card is good. Any copy
that implies otherwise teaches the gambler's fallacy in a new costume, which is
the thing this Explainer exists to argue against.

**High-water mark**:
The highest the Running Count has been this session. Act 3 is offered here rather
than at a fixed threshold: Hi-Lo is a balanced count that returns toward zero as
the Shoe empties, so a fixed target is not reliably reachable — measured over 300
Shoes, +6 arrives in only 74% of them and takes around fourteen hands when it
does. The high-water mark always exists.
_Avoid_: Threshold, target count, trigger
