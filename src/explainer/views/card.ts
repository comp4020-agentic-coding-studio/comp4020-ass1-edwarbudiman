/**
 * A card, a face-down card, a busting card, and a hand of them — the class
 * vocabulary from `.scratch/blackjack-explainer/styleframe.html`'s CARDS
 * section (`.card`, `.card--back`, `.card--bust`, `.hand`, `.suit`, `.rank`).
 *
 * Suits are decorative only — the engine has no notion of suit, only Rank —
 * so they cycle by position exactly as the styleframe's own script does.
 */

import type { Rank } from "../../engine/index.ts";
import { escapeHtml } from "../escape-html.ts";

const SUITS = ["♠", "♥", "♦", "♣"] as const;

export interface FaceUpCardOptions {
  /** Which decorative suit to show; cycles through SUITS by position. */
  suitIndex?: number;
  /** Marks this specific card as the one that busted the hand. */
  busted?: boolean;
}

/** One card, face up. */
export function faceUpCard(rank: Rank, options: FaceUpCardOptions = {}): string {
  const classes = options.busted ? "card card--bust" : "card";
  const suit = SUITS[(options.suitIndex ?? 0) % SUITS.length];
  return (
    `<div class="${classes}">` +
    `<span class="suit">${suit}</span>` +
    `<span class="rank">${escapeHtml(rank)}</span>` +
    `</div>`
  );
}

/**
 * A card dealt but not yet revealed — visual only. It never carries a Rank,
 * because as far as `State` is concerned the card has not been dealt.
 */
export function faceDownCard(): string {
  return `<div class="card card--back" aria-label="Face-down card"></div>`;
}

export interface RankCardsOptions {
  /** True when the hand busted, so the last card gets `.card--bust`. */
  bustedLastCard?: boolean;
}

/** Every card in a hand of known ranks, in order. */
export function rankCards(
  ranks: readonly Rank[],
  options: RankCardsOptions = {},
): string[] {
  return ranks.map((rank, index) =>
    faceUpCard(rank, {
      suitIndex: index,
      busted: options.bustedLastCard === true && index === ranks.length - 1,
    }),
  );
}

/** Wraps already-built card HTML (face up, face down, or both) in a `.hand`. */
export function handHtml(cardsHtml: readonly string[]): string {
  return `<div class="hand">${cardsHtml.join("")}</div>`;
}
