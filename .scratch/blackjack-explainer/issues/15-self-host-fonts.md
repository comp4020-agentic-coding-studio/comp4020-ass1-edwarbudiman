# 15 — Self-host the fonts

Status: ready-for-agent
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
