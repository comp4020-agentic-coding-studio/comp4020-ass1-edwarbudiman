/**
 * The `.table` / `.seat` / `.total` block — one template shared by every Act
 * that shows cards in front of the visitor.
 */

import { escapeHtml } from "../escape-html.ts";

export interface Seat {
  /** "Dealer" or "You". */
  label: string;
  /** Pre-built markup from `card.ts`'s `handHtml`. */
  handHtml: string;
  total: number;
  busted?: boolean;
}

export function tableHtml(seats: readonly Seat[]): string {
  return `<div class="table">${seats.map(seatHtml).join("")}</div>`;
}

function seatHtml(seat: Seat): string {
  const bustBadge = seat.busted ? `<span class="busted">Bust</span>` : "";
  return (
    `<div class="seat">${seat.handHtml}` +
    `<p class="total">${escapeHtml(seat.label)}<b>${seat.total}</b>${bustBadge}</p>` +
    `</div>`
  );
}
