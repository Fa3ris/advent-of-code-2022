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

function getScore(opponent: Hand, player: Hand): number {
  return baseScore[player] + comparisonTable[opponent][player];
}

function main() {
  const reader = new Reader(resolve(__dirname, "input.txt"));
  let totalScore = 0;
  reader.addLineListener((line) => {
    const [oppopent, player] = line.split(" ");
    const score = getScore(table[oppopent], table[player]);
    const message =
      line + ` ${Hand[table[oppopent]]} vs ${Hand[table[player]]} = ${score}`;
    console.log(message);
    totalScore += score;
  });
  reader.addCloseListener(() => {
    const outFile = `${parse(__filename).name}.txt`;
    console.log("score", totalScore, outFile);

    const outPath = resolve(__dirname, outFile);
    writeFile(outPath, String(totalScore), (err) => {
      console.error(err);
    });
  });
  reader.run();
}

main();
