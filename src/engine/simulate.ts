/**
 * Play-out level maths: one hand carried from the Decision through the dealer's
 * turn to settlement, many times over, from a seeded generator.
 *
 * This is the only place sampling is allowed. Draw probabilities are exact
 * arithmetic; the dealer's turn against a depleting shoe is what needs Monte
 * Carlo. See docs/adr/0002.
 */

import { handTotal, type Rank } from "./cards.ts";
import { drawCard, playDealer } from "./deal.ts";
import { makeRng, SEED, type Rng } from "./rng.ts";
import { removeCards, type DealModel, type Shoe } from "./shoe.ts";
import type { Decision } from "./outcomes.ts";

export type Settlement = "lost" | "push" | "won";

/** Dealer final totals worth distinguishing. Anything over 21 is "bust". */
export const DEALER_TOTALS = ["17", "18", "19", "20", "21", "bust"] as const;
export type DealerTotal = (typeof DEALER_TOTALS)[number];

export interface PlayOut {
  playerRanks: Rank[];
  playerTotal: number;
  playerBusted: boolean;
  dealerRanks: Rank[];
  dealerTotal: number;
  dealerBusted: boolean;
  settlement: Settlement;
}

export interface Table {
  /** The visitor's cards. */
  hand: readonly Rank[];
  /** The dealer's upcard and hole card. */
  dealer: readonly Rank[];
  shoe: Shoe;
  model: DealModel;
}

export function settle(
  playerTotal: number,
  playerBusted: boolean,
  dealerTotal: number,
  dealerBusted: boolean,
): Settlement {
  if (playerBusted) return "lost";
  if (dealerBusted) return "won";
  if (playerTotal > dealerTotal) return "won";
  if (playerTotal < dealerTotal) return "lost";
  return "push";
}

export function dealerBucket(total: number, busted: boolean): DealerTotal {
  if (busted) return "bust";
  return String(Math.min(total, 21)) as DealerTotal;
}

/**
 * Play one hand out. `hit` takes exactly one card and then stands, which is what
 * the Explainer offers: a single Decision, not a strategy.
 */
export function playOut(table: Table, decision: Decision, rng: Rng): PlayOut {
  const playerRanks = [...table.hand];
  let shoe = table.shoe;

  if (decision === "hit") {
    const drawn = drawCard(shoe, table.model, rng);
    playerRanks.push(drawn.rank);
    shoe = drawn.shoe;
  }

  const player = handTotal(playerRanks);

  // A busted player is settled without the dealer playing — the same way a real
  // table does it, and the reason busting costs more than it looks.
  if (player.busted) {
    return {
      playerRanks,
      playerTotal: player.total,
      playerBusted: true,
      dealerRanks: [...table.dealer],
      dealerTotal: handTotal(table.dealer).total,
      dealerBusted: false,
      settlement: "lost",
    };
  }

  const dealer = playDealer(table.dealer, shoe, table.model, rng);

  return {
    playerRanks,
    playerTotal: player.total,
    playerBusted: false,
    dealerRanks: dealer.ranks,
    dealerTotal: dealer.total,
    dealerBusted: dealer.busted,
    settlement: settle(player.total, false, dealer.total, dealer.busted),
  };
}

export interface Distribution {
  trials: number;
  settlements: Record<Settlement, number>;
  /** Only the trials where the dealer actually played — a busted player ends the
   *  hand where they stand. Use `dealerPlayed` as the denominator, or better,
   *  use `dealerDistribution`, which is not conditioned on the Decision at all. */
  dealerTotals: Record<DealerTotal, number>;
  dealerPlayed: number;
  playerBusts: number;
}

/**
 * What a dealer showing this upcard makes, over many hands.
 *
 * Deliberately independent of the visitor's Decision: the dealer's outcome is a
 * property of their own cards, and conditioning it on "the hands where you did
 * not bust" would quietly change what the chart is a chart of.
 */
export function dealerDistribution(
  dealer: readonly Rank[],
  shoe: Shoe,
  model: DealModel,
  trials: number,
  seed: number = SEED,
): { trials: number; totals: Record<DealerTotal, number> } {
  const rng = makeRng(seed);
  const start = removeCards(shoe, dealer);
  const totals = Object.fromEntries(
    DEALER_TOTALS.map((bucket) => [bucket, 0]),
  ) as Record<DealerTotal, number>;

  for (let trial = 0; trial < trials; trial++) {
    const result = playDealer(dealer, start, model, rng);
    totals[dealerBucket(result.total, result.busted)]++;
  }

  return { trials, totals };
}

/**
 * Run the same Decision many times from the same table, and return every
 * trial's Play-out in the order it was dealt.
 *
 * The shoe each trial starts from is the table's shoe with the dealer's cards
 * and the visitor's cards already removed — those are on the table, not in the
 * shoe, and forgetting that is how a simulation quietly deals the same card
 * twice.
 *
 * This is the only simulation loop: `simulate` below reduces this same array
 * into aggregate counts rather than sampling a second time, so the two can
 * never drift apart. Beat 4's waffle reads this array directly — trial zero
 * is mathematically identical to the solo `playOut` call `dealBeat3` already
 * made (same table, same decision, same seed, same first `rng` draw), so the
 * visitor's own hand is genuinely one of these, not a lookalike stitched in.
 */
export function simulateTrials(
  table: Table,
  decision: Decision,
  trials: number,
  seed: number = SEED,
): PlayOut[] {
  const rng = makeRng(seed);
  const start: Table = {
    ...table,
    shoe: removeCards(table.shoe, [...table.hand, ...table.dealer]),
  };

  const results: PlayOut[] = [];
  for (let trial = 0; trial < trials; trial++) {
    results.push(playOut(start, decision, rng));
  }
  return results;
}

/** The same many trials, reduced into aggregate settlement and dealer-total
 *  counts. See `simulateTrials` — this samples nothing itself. */
export function simulate(
  table: Table,
  decision: Decision,
  trials: number,
  seed: number = SEED,
): Distribution {
  const results = simulateTrials(table, decision, trials, seed);

  const settlements: Record<Settlement, number> = { lost: 0, push: 0, won: 0 };
  const dealerTotals = Object.fromEntries(
    DEALER_TOTALS.map((bucket) => [bucket, 0]),
  ) as Record<DealerTotal, number>;
  let playerBusts = 0;
  let dealerPlayed = 0;

  for (const result of results) {
    settlements[result.settlement]++;
    if (result.playerBusted) {
      playerBusts++;
    } else {
      dealerPlayed++;
      dealerTotals[dealerBucket(result.dealerTotal, result.dealerBusted)]++;
    }
  }

  return { trials, settlements, dealerTotals, dealerPlayed, playerBusts };
}
