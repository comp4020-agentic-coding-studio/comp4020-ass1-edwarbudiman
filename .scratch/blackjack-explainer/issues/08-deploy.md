# 08 — Deploy, as soon as Act 1 works

Status: ready-for-agent
Blocked by: 01, 07

## Why

A first deployment attempted near the deadline is the most common way a finished
artefact scores nothing. Act 1 alone is a coherent thing to have live.

## What to do

Flip the repo public, enable GitHub Pages, trigger the deploy, and **open the
live URL and check it actually serves** — the built page, the stylesheet, the
fonts, both themes.

`base: "./"` is already set in `vite.config.ts`, so asset URLs are relative and
no base-path work is needed. Hash routing means deep links to `#act-1` work on a
static host; a path-based route would 404.

Do not skip the live check. A green build is not a served page.

## Done when

The public URL renders Act 1 end to end in Chrome at 1920×1080 and 390×844.
