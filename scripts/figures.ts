/**
 * Computes every number the styleframe shows, from the engine, with the shipped
 * seed. Writes .scratch/blackjack-explainer/figures.json.
 *
 * The styleframe fetches that file, so nothing on the proof sheet is a number
 * somebody typed. Run with: node scripts/figures.ts
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  bustSplit,
  dealerDistribution,
  DEALER_TOTALS,
  discarded,
  drawCard,
  drawOutcomes,
  drawProbability,
  freshShoe,
  fullRank,
  handTotal,
  hiLoValue,
  makeRng,
  playOut,
  RANKS,
  removeCards,
  runningCount,
  SEED,
  simulate,
  type Rank,
} from "../src/engine/index.ts";

const TRIALS = 1000;
const HAND: Rank[] = ["10", "6"];
const UPCARD: Rank[] = ["10"];
const MODEL = "finite-shoe" as const;

const pct = (n: number) => Math.round(n * 1000) / 10;

// ---- Act 1, beat 2: every card that could come next -----------------------

const openingShoe = removeCards(freshShoe(), [...HAND, ...UPCARD]);
const split = bustSplit(HAND, openingShoe, MODEL);
const outcomes = drawOutcomes(HAND, openingShoe, MODEL).map((outcome) => ({
  ...outcome,
  percent: pct(outcome.probability),
}));

// ---- Act 1, beat 3: the visitor's own hand, dealt honestly ----------------

const table = { hand: HAND, dealer: UPCARD, shoe: freshShoe(), model: MODEL };
const mine = playOut(
  { ...table, shoe: openingShoe },
  "hit",
  makeRng(SEED),
);

// ---- Act 1, beat 4: the thousand -----------------------------------------

const dealer = dealerDistribution(UPCARD, openingShoe, MODEL, TRIALS);
const settled = simulate(table, "hit", TRIALS);

// ---- Act 2: a shoe that has been played from ------------------------------

let act2Shoe = openingShoe;
const dealtOut: Rank[] = [];
const rng = makeRng(SEED + 1);
for (let i = 0; i < 44; i++) {
  const drawn = drawCard(act2Shoe, MODEL, rng);
  dealtOut.push(drawn.rank);
  act2Shoe = drawn.shoe;
}

const composition = RANKS.map((rank) => ({
  rank,
  left: act2Shoe.composition[rank],
  gone: discarded(act2Shoe, rank),
  percent: pct(drawProbability(act2Shoe, rank, MODEL)),
  wasPercent: pct(drawProbability(freshShoe(), rank, MODEL)),
  hiLo: hiLoValue(rank),
}));

const thinnest = [...composition].sort((a, b) => a.left - b.left)[0];

// ---- Act 3: play on until the count is worth having ----------------------

// Playing on until the count hits a fixed +6 does not work: the Hi-Lo count is
// balanced, so it returns toward zero as the shoe empties, and it never reaches
// +6 at all in about a quarter of shoes. Play on to the count's high-water mark
// instead — that always exists, and "the highest it has been all session" is a
// truer thing to say to the visitor than a magic number.
let act3Shoe = act2Shoe;
const act3Dealt = [...dealtOut];
let peak = runningCount(act3Dealt);
let peakAt = act3Dealt.length;
let peakRemaining = act3Shoe.remaining;

while (act3Shoe.remaining > 78) {
  const drawn = drawCard(act3Shoe, MODEL, rng);
  act3Dealt.push(drawn.rank);
  act3Shoe = drawn.shoe;
  const count = runningCount(act3Dealt);
  if (count > peak) {
    peak = count;
    peakAt = act3Dealt.length;
    peakRemaining = act3Shoe.remaining;
  }
}

const act3AtPeak = act3Dealt.slice(0, peakAt);

const figures = {
  seed: SEED,
  trials: TRIALS,
  fullRank: fullRank(openingShoe),
  hand: {
    ranks: HAND,
    total: handTotal(HAND).total,
    upcard: UPCARD[0],
  },
  act1: {
    outcomes,
    surviving: split.surviving,
    busting: split.busting,
    survivePercent: pct(split.surviveChance),
    bustPercent: pct(split.bustChance),
    mine: {
      drawn: mine.playerRanks.at(-1),
      ranks: mine.playerRanks,
      total: mine.playerTotal,
      busted: mine.playerBusted,
      settlement: mine.settlement,
    },
    dealer: DEALER_TOTALS.map((bucket) => ({
      bucket,
      count: dealer.totals[bucket],
      percent: pct(dealer.totals[bucket] / dealer.trials),
    })),
    settlements: settled.settlements,
  },
  act2: {
    remaining: act2Shoe.remaining,
    discarded: act2Shoe.size - act2Shoe.remaining,
    composition,
    thinnest,
  },
  act3: {
    remaining: peakRemaining,
    count: peak,
    cardsSeen: peakAt,
    lastFour: act3AtPeak
      .slice(-4)
      .map((rank) => ({ rank, hiLo: hiLoValue(rank) })),
  },
};

const out = join(
  import.meta.dirname,
  "..",
  ".scratch",
  "blackjack-explainer",
  "figures.json",
);
writeFileSync(out, `${JSON.stringify(figures, null, 2)}\n`);
console.log(`wrote ${out}`);
console.log(
  `hand ${HAND.join(" + ")} + ${figures.act1.mine.drawn} = ${figures.act1.mine.total}`,
);
console.log(
  `survive ${figures.act1.survivePercent}%  bust ${figures.act1.bustPercent}%`,
);
console.log(`settlements`, figures.act1.settlements);
console.log(
  `thinnest rank ${thinnest.rank}: ${thinnest.left} left of ${figures.fullRank}`,
);
console.log(`act 3 peak count ${figures.act3.count >= 0 ? "+" : ""}${figures.act3.count}, ${figures.act3.remaining} left`);
