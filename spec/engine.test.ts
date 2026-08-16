import { describe, expect, it } from "vitest";
import {
  bustSplit,
  dealerDistribution,
  DEALER_TOTALS,
  discarded,
  drawOutcomes,
  drawProbability,
  freshShoe,
  handTotal,
  hiLoValue,
  RANKS,
  removeCards,
  runningCount,
  simulate,
  survivingRanks,
  type Rank,
} from "../src/engine/index.ts";

const SIXTEEN: Rank[] = ["10", "6"];
const DEALER: Rank[] = ["10", "7"];

describe("hand totals", () => {
  it("adds a hand up correctly", () => {
    // The regression test for a styleframe that printed 10 + 6 + 9 as 26.
    expect(handTotal(["10", "6", "9"]).total).toBe(25);
    expect(handTotal(["10", "6", "9"]).busted).toBe(true);
    expect(handTotal(SIXTEEN).total).toBe(16);
  });

  it("counts an ace high while that still fits", () => {
    expect(handTotal(["A", "6"])).toMatchObject({ total: 17, soft: true });
    expect(handTotal(["A", "10"])).toMatchObject({ total: 21, soft: true });
  });

  it("drops the ace back to one rather than busting", () => {
    expect(handTotal(["A", "6", "K"])).toMatchObject({
      total: 17,
      soft: false,
      busted: false,
    });
    expect(handTotal(["A", "A", "9"])).toMatchObject({ total: 21, soft: true });
  });

  it("treats every face card as ten", () => {
    for (const rank of ["10", "J", "Q", "K"] as const) {
      expect(handTotal(["5", rank]).total).toBe(15);
    }
  });
});

describe("the draw split for a sixteen", () => {
  // The regression test for brief-idea/blackjack/idea.md, which marks the 5
  // as busting a sixteen. It does not: 16 + 5 = 21.
  it("survives on exactly A, 2, 3, 4 and 5", () => {
    expect(survivingRanks(SIXTEEN)).toEqual(["A", "2", "3", "4", "5"]);
  });

  it("busts on the other eight ranks", () => {
    const { busting } = bustSplit(SIXTEEN, freshShoe(), "finite-shoe");
    expect(busting).toEqual(["6", "7", "8", "9", "10", "J", "Q", "K"]);
    expect(busting).toHaveLength(8);
  });

  it("puts a five at twenty-one, not over it", () => {
    const five = drawOutcomes(SIXTEEN, freshShoe(), "finite-shoe").find(
      (outcome) => outcome.rank === "5",
    );
    expect(five).toMatchObject({ total: 21, busts: false });
  });

  it("splits an untouched shoe five ways against eight", () => {
    const { surviveChance, bustChance } = bustSplit(
      SIXTEEN,
      freshShoe(),
      "finite-shoe",
    );
    expect(surviveChance).toBeCloseTo(5 / 13, 12);
    expect(bustChance).toBeCloseTo(8 / 13, 12);
    expect(surviveChance + bustChance).toBeCloseTo(1, 12);
  });
});

describe("the two deal models", () => {
  const dealt: Rank[] = ["Q", "Q", "Q"];

  it("lowers a rank's chance under finite shoe once it has been dealt", () => {
    const fresh = freshShoe();
    const depleted = removeCards(fresh, dealt);
    expect(drawProbability(depleted, "Q", "finite-shoe")).toBeLessThan(
      drawProbability(fresh, "Q", "finite-shoe"),
    );
  });

  it("leaves it exactly unchanged under independent draw", () => {
    const fresh = freshShoe();
    const depleted = removeCards(fresh, dealt);
    expect(drawProbability(depleted, "Q", "independent-draw")).toBe(
      drawProbability(fresh, "Q", "independent-draw"),
    );
  });

  it("starts both models at the same number", () => {
    const fresh = freshShoe();
    for (const rank of RANKS) {
      expect(drawProbability(fresh, rank, "finite-shoe")).toBeCloseTo(
        drawProbability(fresh, rank, "independent-draw"),
        12,
      );
    }
  });

  it("counts the discards toward the finite-shoe chance", () => {
    const depleted = removeCards(freshShoe(), dealt);
    expect(discarded(depleted, "Q")).toBe(3);
    expect(drawProbability(depleted, "Q", "finite-shoe")).toBeCloseTo(
      21 / 309,
      12,
    );
  });

  it("keeps every rank's chance summing to one", () => {
    const depleted = removeCards(freshShoe(), ["A", "A", "5", "K", "9"]);
    const total = RANKS.reduce(
      (sum, rank) => sum + drawProbability(depleted, rank, "finite-shoe"),
      0,
    );
    expect(total).toBeCloseTo(1, 12);
  });
});

describe("the dealer", () => {
  it("stands on all seventeens, including a soft one", () => {
    const { totals } = dealerDistribution(
      ["A", "6"],
      freshShoe(),
      "finite-shoe",
      200,
    );
    expect(totals["17"]).toBe(200);
  });

  it("produces a distribution that adds up", () => {
    const { trials, totals } = dealerDistribution(
      DEALER,
      freshShoe(),
      "finite-shoe",
      1_000,
    );
    const sum = DEALER_TOTALS.reduce((acc, bucket) => acc + totals[bucket], 0);
    expect(sum).toBe(trials);
  });

  it("never reports a standing total below seventeen", () => {
    const { totals } = dealerDistribution(
      ["10", "2"],
      freshShoe(),
      "finite-shoe",
      500,
    );
    for (const bucket of ["17", "18", "19", "20", "21"] as const) {
      expect(totals[bucket]).toBeGreaterThanOrEqual(0);
    }
    expect(Object.keys(totals)).toEqual([...DEALER_TOTALS]);
  });
});

describe("play-out distributions", () => {
  const table = {
    hand: SIXTEEN,
    dealer: DEALER,
    shoe: freshShoe(),
    model: "finite-shoe" as const,
  };

  it("settles every trial exactly once", () => {
    const { trials, settlements } = simulate(table, "hit", 1_000);
    expect(settlements.lost + settlements.push + settlements.won).toBe(trials);
  });

  it("is deterministic for a given seed", () => {
    expect(simulate(table, "hit", 500, 7)).toEqual(
      simulate(table, "hit", 500, 7),
    );
  });

  it("gives different answers for different seeds", () => {
    expect(simulate(table, "hit", 500, 7)).not.toEqual(
      simulate(table, "hit", 500, 8),
    );
  });

  it("never lets a standing player bust", () => {
    expect(simulate(table, "stand", 500).playerBusts).toBe(0);
  });

  it("busts a hitting sixteen more often than not", () => {
    const { trials, playerBusts } = simulate(table, "hit", 2_000);
    expect(playerBusts / trials).toBeGreaterThan(0.5);
  });

  it("loses more than it wins whichever decision is taken", () => {
    for (const decision of ["hit", "stand"] as const) {
      const { settlements } = simulate(table, decision, 2_000);
      expect(settlements.lost).toBeGreaterThan(settlements.won);
    }
  });

  it("only counts dealer totals for hands the dealer actually played", () => {
    const { trials, dealerPlayed, playerBusts, dealerTotals } = simulate(
      table,
      "hit",
      1_000,
    );
    expect(dealerPlayed).toBe(trials - playerBusts);
    const sum = DEALER_TOTALS.reduce(
      (acc, bucket) => acc + dealerTotals[bucket],
      0,
    );
    expect(sum).toBe(dealerPlayed);
  });
});

describe("the running count", () => {
  it("raises on low cards and lowers on tens and aces", () => {
    expect(hiLoValue("2")).toBe(1);
    expect(hiLoValue("6")).toBe(1);
    expect(hiLoValue("7")).toBe(0);
    expect(hiLoValue("9")).toBe(0);
    expect(hiLoValue("10")).toBe(-1);
    expect(hiLoValue("A")).toBe(-1);
  });

  it("puts the aces and the tens at opposite ends on the same value", () => {
    expect(hiLoValue("A")).toBe(hiLoValue("K"));
  });

  it("balances to zero over a whole deck's worth of ranks", () => {
    const wholeDeck = RANKS.flatMap((rank) => Array<Rank>(4).fill(rank));
    expect(runningCount(wholeDeck)).toBe(0);
  });

  it("tallies a sequence", () => {
    expect(runningCount(["4", "6", "K", "9"])).toBe(1);
  });
});
