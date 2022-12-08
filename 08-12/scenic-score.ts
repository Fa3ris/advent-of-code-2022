import { resolve } from "path";
import { AllReader } from "../helper/all-reader";

function getIndex(row: number, col: number, rowLength: number): number {
  return row * rowLength + col;
}

const inputTest = {
  path: "test.txt",
  answer: 8,
};
const input = {
  path: "input.txt",
  answer: 332640,
};

main(input);

function main(input: { path: string; answer: number }) {
  const r = new AllReader(resolve(__dirname, input.path));

  r.addLinesListener((lines) => {
    const cols = lines[0].length;
    const rows = lines.length;
    const outerVisibleCount = 2 * (cols + rows) - 4;
    console.log(lines, { rows, cols, outerVisibleCount });

    const forest = lines.flatMap((s) => s.split("")).map(Number);
    console.log(forest);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        process.stdout.write(String(forest[getIndex(row, col, cols)]));
      }
      process.stdout.write("\n");
    }

    const rowHeights = new Map<number, number[]>();
    for (let row = 0; row < rows; row++) {
      const heights: number[] = [];

      for (let col = 0; col < cols; col++) {
        heights.push(forest[getIndex(row, col, cols)]);
      }

      rowHeights.set(row, heights);
    }

    console.log("row heights", rowHeights);

    const colHeights = new Map<number, number[]>();
    for (let col = 0; col < cols; col++) {
      const heights: number[] = [];

      for (let row = 0; row < rows; row++) {
        heights.push(forest[getIndex(row, col, cols)]);
      }

      colHeights.set(col, heights);
    }

    console.log("col heights", colHeights);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        process.stdout.write(String(forest[getIndex(row, col, cols)]));
      }
      process.stdout.write("\n");
    }

    let maxScore = Number.NEGATIVE_INFINITY;
    for (let row = 1; row < rows - 1; row++) {
      for (let col = 1; col < cols - 1; col++) {
        const current = forest[getIndex(row, col, cols)];

        const leftElts = rowHeights.get(row)?.slice(0, col);
        leftElts?.reverse(); // read from right to left
        const leftView = distanceView(leftElts ?? [], current);

        const rightElts = rowHeights.get(row)?.slice(col + 1);
        const rightView = distanceView(rightElts ?? [], current);

        const topElts = colHeights.get(col)?.slice(0, row);
        topElts?.reverse(); // read from bottom to top
        const topView = distanceView(topElts ?? [], current);

        const downElts = colHeights.get(col)?.slice(row + 1);
        const downView = distanceView(downElts ?? [], current);

        const score = leftView * rightView * topView * downView;
        console.log({
          row,
          col,
          leftView,
          rightView,
          topView,
          downView,
          score,
        });

        maxScore = Math.max(maxScore, score);
      }
    }

    console.log({ maxScore });

    if (maxScore != input.answer) {
      throw new Error(`expected answer ${input.answer}`);
    }
  });

  r.run();
}

function distanceView(view: number[], height: number): number {
  const index = view.findIndex((v) => v >= height);
  if (index < 0) {
    return view.length;
  }
  return index + 1;
}
