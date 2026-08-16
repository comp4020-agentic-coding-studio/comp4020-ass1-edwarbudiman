/**
 * Act 1 — how blackjack works. Beats 1 through 3: decide, see every card that
 * could come next, then watch the Decision carried to settlement. Beat 4 (the
 * thousand Play-outs and the waffle) is a later ticket's placeholder.
 *
 * See `CONTEXT.md` for Draw vs Play-out, and
 * `docs/adr/0001-honest-deal-over-scripted-loss.md` for why beat 3's result
 * is dealt rather than scripted.
 */

import { bustSplit, drawOutcomes, handTotal, type PlayOut } from "../../engine/index.ts";
import { formatPercent } from "../format.ts";
import { actionButton, escapeHtml, section } from "../render.ts";
import type { State } from "../state.ts";
import { axisRow } from "../views/axis.ts";
import { faceDownCard, handHtml, rankCards } from "../views/card.ts";
import { tableHtml } from "../views/table.ts";

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
      draws +
      `<div class="axis-key">` +
      `<span>${escapeHtml(surviveText)}</span>` +
      `<span class="bust">${escapeHtml(bustText)}</span>` +
      `</div>` +
      `</div>` +
      `<div>` +
      `<p class="lede">Both choices lose more often than they win. The ` +
      `better Decision is the one that loses less.` +
      `<button class="why" type="button" popovertarget="why-stand" ` +
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
      `<p class="lede">${escapeHtml(settlementCopy(play, hitDrew))}</p>` +
      actionButton("advance-beat", "Show me 1,000 more hands", {
        className: "btn btn--advance",
      }),
  );
}

export function renderAct1(state: State): string {
  if (state.beat === 1) return renderBeat1(state);
  if (state.beat === 2) return renderBeat2(state);
  if (state.beat === 3) return renderBeat3(state);
  return section("act-1", `<h2>${escapeHtml(ACT_1_HEADING)}</h2>`);
}
