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
 *
 * Each Act's own rendering lives under `acts/` — `acts/act-1.ts`,
 * `acts/act-2.ts`, `acts/act-3.ts` — so later Acts can be built without
 * colliding with each other. This file keeps only what every Act shares: the
 * `<section>` wrapper, the button helper, the escaping, and the dispatch.
 */

import { escapeHtml } from "./escape-html.ts";
import type { State } from "./state.ts";
import { renderAct1 } from "./acts/act-1.ts";
import { renderAct2 } from "./acts/act-2.ts";
import { renderAct3 } from "./acts/act-3.ts";

export { escapeHtml };

export function section(id: string, inner: string): string {
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

export function render(state: State): string {
  if (state.act === 1) return renderAct1(state);
  if (state.act === 2) return renderAct2(state);
  return renderAct3(state);
}
