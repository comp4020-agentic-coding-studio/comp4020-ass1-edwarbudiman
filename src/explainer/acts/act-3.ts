/**
 * Act 3 — The conclusion.
 *
 * No play happens here (ticket 12). The visitor arrives by choosing the nav
 * link, or because the shell (`main.ts`) offered it the moment the Running
 * Count set a new session high — never at a fixed threshold. See
 * `design.md`'s Flow and `spec.md` stories 61/62: measured over 300 Shoes, +6
 * arrives before 75% penetration in only 74% of them, so a magic number is
 * not reliably reachable. The high-water mark always exists.
 *
 * Everything under "What you built" is read straight off `State` — the
 * Running Count's high-water mark, the Shoe, the discard tray — because it is
 * information the visitor actually earned this session, not a figure typed
 * for the occasion.
 *
 * The Scripted Hand (CONTEXT.md's "Scripted Hand"; ADR
 * 0001-honest-deal-over-scripted-loss) is the one Play-out this Explainer
 * chooses rather than deals, used exactly once, at the close. It is stamped
 * "Chosen, not dealt" on screen, always — an unlabelled Scripted Hand would
 * make the Explainer lie about its own subject. Its ranks are fixed constants
 * below, but its totals and settlement are never hardcoded: they are computed
 * by `handTotal` and `settle`, the same engine functions every dealt hand on
 * this page goes through, so a hand that is allowed to be chosen is still not
 * allowed to be wrong.
 *
 * Copy discipline (spec story 62, load-bearing): the setup says every
 * legitimate signal favours the visitor and the Decision is correct. It never
 * says the visitor is about to win, and never implies the next card is good —
 * a high Running Count describes the Shoe left behind, across many hands to
 * come, and says nothing about the next one (CONTEXT.md's "Running Count").
 * Read every sentence below back against that before changing it.
 */

import {
  handTotal,
  settle,
  type Rank,
  type Settlement,
} from "../../engine/index.ts";
import { formatCount, formatSignedCount } from "../format.ts";
import { escapeHtml, section } from "../render.ts";
import type { State } from "../state.ts";
import { handHtml, rankCards } from "../views/card.ts";
import { discardTrayHtml } from "../views/discard-tray.ts";
import { tableHtml } from "../views/table.ts";

const ACT_3_HEADING = "Every legitimate signal favours you";

const SETUP_COPY =
  "Every legitimate signal here favours you, and the Decision below is " +
  "correct by any measure. None of it is a promise about what comes next.";

const THESIS = "A good decision is not a promise of a good outcome.";

/**
 * The Scripted Hand's fixed ranks (`.scratch/blackjack-explainer/figures.json`
 * -> "scripted"): the visitor holds two tens, the dealer turns a 6 into 21.
 * Standing on 20 is not a close call, which is the point — there is nothing
 * to blame. Neither hand draws again from here, so nothing downstream needs
 * a Shoe or an `Rng`; `handTotal` and `settle` are pure functions of these
 * ranks alone.
 */
const SCRIPTED_YOUR_HAND: readonly Rank[] = ["10", "10"];
const SCRIPTED_DEALER_HAND: readonly Rank[] = ["6", "5", "10"];

/** "lost" reads naturally already; "push" needs the past tense to match. */
function settlementVerb(settlement: Settlement): string {
  if (settlement === "won") return "won";
  if (settlement === "push") return "pushed";
  return "lost";
}

/**
 * "What you built": the Running Count's high-water mark, cards remaining and
 * the discard tray, all read straight from `state` — the same
 * `discardTrayHtml` Act 2 uses, since the tray depends only on `state.shoe`
 * and Act 3 earns no different one.
 */
function whatYouBuiltHtml(state: State): string {
  const remainingPercent = (state.shoe.remaining / state.shoe.size) * 100;
  const copy =
    `The Running Count is at ${formatSignedCount(state.runningCountHighWaterMark)}, ` +
    "the highest it has been all session, so the Shoe still holds more than " +
    "its share of tens and aces. This is the best legitimate information a " +
    "player can have, and it describes the hands still to come, never the " +
    "very next card.";

  return (
    `<h3>What you built</h3>` +
    `<div class="meter-head"><span>Running count · session high</span>` +
    `<b id="act3-count-value">${escapeHtml(formatSignedCount(state.runningCountHighWaterMark))}</b></div>` +
    `<div class="meter-head"><span>Cards remaining</span>` +
    `<b>${escapeHtml(formatCount(state.shoe.remaining))}</b></div>` +
    `<div class="shoe">` +
    `<span class="remaining" style="flex: 0 0 ${remainingPercent}%"></span>` +
    `<span class="spent"></span>` +
    `</div>` +
    discardTrayHtml(state.shoe) +
    `<p class="lede">${escapeHtml(copy)}</p>`
  );
}

/**
 * The Scripted Hand itself: the "Chosen, not dealt" stamp always renders
 * ahead of everything else in this column, in markup a screen reader meets
 * before the cards. Totals and settlement come from `handTotal`/`settle`, not
 * from the constants above — those give only the ranks.
 */
function scriptedHandHtml(): string {
  const yours = handTotal(SCRIPTED_YOUR_HAND);
  const dealer = handTotal(SCRIPTED_DEALER_HAND);
  const settlement = settle(yours.total, yours.busted, dealer.total, dealer.busted);

  const table = tableHtml([
    {
      label: "Dealer",
      handHtml: handHtml(rankCards(SCRIPTED_DEALER_HAND, { bustedLastCard: dealer.busted })),
      total: dealer.total,
      busted: dealer.busted,
    },
    {
      label: "You",
      handHtml: handHtml(rankCards(SCRIPTED_YOUR_HAND, { bustedLastCard: yours.busted })),
      total: yours.total,
      busted: yours.busted,
    },
  ]);

  const copy =
    `Standing on ${yours.total} is not a close call — it is the correct ` +
    "decision by any measure, taken with the best information available. " +
    `The dealer turned a ${SCRIPTED_DEALER_HAND[0]} into ${dealer.total}. ` +
    `You ${settlementVerb(settlement)}.`;

  return (
    `<span class="stamp">Chosen, not dealt</span>` +
    `<h3>You stand on ${yours.total}</h3>` +
    table +
    `<p class="lede">${escapeHtml(copy)}</p>`
  );
}

/**
 * The close: what the Scripted Hand did and did not take from the visitor,
 * then the thesis alone. Never behind a click (design.md's Components ->
 * "Copy"), and the nav already lets the visitor return to any Act (story 39)
 * — nothing here traps them.
 */
function closeHtml(): string {
  const yours = handTotal(SCRIPTED_YOUR_HAND);
  const dealer = handTotal(SCRIPTED_DEALER_HAND);
  const copy =
    "That hand was chosen rather than dealt, and it says so on screen, " +
    "because this Explainer's subject is honesty about probability. " +
    "Nothing here was taken from you: the count was real, the Shoe was " +
    `rich, and standing on ${yours.total} was right. The dealer made ` +
    `${dealer.total} anyway.`;

  return (
    `<div class="close">` +
    `<p>${escapeHtml(copy)}</p>` +
    `<p class="thesis">${escapeHtml(THESIS)}</p>` +
    `</div>`
  );
}

export function renderAct3(state: State): string {
  return section(
    "act-3",
    `<p class="eyebrow">Act 3</p>` +
      `<h2>${escapeHtml(ACT_3_HEADING)}</h2>` +
      `<p class="lede">${escapeHtml(SETUP_COPY)}</p>` +
      `<div class="spread">` +
      `<div>${whatYouBuiltHtml(state)}</div>` +
      `<div>${scriptedHandHtml()}</div>` +
      `</div>` +
      closeHtml(),
  );
}
