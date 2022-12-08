import { resolve } from "path";
import { AllReader } from "../helper/all-reader";

function getIndex(row: number, col: number, rowLength: number): number {
  return row * rowLength + col;
}

const inputTest = {
  path: "test.txt",
  answer: 21,
};
const input = {
  path: "input.txt",
  answer: 1859,
};

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

    const insideVisibles = [];
    for (let row = 1; row < rows - 1; row++) {
      for (let col = 1; col < cols - 1; col++) {
        const current = forest[getIndex(row, col, cols)];
        const hasEqualOrHigherOnRow =
          rowHeights
            .get(row)!
            .filter((v) => v >= current)
            .reduce((total, val) => total + val) > 1;

        if (row == 1 && col == 3) {
          //   debugger;
        }
        const leftElts = rowHeights.get(row)?.slice(0, col);
        const rightElts = rowHeights.get(row)?.slice(col + 1);
        const topElts = colHeights.get(col)?.slice(0, row);
        const downElts = colHeights.get(col)?.slice(row + 1);
        const isLowerPredicate = (val: number) => val < current;
        const hasLower =
          leftElts?.every(isLowerPredicate) ||
          rightElts?.every(isLowerPredicate) ||
          topElts?.every(isLowerPredicate) ||
          downElts?.every(isLowerPredicate);

        const isVisible = [leftElts, rightElts, topElts, downElts]
          .filter((arr): arr is number[] => arr !== undefined)
          .map((arr) => arr.every(isLowerPredicate))
          .some(Boolean);

        if (hasLower != isVisible) {
          throw new Error(`different results ${{ hasLower, isVisible }}`);
        }
        const hasEqualOrHigherOnCol =
          colHeights
            .get(col)!
            .filter((v) => v >= current)
            .reduce((total, val) => total + val) > 1;

        if (isVisible) {
          insideVisibles.push({
            row,
            col,
            current,
          });
        }
        console.log("check cell", {
          row,
          col,
          val: current,
          leftElts,
          rightElts,
          topElts,
          downElts,
          allLower: hasLower,
          //   hasEqualOrHigherOnRow,
          //   hasEqualOrHigherOnCol,
        });
      }
    }

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        process.stdout.write(String(forest[getIndex(row, col, cols)]));
      }
      process.stdout.write("\n");
    }
    console.log({ insideVisibles });

    const totalVisible = outerVisibleCount + insideVisibles.length;
    console.log({ totalVisible });

    if (totalVisible !== input.answer) {
      throw new Error(`expected answer ${input.answer}`);
    }
  });

  r.run();
}

main(input);
