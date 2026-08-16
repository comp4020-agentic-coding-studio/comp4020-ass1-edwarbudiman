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
  settle,
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

// `dealerDistribution` removes the dealer's own cards from the Shoe it is
// handed, internally, exactly once (src/engine/simulate.ts). `openingShoe`
// above already has the dealer's upcard removed (to match beat 2's own
// `bustSplit` reading), so handing it to `dealerDistribution` too would
// remove that upcard a second time — one card short of what was actually on
// the table. `dealerShoe` removes only the visitor's hand, leaving the
// dealer's upcard for `dealerDistribution` to remove itself.
const dealerShoe = removeCards(freshShoe(), HAND);
const dealer = dealerDistribution(UPCARD, dealerShoe, MODEL, TRIALS);
const settled = simulate(table, "hit", TRIALS);

// ---- Act 2: a shoe that has been played from ------------------------------

// One session, sampled once. Acts 2 and 3 show the same shoe at the same
// moment — the point where the Running Count is at its high-water mark — rather
// than two unrelated shoes that happen to sit next to each other on the page.
//
// The walk is capped at 66 cards, about twelve hands, because that is a session
// somebody would actually sit through. The offset is chosen so the demo shows a
// count worth having; every card in it is still dealt by the engine.
const WALK = 66;
const SESSION_SEED = SEED + 54;

const rng = makeRng(SESSION_SEED);
const walked: Rank[] = [];
let walkShoe = openingShoe;
let peak = 0;
let peakAt = 0;

while (walked.length < WALK) {
  const drawn = drawCard(walkShoe, MODEL, rng);
  walked.push(drawn.rank);
  walkShoe = drawn.shoe;
  const count = runningCount(walked);
  if (count > peak) {
    peak = count;
    peakAt = walked.length;
  }
}

const dealtOut = walked.slice(0, peakAt);
const act2Shoe = removeCards(openingShoe, dealtOut);

const composition = RANKS.map((rank) => ({
  rank,
  left: act2Shoe.composition[rank],
  gone: discarded(act2Shoe, rank),
  percent: pct(drawProbability(act2Shoe, rank, MODEL)),
  wasPercent: pct(drawProbability(freshShoe(), rank, MODEL)),
  hiLo: hiLoValue(rank),
}));

const thinnest = [...composition].sort((a, b) => a.left - b.left)[0];

// ---- Act 3: the state the visitor built ---------------------------------

// Act 3 is offered at the count's high-water mark rather than at a fixed
// threshold. Hi-Lo is a balanced count: it returns toward zero as the shoe
// empties, so a fixed target is not reliably reachable. Measured over 300
// shoes, +6 arrives before 75% penetration in only 74% of them and takes about
// fourteen hands when it does. The high-water mark always exists.
const act3Shoe = act2Shoe;
const act3AtPeak = dealtOut;

// ---- Act 3: the Scripted Hand --------------------------------------------

// Chosen, and labelled as chosen. Standing on twenty is unambiguously correct,
// so there is nothing for the visitor to blame when the dealer turns a six into
// twenty-one. Totals and settlement still go through the engine — a scripted
// hand is allowed to be chosen, it is not allowed to be wrong.
const SCRIPTED_YOU: Rank[] = ["10", "10"];
const SCRIPTED_DEALER: Rank[] = ["6", "5", "10"];
const scriptedYou = handTotal(SCRIPTED_YOU);
const scriptedDealer = handTotal(SCRIPTED_DEALER);

const figures = {
  seed: SEED,
  scripted: {
    you: SCRIPTED_YOU,
    dealer: SCRIPTED_DEALER,
    yourTotal: scriptedYou.total,
    dealerTotal: scriptedDealer.total,
    settlement: settle(
      scriptedYou.total,
      scriptedYou.busted,
      scriptedDealer.total,
      scriptedDealer.busted,
    ),
  },
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
      // The hole card comes out at settlement, so beat 4 can finally show the
      // dealer's whole hand rather than the one card beat 1 let you see.
      dealerRanks: mine.dealerRanks,
      dealerTotal: mine.dealerTotal,
      dealerBusted: mine.dealerBusted,
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
    remaining: act3Shoe.remaining,
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
