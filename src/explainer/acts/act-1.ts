/**
 * Act 1 — how blackjack works. Beats 1 through 3: decide, see every card that
 * could come next, then watch the Decision carried to settlement. Beat 4 (the
 * thousand Play-outs and the waffle) is a later ticket's placeholder.
 *
 * See `CONTEXT.md` for Draw vs Play-out, and
 * `docs/adr/0001-honest-deal-over-scripted-loss.md` for why beat 3's result
 * is dealt rather than scripted.
 */

import {
  bustSplit,
  dealerDistribution,
  drawOutcomes,
  freshShoe,
  handTotal,
  removeCards,
  simulateTrials,
  type PlayOut,
  type Rank,
  type Split,
} from "../../engine/index.ts";
import { formatCount, formatPercent } from "../format.ts";
import { actionButton, escapeHtml, section } from "../render.ts";
import { PLAYOUT_TRIALS, type State } from "../state.ts";
import { axisRow } from "../views/axis.ts";
import { faceDownCard, handHtml, rankCards } from "../views/card.ts";
import { countReadoutHtml, countRulePanelHtml } from "../views/count-readout.ts";
import { histogramHtml, histogramText } from "../views/histogram.ts";
import { tableHtml } from "../views/table.ts";
import { waffleSectionHtml } from "../views/waffle.ts";

const ACT_1_HEADING = "Act 1 — How blackjack works";

/**
 * Beat 1: the dealer's upcard face up beside a face-down card, the visitor's
 * two cards and both totals, and Hit / Stand as two identically weighted
 * buttons. Nothing else — no probability appears before the Decision.
 */
function renderBeat1(state: State): string {
  const dealerTotal = handTotal(state.dealer);
  const playerTotal = handTotal(state.hand);

  const table = tableHtml([
    {
      label: "Dealer",
      handHtml: handHtml([...rankCards(state.dealer), faceDownCard()]),
      total: dealerTotal.total,
    },
    {
      label: "You",
      handHtml: handHtml(
        rankCards(state.hand, { bustedLastCard: playerTotal.busted }),
      ),
      total: playerTotal.total,
      busted: playerTotal.busted,
    },
  ]);

  return section(
    "act-1",
    `<p class="eyebrow">Act 1</p>` +
      `<h2>You have sixteen</h2>` +
      `<p class="lede">The dealer is showing a ten. Before you read another ` +
      `word: hit, or stand?</p>` +
      table +
      // Identical classes on both, deliberately: the page must not nudge an
      // intuition it is about to test.
      `<div class="decision">` +
      actionButton("decide", "Hit", { arg: "hit" }) +
      actionButton("decide", "Stand", { arg: "stand" }) +
      `</div>`,
  );
}

/** Natural-language list with an Oxford "and" before the last item, and "Ace"
 *  spelled out — "Ace, 2, 3, 4 and 5" rather than "A, 2, 3, 4, 5". */
function listRanks(ranks: readonly Rank[]): string {
  const named = ranks.map((rank) => (rank === "A" ? "Ace" : rank));
  if (named.length <= 1) return named.join("");
  return `${named.slice(0, -1).join(", ")} and ${named[named.length - 1]}`;
}

/**
 * The draw strip's text equivalent (spec story 48): which specific ranks
 * survive and which bust, carrying the argument rather than only the
 * aggregate proportion already printed visibly below the chart.
 */
function drawStripText(split: Split): string {
  return (
    `Of the thirteen possible next cards, only ${listRanks(split.surviving)} ` +
    `keep this hand alive: ${split.surviving.length} of 13, ` +
    `${formatPercent(split.surviveChance)}. The rest bust it — ` +
    `${listRanks(split.busting)}: ${split.busting.length} of 13, ` +
    `${formatPercent(split.bustChance)}.`
  );
}

/**
 * Beat 2: every one of the thirteen possible next cards laid out on the
 * shared rank axis, the survive/bust split as both a proportion and a
 * computed percentage, and the one sentence the chart cannot say. The
 * percentages come from `bustSplit` against the state's own Shoe — which
 * already has the three visible cards removed — never a fresh Shoe, so they
 * read 38.8/61.2 rather than the fresh-shoe 38.5/61.5.
 */
function renderBeat2(state: State): string {
  const decision = state.decision ?? "hit";
  const outcomes = drawOutcomes(state.hand, state.shoe, state.model);
  const split = bustSplit(state.hand, state.shoe, state.model);

  const draws = axisRow(
    outcomes.map(
      (outcome) =>
        `<div class="draw${outcome.busts ? " draw--bust" : ""}">${escapeHtml(outcome.rank)}</div>`,
    ),
  );

  const surviveText =
    `${split.surviving.length} / 13 survive · ${formatPercent(split.surviveChance)}`;
  const bustText = `${split.busting.length} / 13 bust · ${formatPercent(split.bustChance)}`;

  return section(
    "act-1",
    `<p class="data">You chose &nbsp;<b>${escapeHtml(decision.toUpperCase())}</b></p>` +
      `<div class="spread">` +
      `<div>` +
      `<h3>Every card that could come next</h3>` +
      // The `.split` divider between the fifth and sixth cell is
      // `aria-hidden` (a purely visual/positional cue), and the individual
      // `.draw--bust` cells carry the survive/bust distinction only in
      // colour — so without this sentence a screen reader has no way to
      // tell which ranks bust at all (spec story 48).
      `<p class="vh">${escapeHtml(drawStripText(split))}</p>` +
      draws +
      `<div class="axis-key">` +
      `<span>${escapeHtml(surviveText)}</span>` +
      `<span class="bust">${escapeHtml(bustText)}</span>` +
      `</div>` +
      `</div>` +
      `<div>` +
      `<p class="lede">Both choices lose more often than they win. The ` +
      `better Decision is the one that loses less.` +
      `<button class="why" type="button" id="do-why-stand" popovertarget="why-stand" ` +
      `style="anchor-name: --a-stand" aria-label="Why standing does not help">` +
      `?</button></p>` +
      `<div id="why-stand" popover style="position-anchor: --a-stand">` +
      `<p class="pop-title">Why standing does not help</p>` +
      `<p>Standing does not avoid the loss, it hands the hand to a dealer ` +
      `showing a ten and asks them not to make one. They usually do.</p>` +
      `</div>` +
      `</div>` +
      `</div>` +
      actionButton("advance-beat", "Play my hand", { className: "btn btn--advance" }),
  );
}

/**
 * The copy that answers whatever the Play-out actually did — including the
 * winning branch, which ADR 0001 makes the harder, more important one to get
 * right. `hitDrew` distinguishes "You drew a 4" from "You stood on 16": Stand
 * never adds a card, so the copy must not imply one was drawn when it wasn't.
 */
function settlementCopy(play: PlayOut, hitDrew: boolean): string {
  if (play.playerBusted) {
    return (
      "You busted, and lost. You also made the better Decision — hitting " +
      "sixteen against a dealer's ten loses less often than standing does. " +
      "Both of those are true at the same time, and holding both is the " +
      "entire point of this page."
    );
  }

  const drawnRank = play.playerRanks[play.playerRanks.length - 1];
  const yourHand = hitDrew
    ? `You drew a ${drawnRank} and made ${play.playerTotal}`
    : `You stood on ${play.playerTotal}`;
  const dealerMade = play.dealerBusted
    ? `the dealer busted, making ${play.dealerTotal}`
    : `the dealer made ${play.dealerTotal}`;

  if (play.settlement === "won") {
    return (
      `${yourHand}, and ${dealerMade} — you won. That does not prove the ` +
      "Decision was good either: the same choice loses far more often than " +
      "this."
    );
  }

  if (play.settlement === "push") {
    return (
      `${yourHand}, and ${dealerMade} the same — the hand pushes, and ` +
      "nothing changes hands. A push proves the Decision no more right " +
      "than a loss would prove it wrong."
    );
  }

  // Lost without busting: the loss does not require going over twenty-one,
  // only a dealer hand that ends up higher.
  return (
    `${yourHand} without busting, and ${dealerMade} — enough to beat you. ` +
    "Not busting is not the same as winning; there is more than one way to " +
    "lose a hand that never went over twenty-one."
  );
}

/**
 * Beat 3: the visitor's hand, played to settlement from the real Shoe by the
 * beat 2 -> beat 3 transition (`dealBeat3` in `transitions.ts`) and stored on
 * `State` as `playOut`. This function only ever displays that result — it
 * never deals anything itself, because `render` must stay pure.
 */
function renderBeat3(state: State): string {
  const play = state.playOut;
  if (!play) return section("act-1", `<h2>${escapeHtml(ACT_1_HEADING)}</h2>`);

  const hitDrew = state.decision === "hit";
  const cards = rankCards(play.playerRanks, { bustedLastCard: play.playerBusted });
  const table = tableHtml([
    {
      label: "You",
      handHtml: handHtml(cards),
      total: play.playerTotal,
      busted: play.playerBusted,
    },
  ]);

  return section(
    "act-1",
    `<h3>Your hand</h3>` +
      table +
      `<p class="data">Dealt from the shoe. Not chosen.</p>` +
      // `role="status"` (story 49): the settlement is announced without the
      // visitor having to find and read it — the button below reuses beat
      // 2's `advance-beat` id, so focus restoration often lands there
      // instead of on this paragraph.
      `<p class="lede" role="status">${escapeHtml(settlementCopy(play, hitDrew))}</p>` +
      actionButton("advance-beat", "Show me 1,000 more hands", {
        className: "btn btn--advance",
      }),
  );
}

/**
 * Beat 4: the thousand, and the count arrives.
 *
 * `state.hand` and `state.dealer` never change through Act 1 — only
 * `state.shoe` gains the Play-out's actually-dealt cards, via `dealBeat3`
 * (`transitions.ts`) — so the shoe as it stood at the moment of decision is
 * always reconstructable as `openingShoe` below, and every figure this beat
 * shows is computed from it or from `state.playOut`, never a separately
 * stored snapshot. `openingShoe` is exactly the shoe beat 2's own survive/bust
 * split read from, so the odds pair restates the same 38.8% / 61.2% rather
 * than drifting once more cards have left the (now further depleted) shoe.
 *
 * `simulateTrials` is handed a fresh Shoe (never `state.shoe`) because it
 * removes the hand and dealer cards itself — passing the same fresh Shoe,
 * hand, dealer, model and default seed `dealBeat3` used means trial zero of
 * this run is bit-for-bit the same call, so the visitor's own Play-out is
 * genuinely inside the 1,000, not a lookalike stitched in beside them.
 *
 * `dealerDistribution` has the opposite contract from `simulateTrials`: it
 * removes the dealer's own cards from the Shoe it is handed, internally,
 * exactly once (`src/engine/simulate.ts`). So `openingShoe` — hand AND
 * dealer already removed, to match beat 2's own `bustSplit` reading — must
 * never be passed to it: that would remove the dealer's upcard twice, one
 * fewer ten (or whatever rank) in the simulated shoe than was actually on the
 * table. `dealerShoe` below removes only the visitor's hand, leaving the
 * dealer's own cards for `dealerDistribution` to remove itself.
 */
function renderBeat4(state: State): string {
  const play = state.playOut;
  if (!play) return section("act-1", `<h2>${escapeHtml(ACT_1_HEADING)}</h2>`);

  const decision = state.decision ?? "hit";
  // Finding 6: the Deal Model in force when `play` was dealt, not whatever
  // `state.model` reads now — a later visit to Act 2 can move that without
  // touching a Play-out that already happened. `playOutModel` is only ever
  // `null` before beat 3 has dealt anything, which cannot be true here since
  // `play` already exists; `?? state.model` is a defensive fallback, not the
  // intended path.
  const model = state.playOutModel ?? state.model;
  const openingShoe = removeCards(freshShoe(), [...state.hand, ...state.dealer]);
  const dealerShoe = removeCards(freshShoe(), state.hand);

  const dealerTotal = handTotal(play.dealerRanks);
  const dealerTable = tableHtml([
    {
      label: "Dealer",
      handHtml: handHtml(
        rankCards(play.dealerRanks, { bustedLastCard: play.dealerBusted }),
      ),
      total: dealerTotal.total,
      busted: play.dealerBusted,
    },
  ]);
  const upcard = state.dealer[0]!;
  // Finding 7: `playOut` returns just the upcard, with no second element, when
  // the player busted and the dealer never got to draw — falling back to
  // `upcard` there would print the hole card as being the same card already
  // shown face up in beat 1. Only render the reveal when a hole card exists.
  const holeCard = play.dealerRanks[1];

  const split = bustSplit(state.hand, openingShoe, model);
  const survivedLabel = decision === "hit" ? "Your hit survived" : "A hit would have survived";

  const dealerDist = dealerDistribution(
    state.dealer,
    dealerShoe,
    model,
    PLAYOUT_TRIALS,
  );

  const trials = simulateTrials(
    { hand: state.hand, dealer: state.dealer, shoe: freshShoe(), model },
    decision,
    PLAYOUT_TRIALS,
  );

  const holeCardNote = holeCard
    ? `<p class="note">The hole card was ${escapeHtml(holeCard)}. Beat one only ` +
      `ever showed you the ${escapeHtml(upcard)}, which is all you get to decide ` +
      `on at a real table.</p>`
    : "";

  return section(
    "act-1",
    `<h3>What the dealer had</h3>` +
      dealerTable +
      holeCardNote +
      `<dl class="odds">` +
      `<div><dt>${escapeHtml(survivedLabel)}</dt>` +
      `<dd>${escapeHtml(formatPercent(split.surviveChance))}</dd></div>` +
      `<div class="miss"><dt>It could have busted</dt>` +
      `<dd>${escapeHtml(formatPercent(split.bustChance))}</dd></div>` +
      `</dl>` +
      `<h3 style="margin-top: 2rem">What the dealer made · ` +
      `${escapeHtml(formatCount(PLAYOUT_TRIALS))} hands` +
      `<button class="why" type="button" id="do-why-dealer" popovertarget="why-dealer" ` +
      `style="anchor-name: --a-dealer" aria-label="What this chart means">?</button>` +
      `</h3>` +
      `<div id="why-dealer" popover style="position-anchor: --a-dealer">` +
      `<p class="pop-title">Reading this</p>` +
      `<p>The hand was already bad before you touched it. A dealer showing a ` +
      `ten reaches twenty about a third of the time, and busts only about one ` +
      `time in five — so waiting for them to fail is not a plan.</p>` +
      `</div>` +
      `<p class="vh">${escapeHtml(histogramText(dealerDist.totals, dealerDist.trials))}</p>` +
      histogramHtml(dealerDist.totals, dealerDist.trials) +
      `<h3 style="margin-top: 2rem">Every one of those ` +
      `${escapeHtml(formatCount(PLAYOUT_TRIALS))} hands</h3>` +
      waffleSectionHtml(trials, state.playoutProgress, decision) +
      countReadoutHtml(state.runningCount, state.shoe.remaining) +
      countRulePanelHtml() +
      actionButton("replay-other-decision", "Try the other decision", {
        className: "btn btn--advance",
      }),
  );
}

export function renderAct1(state: State): string {
  if (state.beat === 1) return renderBeat1(state);
  if (state.beat === 2) return renderBeat2(state);
  if (state.beat === 3) return renderBeat3(state);
  return renderBeat4(state);
}
