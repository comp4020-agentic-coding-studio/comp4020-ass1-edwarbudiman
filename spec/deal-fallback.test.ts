import { describe, expect, it } from "vitest";
import {
  drawCard,
  freshShoe,
  RANKS,
  removeCards,
  type Rank,
  type Shoe,
} from "../src/engine/index.ts";

// Under Independent Draw the weights are the fresh composition, so the ticket
// can land on a rank the Shoe has genuinely run out of. What happens next is
// unreachable in the shipped Explainer — no path depletes a whole rank — which
// is exactly why it needs a test: a dead branch that is quietly wrong stays
// quietly wrong until the seed, the opening hand or the Shoe size changes.

/** A Shoe with every card of `rank` removed and everything else untouched. */
function shoeWithout(rank: Rank): Shoe {
  const fresh = freshShoe();
  return removeCards(
    fresh,
    Array.from({ length: fresh.composition[rank] }, () => rank),
  );
}

describe("drawCard, when the drawn rank is exhausted", () => {
  it("falls through to the next rank along, not back to the Ace", () => {
    // The 6 is gone. A ticket landing on it must resolve to the 7 — the next
    // rank in the axis order — rather than to whatever rank happens to come
    // first in RANKS, which would pull every exhausted draw toward the Ace.
    const shoe = shoeWithout("6");
    expect(shoe.composition["6"]).toBe(0);

    const sixIndex = RANKS.indexOf("6");
    const before = RANKS.slice(0, sixIndex).reduce(
      (sum, rank) => sum + shoe.size / RANKS.length,
      0,
    );
    // An rng landing just inside the 6's slice of the fresh-composition weights.
    const total = shoe.size;
    const rng = () => (before + 1) / total;

    const { rank } = drawCard(shoe, "independent-draw", rng);
    expect(rank).toBe("7");
  });

  it("wraps past the King back to the Ace rather than throwing", () => {
    const shoe = shoeWithout("K");
    const kingIndex = RANKS.indexOf("K");
    const before = kingIndex * (shoe.size / RANKS.length);
    const rng = () => (before + 1) / shoe.size;

    const { rank } = drawCard(shoe, "independent-draw", rng);
    expect(rank).toBe("A");
  });

  it("still removes exactly one card from the Shoe", () => {
    const shoe = shoeWithout("6");
    const { shoe: after } = drawCard(shoe, "independent-draw", () => 0.5);
    expect(after.remaining).toBe(shoe.remaining - 1);
  });
});
