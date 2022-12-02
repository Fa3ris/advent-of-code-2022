import { writeFile } from "fs";
import { resolve, parse } from "path";
import { Reader } from "../helper/reader";

enum Hand {
  ROCK,
  PAPER,
  SCISSOR,
}

const table: Record<string, Hand> = {
  A: Hand.ROCK,
  B: Hand.PAPER,
  C: Hand.SCISSOR,

  X: Hand.ROCK,
  Y: Hand.PAPER,
  Z: Hand.SCISSOR,
};

const baseScore = {
  [Hand.ROCK]: 1,
  [Hand.PAPER]: 2,
  [Hand.SCISSOR]: 3,
};

enum Point {
  LOSS = 0,
  DRAW = 3,
  WIN = 6,
}

// opponent then player
const comparisonTable = {
  [Hand.ROCK]: {
    [Hand.ROCK]: Point.DRAW,
    [Hand.PAPER]: Point.WIN,
    [Hand.SCISSOR]: Point.LOSS,
  },
  [Hand.PAPER]: {
    [Hand.ROCK]: Point.LOSS,
    [Hand.PAPER]: Point.DRAW,
    [Hand.SCISSOR]: Point.WIN,
  },
  [Hand.SCISSOR]: {
    [Hand.ROCK]: Point.WIN,
    [Hand.PAPER]: Point.LOSS,
    [Hand.SCISSOR]: Point.DRAW,
  },
};

// opponent then player
const chooseHandTable = {
  [Point.DRAW]: {
    [Hand.ROCK]: Hand.ROCK,
    [Hand.PAPER]: Hand.PAPER,
    [Hand.SCISSOR]: Hand.SCISSOR,
  },
  [Point.WIN]: {
    [Hand.ROCK]: Hand.PAPER,
    [Hand.PAPER]: Hand.SCISSOR,
    [Hand.SCISSOR]: Hand.ROCK,
  },
  [Point.LOSS]: {
    [Hand.ROCK]: Hand.SCISSOR,
    [Hand.PAPER]: Hand.ROCK,
    [Hand.SCISSOR]: Hand.PAPER,
  },
};

const chooseResult: Record<string, Point> = {
  X: Point.LOSS,
  Y: Point.DRAW,
  Z: Point.WIN,
};

function getScore(opponent: Hand, player: Hand): number {
  return baseScore[player] + comparisonTable[opponent][player];
}

function main() {
  const reader = new Reader(resolve(__dirname, "input.txt"));
  let totalScore = 0;
  reader.addLineListener((line) => {
    const [oppopent, player] = line.split(" ");

    const oppopenHand = table[oppopent];
    const playerHand = chooseHandTable[chooseResult[player]][table[oppopent]];
    const score = getScore(oppopenHand, playerHand);
    const message =
      line + ` ${Hand[oppopenHand]} vs ${Hand[playerHand]} = ${score}`;
    console.log(message);
    totalScore += score;
  });
  reader.addCloseListener(() => {
    const outFile = `${parse(__filename).name}.txt`;
    console.log("score", totalScore, outFile);

    const outPath = resolve(__dirname, outFile);
    writeFile(outPath, String(totalScore), (err) => {
      if (err) {
        console.error(err);
      }
    });
  });
  reader.run();
}

main();
