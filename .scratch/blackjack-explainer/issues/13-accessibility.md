# 13 — Keyboard, focus and screen reader pass

Status: done
Blocked by: 12

## Why

The marking routine tabs through the page. This is scored behaviour, not polish.

## What to do

- Every action is a real `<button>`, reachable by tabbing, with a visible focus
  indicator throughout.
- Focus is restored after every re-render: to the control just activated where
  it still exists, otherwise to the region that changed.
- Every chart has a text equivalent: the dealer histogram, the waffle, the
  composition chart, the draw strip. Prose cut from the page for density lives
  here rather than being deleted.
- The result of a Decision is announced without the visitor polling the page.
- Respect `prefers-reduced-motion`: the waffle renders complete rather than
  filling.

## Done when

The whole Explainer can be driven start to finish with only a keyboard, and
nothing meaningful exists only as colour or only as a bar.

## References

Spec stories 44–49.
