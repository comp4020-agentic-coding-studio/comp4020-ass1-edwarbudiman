/**
 * The two popover sizes (`design.md` -> Components -> "Popover — two sizes",
 * ADR 0003, `.scratch/blackjack-explainer/issues/09-popovers-and-reference.md`).
 *
 * Both are native `[popover]` + `popovertarget` — no JavaScript of ours opens,
 * closes, positions or Esc-dismisses either one. Activation is click/tap only:
 * neither helper attaches or implies a hover handler, because hover does not
 * exist at 390×844 or for a keyboard user, and this page is marked by tabbing.
 *
 * These are call-site building blocks for later tickets (Act 1/2/3 already
 * hand-write this exact markup for `why-stand`, `why-dealer` and
 * `how-count` — see `acts/act-1.ts` and `views/count-readout.ts`). Nothing
 * here retrofits those call sites; that is out of scope for this ticket.
 *
 * - `notePopover` — small, anchored with `position-area` /
 *   `position-try-fallbacks` (CSS only, in `styles.css`'s `[popover]` rule),
 *   no backdrop. Returns the trigger button AND its target together, because
 *   a note is always a single glance-at unit wherever it appears.
 * - `panelPopover` — large, centred, dimmed `::backdrop`, its own heading and
 *   close button. Returns only the target: a panel is opened from whatever
 *   trigger its call site already has (a `?`, a "See them" button, ...), so
 *   the trigger is not this helper's business.
 */

import { escapeHtml } from "../escape-html.ts";

export interface NotePopoverOptions {
  /** Also the popover's target id and the CSS anchor name's suffix. */
  id: string;
  /** `.pop-title` heading inside the note. */
  title: string;
  /** Inner HTML of the note body — already-built `<p>` markup (matching the
   *  `[popover] p + p` spacing rule for multiple paragraphs) or plain text. */
  body: string;
  /** Text on the trigger button: "?" for the icon form, or the question word
   *  itself for the inline form (e.g. "push?"). */
  triggerLabel: string;
  /** Needed when `triggerLabel` alone (e.g. "?") doesn't say what it opens. */
  triggerAriaLabel?: string;
  /** Use the inline word-as-trigger form (`.why--inline`) instead of the
   *  small round "?" button. */
  inline?: boolean;
}

/** A small, anchored, no-backdrop note: a trigger button plus its `[popover]`
 *  target, anchored to each other by a shared CSS anchor name. */
export function notePopover(options: NotePopoverOptions): string {
  const { id, title, body, triggerLabel, triggerAriaLabel, inline = false } = options;
  const anchorName = `--a-${id}`;
  const triggerClass = inline ? "why why--inline" : "why";
  const ariaLabelAttr = triggerAriaLabel
    ? ` aria-label="${escapeHtml(triggerAriaLabel)}"`
    : "";

  return (
    `<button class="${triggerClass}" type="button" id="do-${escapeHtml(id)}-trigger" ` +
    `popovertarget="${escapeHtml(id)}" ` +
    `style="anchor-name: ${anchorName}"${ariaLabelAttr}>${escapeHtml(triggerLabel)}</button>` +
    `<div id="${escapeHtml(id)}" popover style="position-anchor: ${anchorName}">` +
    `<p class="pop-title">${escapeHtml(title)}</p>` +
    `<p>${body}</p>` +
    `</div>`
  );
}

export interface PanelPopoverOptions {
  /** Also the popover's target id. */
  id: string;
  /** `.pop-title` heading in the `.panel-head`. */
  title: string;
  /** Inner HTML of the panel body — already-built markup (paragraphs, the
   *  rank axis, a discard grid, ...). */
  body: string;
}

/** A large, centred `.panel` with a dimmed `::backdrop`, its own heading and
 *  a `.panel-close` button that targets itself. No trigger button: the panel
 *  is opened from whatever control its call site already renders. */
export function panelPopover(options: PanelPopoverOptions): string {
  const { id, title, body } = options;
  const escapedId = escapeHtml(id);

  return (
    `<div id="${escapedId}" popover class="panel">` +
    `<div class="panel-head">` +
    `<p class="pop-title">${escapeHtml(title)}</p>` +
    `<button class="panel-close" type="button" id="do-${escapedId}-close" ` +
    `popovertarget="${escapedId}" popovertargetaction="hide">Close</button>` +
    `</div>` +
    body +
    `</div>`
  );
}
