/**
 * Act 2 — Two kinds of blackjack.
 *
 * Opens LOCKED: the same hand the visitor just played (`state.hand`), with
 * the Deal Model as the only thing that moves. Story 21 (revised) — the hand
 * is held constant for this opening only, not for the whole Act. Free play
 * (a later ticket) unlocks once the visitor clicks through; until it does,
 * `renderFreePlayPlaceholder` stands in for it.
 *
 * See CONTEXT.md ("Deal Model", "Finite Shoe", "Independent Draw", "Shoe")
 * and `.scratch/blackjack-explainer/design.md`'s Flow and Components.
 */

import {
  discarded,
  drawProbability,
  drawWeights,
  fullRank,
  handTotal,
  RANKS,
  type DealModel,
  type Rank,
  type Shoe,
} from "../../engine/index.ts";
import { formatCount, formatPercent } from "../format.ts";
import { actionButton, escapeHtml, section } from "../render.ts";
import type { State } from "../state.ts";
import { axisRow } from "../views/axis.ts";
import { handHtml, rankCards } from "../views/card.ts";
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
 * The composition chart: counts, not probability, on the shared thirteen-rank
 * axis. `drawWeights` is what makes switching the Deal Model recompute this —
 * under Independent Draw it hands back a fresh composition regardless of what
 * has actually left the Shoe, so the bars snap to a full rank and stay there
 * (docs/adr/0003: "Act 2 charts cards remaining per rank, not probability").
 */
function compositionChart(state: State): string {
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

  const labels = axisRow(
    RANKS.map((rank) => {
      const low = varied && weights[rank] === min;
      return `<div class="draw"${low ? ' aria-pressed="true"' : ""}>${escapeHtml(rank)}</div>`;
    }),
  );

  return (
    `<p class="axis-full-label">${full} — a full rank</p>` + bars + labels
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
    `<p class="plate-label">Act 2 · locked opening, then free play</p>` +
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
 * Free play itself is a later ticket. This is only the acknowledgement that
 * the visitor unlocked it — no play happens here yet.
 */
function renderFreePlayPlaceholder(state: State): string {
  return section(
    "act-2",
    `<p class="plate-label">Act 2 · free play</p>` +
      `<p class="eyebrow">Act 2</p>` +
      `<h2>${escapeHtml(ACT_2_HEADING)}</h2>` +
      `<p class="lede">Free play, from this same Shoe and Running Count, is on its way.</p>` +
      `<p class="data">Deal Model: ${escapeHtml(state.model)}</p>`,
  );
}

export function renderAct2(state: State): string {
  if (state.act2FreePlay) return renderFreePlayPlaceholder(state);
  return renderLockedOpening(state);
}
