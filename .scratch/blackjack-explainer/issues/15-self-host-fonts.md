# 15 — Self-host the fonts

Status: wontfix
Blocked by: 08

## Why

The styleframe loads Archivo Narrow, Source Serif 4 and JetBrains Mono from a
CDN. The deployed page should not depend on a third party being reachable while
it is being marked.

Deliberately after the deploy: a CDN font is a working page, and shipping beats
optimising.

## What to do

Self-host subset `.woff2` files, `font-display: swap`, preload the display face.
Budget roughly 60–90KB total. Keep the fallback stacks already in the tokens.

## Done when

The deployed page renders correct type with the network blocked to
`fonts.googleapis.com` and `fonts.gstatic.com`.

## Resolution — not done, by decision

Closed `wontfix`. Asked directly, with this ticket's objection stated, and the
CDN `<link>` was chosen over self-hosting. `index.html` now loads the three
faces from `fonts.googleapis.com`, with a comment at the tag saying it is a
decision rather than the default.

What that costs, recorded so it is not rediscovered as a bug: the "Done when"
above is **not** met. With the network blocked to Google the page falls back to
Helvetica Neue / Georgia / ui-monospace rather than the intended type, and the
marked page depends on a third party being reachable. The fallback stacks in
the tokens are what keeps that a degradation rather than a broken page.

Reopen by fetching subset `.woff2` files and dropping the two `<link>`s.
