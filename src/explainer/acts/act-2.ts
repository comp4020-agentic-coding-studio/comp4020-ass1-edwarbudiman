/**
 * Act 2 — Two kinds of blackjack.
 *
 * Opens LOCKED: the same hand the visitor just played (`state.hand`), with
 * the Deal Model as the only thing that moves. Story 21 (revised) — the hand
 * is held constant for this opening only, not for the whole Act. Free play
 * unlocks once the visitor clicks through (`renderFreePlay`): hands keep
 * dealing from the same Shoe under whichever Deal Model is selected, and the
 * Shoe, discards and Running Count all keep accumulating rather than
 * resetting (story 29).
 *
 * See CONTEXT.md ("Deal Model", "Finite Shoe", "Independent Draw", "Shoe",
 * "Running Count", "High-water mark") and
 * `.scratch/blackjack-explainer/design.md`'s Flow and Components.
 */

import {
  bustSplit,
  discarded,
  drawProbability,
  drawWeights,
  fullRank,
  handTotal,
  hiLoValue,
  RANKS,
  type DealModel,
  type PlayOut,
  type Rank,
  type Shoe,
  type Split,
} from "../../engine/index.ts";
import { formatCount, formatPercent, formatSignedCount } from "../format.ts";
import { actionButton, escapeHtml, section } from "../render.ts";
import type { State } from "../state.ts";
import { axisRow } from "../views/axis.ts";
import { faceDownCard, handHtml, rankCards } from "../views/card.ts";
import { countRulePanelHtml } from "../views/count-readout.ts";
import { discardTrayHtml } from "../views/discard-tray.ts";
import { tableHtml } from "../views/table.ts";

const ACT_2_HEADING = "Two kinds of blackjack";

const RANK_NAMES: Partial<Record<Rank, string>> = {
  A: "Ace",
  J: "Jack",
  Q: "Queen",
  K: "King",
};

/** "Ace", "Jack" ... or "The 6s" for the numeral ranks. */
function slotHeading(rank: Rank): string {
  const named = RANK_NAMES[rank];
  return named ?? `The ${rank}s`;
}

/**
 * The rank with the fewest cards left — equivalently, the most cards of it
 * already dealt. Ties resolve to the earlier rank in Ace-first order. Because
 * Act 1's opening deal alone removes two 10s and a 6 (never a uniform three
 * cards across thirteen ranks), this rank always has strictly fewer left than
 * a full rank — it is guaranteed to be a rank "a card of which has been
 * dealt" per story 27.
 */
function mostDepletedRank(shoe: Shoe): Rank {
  return RANKS.reduce((thinnest, rank) =>
    shoe.composition[rank] < shoe.composition[thinnest] ? rank : thinnest,
  );
}

/**
 * One `<button class="model">`. Hand-written rather than `actionButton()`
 * because the `.mark` + `.name`/`<small>` structure is richer than that
 * helper offers — but the id keeps `actionButton`'s exact shape
 * (`do-set-model-<arg>`) so the shell's focus-restore-by-id still finds this
 * control across the re-render a toggle causes.
 */
function modelButton(
  model: DealModel,
  current: DealModel,
  name: string,
  description: string,
): string {
  const pressed = model === current;
  return (
    `<button class="model" type="button" id="do-set-model-${escapeHtml(model)}" ` +
    `data-action="set-model" data-arg="${escapeHtml(model)}" ` +
    `aria-pressed="${pressed}">` +
    `<span class="mark" aria-hidden="true">${pressed ? "●" : "○"}</span>` +
    `<span class="name">${escapeHtml(name)}<small>${escapeHtml(description)}</small></span>` +
    `</button>`
  );
}

/**
 * The bars and full-rank reference line shared by both the locked opening's
 * static chart and free play's clickable one: counts, not probability, on
 * the shared thirteen-rank axis. `drawWeights` is what makes switching the
 * Deal Model recompute this — under Independent Draw it hands back a fresh
 * composition regardless of what has actually left the Shoe, so the bars
 * snap to a full rank and stay there (docs/adr/0003: "Act 2 charts cards
 * remaining per rank, not probability").
 */
function compositionBars(state: State): string {
  const weights = drawWeights(state.shoe, state.model);
  const full = fullRank(state.shoe);
  const counts = RANKS.map((rank) => weights[rank]);
  const min = Math.min(...counts);
  const varied = min < full;

  const bars = axisRow(
    RANKS.map((rank) => {
      const height = (weights[rank] / full) * 100;
      const low = varied && weights[rank] === min;
      return `<span class="bar${low ? " bar--low" : ""}" style="height: ${height}%"></span>`;
    }),
    { className: "axis-bars" },
  );

  // Bars carry no text of their own — visual only, same as the dealer
  // histogram (`views/histogram.ts`). `compositionText` below is the text
  // equivalent a screen reader gets instead.
  return `<div aria-hidden="true"><p class="axis-full-label">${full} — a full rank</p>${bars}</div>`;
}

/**
 * The composition chart's text equivalent (spec story 48): the argument the
 * bars draw — which single rank, if any, has fallen short of a full rank —
 * not a list of thirteen counts. Under Independent Draw every rank always
 * reads full regardless of what has actually been dealt (`drawWeights`), so
 * the two branches below are the same "nothing/something moved" distinction
 * `compositionBars`'s own `varied` flag makes for sighted visitors.
 */
function compositionText(state: State): string {
  const weights = drawWeights(state.shoe, state.model);
  const full = fullRank(state.shoe);
  const rank = mostDepletedRank(state.shoe);
  const left = weights[rank];

  if (left >= full) {
    return (
      `Every rank still shows a full ${full} cards. Independent Draw treats ` +
      "every next card as coming from the same unchanging distribution, so " +
      "nothing dealt so far shows up as a shorter bar."
    );
  }

  return (
    `${slotHeading(rank)} has fallen to ${left} of a full ${full} — the only ` +
    "rank shorter than the rest, because cards of that rank have already " +
    "been dealt. Every other rank still shows its full count."
  );
}

/**
 * The locked opening's composition chart: `compositionBars` plus a plain
 * rank label row. The thinnest rank is marked in the bar's weight, not with
 * `aria-pressed`: that attribute belongs to toggle buttons, and on a label
 * with nothing to toggle it would announce a pressed state that does not
 * exist. The slot below names the rank in words instead, which is the text
 * equivalent that actually carries.
 */
function compositionChart(state: State): string {
  const labels = axisRow(
    RANKS.map((rank) => `<div class="draw">${escapeHtml(rank)}</div>`),
  );
  return (
    `<p class="vh">${escapeHtml(compositionText(state))}</p>` +
    compositionBars(state) +
    labels
  );
}

/**
 * Free play's composition chart: the same bars, but every rank label is now
 * a real `<button>` selecting that rank for the Detail slot below — here
 * `aria-pressed` is honest, because the label really is a toggle.
 *
 * The `id` here is not decorative: it follows `actionButton()`'s exact
 * `do-<action>-<arg>` shape so the shell's focus-restore-by-id finds the same
 * rank button again after selecting it re-renders the page — without it,
 * every rank pick would silently fall back to refocusing the whole section.
 */
function compositionChartInteractive(state: State, selected: Rank): string {
  const labels = axisRow(
    RANKS.map(
      (rank) =>
        `<button class="draw" type="button" id="do-select-rank-${escapeHtml(rank)}" ` +
        `data-action="select-rank" data-arg="${escapeHtml(rank)}" ` +
        `aria-pressed="${rank === selected}">` +
        `${escapeHtml(rank)}</button>`,
    ),
  );
  return (
    `<p class="vh">${escapeHtml(compositionText(state))}</p>` +
    compositionBars(state) +
    labels
  );
}

/**
 * Story 27: a before-and-after Draw probability for one specific rank, once
 * a card of that rank has been dealt. "Before" is what every rank's Draw
 * probability always was against a fresh Shoe — which is also exactly what
 * Independent Draw treats it as forever, whatever has been dealt. "After" is
 * the current Draw probability under whichever Deal Model is selected: under
 * Finite Shoe it reads strictly lower than before; under Independent Draw it
 * reads identical to before.
 */
function featuredRankSlot(state: State): string {
  const rank = mostDepletedRank(state.shoe);
  const full = fullRank(state.shoe);
  const before = full / state.shoe.size;
  const after = drawProbability(state.shoe, rank, state.model);
  const gone = discarded(state.shoe, rank);

  return (
    `<div class="slot">` +
    `<p class="slot-rank">${escapeHtml(slotHeading(rank))}</p>` +
    `<dl>` +
    `<dt>Chance before any ${escapeHtml(rank)} was dealt</dt>` +
    `<dd>${formatPercent(before)}</dd>` +
    `<dt>Chance now</dt>` +
    `<dd>${formatPercent(after)}</dd>` +
    `<dt>Left in shoe</dt>` +
    `<dd>${state.shoe.composition[rank]} of ${full}</dd>` +
    `</dl>` +
    `</div>` +
    `<p class="lede">${gone} card${gone === 1 ? "" : "s"} of rank ${escapeHtml(rank)} ` +
    `${gone === 1 ? "has" : "have"} already left the shoe. Under Finite Shoe that moved this rank's ` +
    `Draw probability down to match. Under Independent Draw the same cards sit in the same discard ` +
    `pile and the probability has not moved at all — only one of these two worlds makes remembering ` +
    `worth anything, and that is the reason Act 3 exists.</p>`
  );
}

function renderLockedOpening(state: State): string {
  const total = handTotal(state.hand);
  const table = tableHtml([
    {
      label: "You",
      handHtml: handHtml(rankCards(state.hand, { bustedLastCard: total.busted })),
      total: total.total,
      busted: total.busted,
    },
  ]);

  const remainingPercent = (state.shoe.remaining / state.shoe.size) * 100;

  return section(
    "act-2",
    `<p class="eyebrow">Act 2</p>` +
      `<h2>${escapeHtml(ACT_2_HEADING)}</h2>` +
      `<div class="locked">` +
      `<p class="locked-flag">Locked · the same hand you just played</p>` +
      table +
      `<p class="note">Nothing here moves except the Deal Model. Switch it below ` +
      `and watch what the shoe is willing to say about the next card.</p>` +
      `</div>` +
      `<div class="spread">` +
      `<div>` +
      `<div class="models">` +
      modelButton(
        "finite-shoe",
        state.model,
        "Finite shoe",
        "Dealt cards are gone. What has appeared changes what can appear next.",
      ) +
      modelButton(
        "independent-draw",
        state.model,
        "Independent draw",
        "Every card from the same unchanging distribution. The past carries nothing.",
      ) +
      `</div>` +
      `<div class="meter-head"><span>Cards remaining</span><b>${formatCount(state.shoe.remaining)}</b></div>` +
      `<div class="shoe">` +
      `<span class="remaining" style="flex: 0 0 ${remainingPercent}%"></span>` +
      `<span class="spent"></span>` +
      `</div>` +
      `</div>` +
      `<div>` +
      `<h3>How many of each rank are left</h3>` +
      compositionChart(state) +
      featuredRankSlot(state) +
      `</div>` +
      `</div>` +
      actionButton("unlock-free-play", "Unlock free play", { className: "btn btn--advance" }),
  );
}

/**
 * Free play's Detail slot: pinned under the axis rather than a popover,
 * because these numbers get compared across all thirteen ranks in a row
 * (design.md's rationale for keeping it a slot). Shows cards left, the exact
 * chance next, what the chance was against a fresh Shoe, and an expectation
 * derived from that same exact arithmetic — "about N in every 1,000 draws".
 * That row is worded as a forward-looking expectation, never as a tally: no
 * 1,000 draws have actually happened, only one Shoe's arithmetic has been
 * scaled up to be legible, and any wording implying otherwise would read as
 * a record of an event that never occurred.
 */
function detailSlotHtml(state: State, rank: Rank): string {
  const full = fullRank(state.shoe);
  const before = full / state.shoe.size;
  const after = drawProbability(state.shoe, rank, state.model);
  const left = state.shoe.composition[rank];
  const expectation = Math.round(after * 1000);

  return (
    `<div class="slot">` +
    `<p class="slot-rank">${escapeHtml(slotHeading(rank))}</p>` +
    `<dl>` +
    `<dt>Left in shoe</dt>` +
    `<dd>${left} of ${full}</dd>` +
    `<dt>Chance next</dt>` +
    `<dd>${formatPercent(after)}</dd>` +
    `<dt>Was</dt>` +
    `<dd>${formatPercent(before)} — ${full} of ${state.shoe.size}</dd>` +
    `<dt class="expectation">Expect</dt>` +
    `<dd class="expectation">about ${formatCount(expectation)} in every 1,000 draws</dd>` +
    `</dl>` +
    `</div>`
  );
}

/**
 * The odds pair (design.md -> Components -> "Odds pair"), used here as the
 * LIVE next-Draw survive/bust chance for the hand actually being held —
 * story 60 — so the composition chart reads as being about this hand, not
 * an abstract Shoe. Copy differs from Act 1 beat 4's reuse of the same
 * `.odds` markup ("your hit survived") because there is no hit to look back
 * on here — only ever a hand still in front of the visitor.
 */
function oddsPairHtml(split: Split): string {
  return (
    `<dl class="odds">` +
    `<div><dt>Next card survives</dt>` +
    `<dd>${formatPercent(split.surviveChance)}</dd></div>` +
    `<div class="miss"><dt>Next card busts</dt>` +
    `<dd>${formatPercent(split.bustChance)}</dd></div>` +
    `</dl>`
  );
}

/**
 * The persistent readout beside the odds pair (design.md's "Count readout").
 * Deliberately NOT `views/count-readout.ts`'s `countReadoutHtml` — that
 * helper's "New · from here on" flag is Act 1 beat 4's one-time
 * introduction, and by Act 2 the readout has already been on screen for a
 * while (design.md: "introduced at the end of Act 1 ... stays on screen from
 * there"). `countRulePanelHtml`'s `?` panel IS reused as-is, at the same
 * `id="how-count"` every other beat targets, since `render(state)` only ever
 * mounts one Act's markup at a time and the ids never collide in the DOM.
 */
function countReadoutHtml(state: State): string {
  return (
    `<p class="readout">` +
    `<span>Running count</span>` +
    `<b>${escapeHtml(formatSignedCount(state.runningCount))}</b>` +
    `<button class="why" type="button" id="do-how-count" popovertarget="how-count" ` +
    `aria-label="How the running count works">?</button>` +
    `<span class="spacer"></span>` +
    `<span>Shoe <b>${escapeHtml(formatCount(state.shoe.remaining))}</b></span>` +
    `</p>`
  );
}

/**
 * Story 32: the Hi-Lo value of the card that just left, shown beside the
 * readout rather than only inside the `?` panel — so the rule is learned by
 * watching it get applied to a real card, not only read as an abstract
 * table.
 */
function lastCardHiLoHtml(state: State): string {
  const last = state.discards[state.discards.length - 1];
  if (!last) return "";
  const value = hiLoValue(last);
  return (
    `<p class="data">Last card out: <b>${escapeHtml(last)}</b> · Hi-Lo ` +
    `${escapeHtml(formatSignedCount(value))}</p>`
  );
}

/**
 * Stories 33/34 — load-bearing, and never behind a click. A rising Running
 * Count describes the Shoe that is left, not the next card: it says tens and
 * aces are now over-represented in what remains, which favours the visitor
 * across many hands, and it is explicitly NOT a prediction of what comes up
 * next. Copy that blurred that line would teach the gambler's fallacy in the
 * middle of the one page arguing against it (CONTEXT.md's "Running Count").
 */
const RUNNING_COUNT_WARNING =
  "A rising running count means the shoe left behind is richer in tens and " +
  "aces than a fresh one — good for you across many hands to come. It does " +
  "not say anything about the very next card. Treating it as a prediction " +
  "is the mistake this page exists to argue against.";

/**
 * The copy for a settled free-play hand. `hitDrew` distinguishes "you drew a
 * card" from "you stood", the same distinction Act 1 beat 3's
 * `settlementCopy` makes for the same reason: Stand never adds a card, and
 * the copy must not imply one was drawn when it wasn't.
 */
function freePlaySettlementCopy(result: PlayOut, hitDrew: boolean): string {
  if (result.playerBusted) {
    const drawnRank = result.playerRanks[result.playerRanks.length - 1];
    return `You drew a ${drawnRank} and busted with ${result.playerTotal}. The hand is lost.`;
  }

  const yourHand = hitDrew
    ? `You drew a ${result.playerRanks[result.playerRanks.length - 1]} and made ${result.playerTotal}`
    : `You stood on ${result.playerTotal}`;
  const dealerMade = result.dealerBusted
    ? `the dealer busted, making ${result.dealerTotal}`
    : `the dealer made ${result.dealerTotal}`;

  if (result.settlement === "won") return `${yourHand}, and ${dealerMade} — you won.`;
  if (result.settlement === "push") {
    return `${yourHand}, and ${dealerMade} the same — the hand pushes.`;
  }
  return `${yourHand}, and ${dealerMade} — enough to beat you.`;
}

/**
 * The current free-play hand: either a hand still awaiting a Decision (Hit
 * or Stand, exactly as Act 1 offers them — one Decision per hand, the seam
 * this whole Explainer holds to), or the just-settled result with a "Next
 * hand" button. `dealFreePlayHand` (in `transitions.ts`) guarantees a hand
 * exists here the moment free play unlocks, but a `null` `freePlayHand` is
 * still handled rather than assumed away, since `render` must stay total
 * over whatever `State` it is handed.
 */
function renderFreePlayHand(state: State): string {
  const result = state.freePlayResult;
  const hand = state.freePlayHand ?? [];
  const dealer = state.freePlayDealer ?? [];

  if (result) {
    const hitDrew = result.playerRanks.length > hand.length;
    // Finding 9: on a player bust, `playOut` settles the hand before the
    // dealer ever plays, so `result.dealerRanks` holds only the upcard — one
    // card fewer than the undecided view above showed (upcard + a face-down
    // hole card). Rendering `result.dealerRanks` alone would make that second
    // card visibly disappear at exactly the moment the hand settles. There is
    // no real hole-card rank to reveal here (the engine never dealt one, and
    // inventing one would make this settled view lie about what happened —
    // see ADR 0001), so the fix is to keep the placeholder rather than either
    // extreme: still face-down, never a fabricated rank, but still on screen.
    const dealerCards =
      result.dealerRanks.length > 1
        ? rankCards(result.dealerRanks, { bustedLastCard: result.dealerBusted })
        : [...rankCards(result.dealerRanks), faceDownCard()];
    const table = tableHtml([
      {
        label: "Dealer",
        handHtml: handHtml(dealerCards),
        total: result.dealerTotal,
        busted: result.dealerBusted,
      },
      {
        label: "You",
        handHtml: handHtml(
          rankCards(result.playerRanks, { bustedLastCard: result.playerBusted }),
        ),
        total: result.playerTotal,
        busted: result.playerBusted,
      },
    ]);

    return (
      table +
      // `role="status"` (story 49): the visitor learns the settlement without
      // polling the page. Fires once per hand, never per frame — nothing in
      // free play re-renders on its own the way beat 4's climb does.
      `<p class="data" role="status">${escapeHtml(freePlaySettlementCopy(result, hitDrew))}</p>` +
      actionButton("next-hand", "Next hand", { className: "btn btn--advance" })
    );
  }

  const total = handTotal(hand);
  const dealerTotal = handTotal(dealer);
  const table = tableHtml([
    {
      label: "Dealer",
      handHtml: handHtml([...rankCards(dealer), faceDownCard()]),
      total: dealerTotal.total,
    },
    {
      label: "You",
      handHtml: handHtml(rankCards(hand, { bustedLastCard: total.busted })),
      total: total.total,
      busted: total.busted,
    },
  ]);

  return (
    table +
    `<div class="decision">` +
    actionButton("hit-free-play", "Hit") +
    actionButton("stand-free-play", "Stand") +
    `</div>`
  );
}

/**
 * Free play: the same Shoe and Deal Model the locked opening just compared,
 * now dealing hand after hand while the Shoe depletes, the discard tray
 * fills, and the Running Count moves toward its high-water mark (story 29).
 * The Detail slot reads whatever rank is selected regardless of a hand being
 * held (it always has something to show), but the odds pair — story 60's
 * "the odds that MY NEXT DRAW survives or busts" — only has a next Draw to
 * be about while a hand is still undecided. Finding 8: once `freePlayResult`
 * is set the hand is settled and will never draw again, so `heldHand` is
 * `null` and the odds pair is omitted rather than printing a stale or
 * degenerate (0%/100%) split beside a hand nobody can act on anymore.
 */
function renderFreePlay(state: State): string {
  const heldHand = state.freePlayResult ? null : (state.freePlayHand ?? []);
  const selectedRank = state.act2SelectedRank ?? mostDepletedRank(state.shoe);
  const oddsPair = heldHand
    ? oddsPairHtml(bustSplit(heldHand, state.shoe, state.model))
    : "";
  const remainingPercent = (state.shoe.remaining / state.shoe.size) * 100;

  return section(
    "act-2",
    `<p class="eyebrow">Act 2</p>` +
      `<h2>${escapeHtml(ACT_2_HEADING)}</h2>` +
      renderFreePlayHand(state) +
      `<div class="spread">` +
      `<div>` +
      `<div class="models">` +
      modelButton(
        "finite-shoe",
        state.model,
        "Finite shoe",
        "Dealt cards are gone. What has appeared changes what can appear next.",
      ) +
      modelButton(
        "independent-draw",
        state.model,
        "Independent draw",
        "Every card from the same unchanging distribution. The past carries nothing.",
      ) +
      `</div>` +
      `<div class="meter-head"><span>Cards remaining</span><b>${formatCount(state.shoe.remaining)}</b></div>` +
      `<div class="shoe">` +
      `<span class="remaining" style="flex: 0 0 ${remainingPercent}%"></span>` +
      `<span class="spent"></span>` +
      `</div>` +
      discardTrayHtml(state.shoe) +
      `</div>` +
      `<div>` +
      `<h3>How many of each rank are left</h3>` +
      compositionChartInteractive(state, selectedRank) +
      oddsPair +
      countReadoutHtml(state) +
      lastCardHiLoHtml(state) +
      `<p class="lede">${RUNNING_COUNT_WARNING}</p>` +
      detailSlotHtml(state, selectedRank) +
      `</div>` +
      `</div>` +
      countRulePanelHtml(),
  );
}

export function renderAct2(state: State): string {
  if (state.act2FreePlay) return renderFreePlay(state);
  return renderLockedOpening(state);
}
