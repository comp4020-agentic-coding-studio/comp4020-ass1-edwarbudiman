/**
 * `render(state)` — a pure function of `State` alone, returning an HTML
 * string. It renders exactly the current Act into the mount point's inner
 * HTML; it never renders the masthead, nav, rules line or noscript notice —
 * those are static markup in `index.html` (see CLAUDE.md's "static shell").
 *
 * Only one Act's `<section>` is returned at a time, carrying the real
 * `id="act-N"` hash target and `tabindex="-1"` so a re-render has somewhere
 * sensible to send focus back to. Nothing here reads any viewport dimension
 * or media query — layout is CSS's job — see `spec/contracts.test.ts`'s
 * resize-safety check, which greps for that mechanically.
 */

import { handTotal } from "../engine/index.ts";
import { escapeHtml } from "./escape-html.ts";
import type { State } from "./state.ts";
import { faceDownCard, handHtml, rankCards } from "./views/card.ts";
import { tableHtml } from "./views/table.ts";

export { escapeHtml };

const ACT_HEADING: Record<State["act"], string> = {
  1: "Act 1 — How blackjack works",
  2: "Act 2 — Two kinds of blackjack",
  3: "Act 3 — The conclusion",
};

function section(id: string, inner: string): string {
  return `<section class="plate" id="${id}" tabindex="-1">${inner}</section>`;
}

function placeholder(id: string, plateLabel: string, heading: string): string {
  return section(
    id,
    `<p class="plate-label">${escapeHtml(plateLabel)}</p>` +
      `<h2>${escapeHtml(heading)}</h2>`,
  );
}

/**
 * Act 1, beat 1: the dealer's upcard face up beside a face-down card, the
 * visitor's two cards and both totals, and Hit / Stand as two identically
 * weighted buttons. Nothing else — no probability appears before the
 * Decision.
 */
function renderAct1Beat1(state: State): string {
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
    `<p class="plate-label">Act 1 · beat 1 — how blackjack works</p>` +
      `<p class="eyebrow">Act 1</p>` +
      `<h2>You have sixteen</h2>` +
      `<p class="lede">The dealer is showing a ten. Before you read another ` +
      `word: hit, or stand?</p>` +
      table +
      `<div class="decision">` +
      `<button class="btn" type="button" data-action="decide" data-arg="hit">Hit</button>` +
      `<button class="btn" type="button" data-action="decide" data-arg="stand">Stand</button>` +
      `</div>`,
  );
}

const ACT1_BEAT_LABEL: Record<2 | 3 | 4, string> = {
  2: "Act 1 · beat 2 — every card that could come next",
  3: "Act 1 · beat 3 — your hand, dealt honestly",
  4: "Act 1 · beat 4 — the thousand",
};

function renderAct1(state: State): string {
  if (state.beat === 1) return renderAct1Beat1(state);
  return placeholder("act-1", ACT1_BEAT_LABEL[state.beat], ACT_HEADING[1]);
}

function renderAct2(): string {
  return placeholder("act-2", "Act 2 · locked opening, then free play", ACT_HEADING[2]);
}

function renderAct3(): string {
  return placeholder("act-3", "Act 3 · the conclusion", ACT_HEADING[3]);
}

export function render(state: State): string {
  if (state.act === 1) return renderAct1(state);
  if (state.act === 2) return renderAct2();
  return renderAct3();
}
