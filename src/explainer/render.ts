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

/**
 * Every action button carries a stable id, and that is load-bearing rather
 * than decorative: the shell restores focus after a re-render by looking the
 * previously-focused id back up. A button with no id can never be found again,
 * so focus would always fall back to the whole section — which is the right
 * behaviour only when the control genuinely went away. Later tickets: keep
 * using this helper rather than hand-writing `<button>`.
 */
export function actionButton(
  action: string,
  label: string,
  options: { arg?: string; className?: string } = {},
): string {
  const { arg, className = "btn" } = options;
  const id = arg ? `do-${action}-${arg}` : `do-${action}`;
  const argAttr = arg ? ` data-arg="${escapeHtml(arg)}"` : "";
  return (
    `<button class="${escapeHtml(className)}" type="button" id="${escapeHtml(id)}"` +
    ` data-action="${escapeHtml(action)}"${argAttr}>${escapeHtml(label)}</button>`
  );
}

function placeholder(id: string, heading: string): string {
  return section(id, `<h2>${escapeHtml(heading)}</h2>`);
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

function renderAct1(state: State): string {
  if (state.beat === 1) return renderAct1Beat1(state);
  return placeholder("act-1", ACT_HEADING[1]);
}

function renderAct2(): string {
  return placeholder("act-2", ACT_HEADING[2]);
}

function renderAct3(): string {
  return placeholder("act-3", ACT_HEADING[3]);
}

export function render(state: State): string {
  if (state.act === 1) return renderAct1(state);
  if (state.act === 2) return renderAct2();
  return renderAct3();
}
