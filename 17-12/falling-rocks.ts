import { resolve } from "path";
import { assertNumber } from "../helper/assert";
import { readLines } from "../helper/read-lines";

interface Block {
  left(): void;
  right(): void;
  down(): void;
  up(): void;
}

interface BlockInformation {
  getInfo(): {
    minCol: number;
    maxCol: number;
    minRow: number;
    maxRow: number;
  };

  getHorizontals(): Horizontal[];
  getBlockPositions(): { row: number; col: number }[];
}

interface Rock extends Block, BlockInformation {}

interface Stream {
  revert(block: Block): unknown;
  execute(b: Block): void;
}

class RightStream implements Stream {
  revert(block: Block) {
    block.left();
  }
  execute(block: Block) {
    block.right();
  }
}

class LeftStream implements Stream {
  revert(block: Block) {
    block.right();
  }
  execute(block: Block) {
    block.left();
  }
}

class Horizontal implements Rock {
  left(): void {
    this.leftCol--;
  }
  right(): void {
    this.leftCol++;
  }
  down(): void {
    this.row--;
  }

  up(): void {
    this.row++;
  }
  constructor(
    private leftCol: number,
    private row: number,
    private width = 4
  ) {}

  getHorizontals(): Horizontal[] {
    return [this];
  }

  getBlockPositions(): { row: number; col: number }[] {
    const pos = [];
    for (let col = this.leftCol; col < this.leftCol + this.width; col++) {
      pos.push({
        col,
        row: this.row,
      });
    }

    return pos;
  }
  getInfo() {
    return {
      minCol: this.leftCol,
      maxCol: this.leftCol + this.width - 1,
      minRow: this.row,
      maxRow: this.row,
    };
  }
}

class Vertical implements Rock {
  constructor(
    private col: number,
    private bottomRow: number,
    private height = 4
  ) {}

  left(): void {
    this.col--;
  }
  right(): void {
    this.col++;
  }
  down(): void {
    this.bottomRow--;
  }
  up(): void {
    this.bottomRow++;
  }

  getInfo() {
    return {
      minCol: this.col,
      maxCol: this.col,
      minRow: this.bottomRow,
      maxRow: this.bottomRow + this.height - 1,
    };
  }

  getBlockPositions(): { row: number; col: number }[] {
    const pos = [];
    for (let row = this.bottomRow; row < this.bottomRow + this.height; row++) {
      pos.push({
        col: this.col,
        row,
      });
    }

    return pos;
  }

  getHorizontals(): Horizontal[] {
    const horizontals = [];

    for (let row = this.bottomRow; row < this.bottomRow + this.height; row++) {
      horizontals.push(new Horizontal(this.col, row, 1));
    }
    return horizontals;
  }
}

abstract class CompositeRock implements Rock {
  left(): void {
    this.components.forEach((c) => c.left());
  }
  right(): void {
    this.components.forEach((c) => c.right());
  }
  down(): void {
    this.components.forEach((c) => c.down());
  }

  up(): void {
    this.components.forEach((c) => c.up());
  }

  constructor(protected components: Rock[]) {}

  getInfo(): {
    minCol: number;
    maxCol: number;
    minRow: number;
    maxRow: number;
  } {
    let minColRes = Infinity,
      minRowRes = Infinity,
      maxColRes = -Infinity,
      maxRowRes = -Infinity;
    this.components.forEach((c) => {
      const { minRow, minCol, maxCol, maxRow } = c.getInfo();
      minColRes = Math.min(minColRes, minCol);
      minRowRes = Math.min(minRowRes, minRow);

      maxColRes = Math.max(maxColRes, maxCol);
      maxRowRes = Math.max(maxRowRes, maxRow);
    });

    return {
      minCol: minColRes,
      minRow: minRowRes,
      maxCol: maxColRes,
      maxRow: maxRowRes,
    };
  }
  getHorizontals(): Horizontal[] {
    const res: Horizontal[] = [];
    this.components.forEach((c) => res.push(...c.getHorizontals()));
    return res;
  }
  getBlockPositions(): { row: number; col: number }[] {
    const res: { row: number; col: number }[] = [];
    this.components.forEach((c) => res.push(...c.getBlockPositions()));
    return res;
  }
}

class Plus extends CompositeRock {
  constructor(leftCol: number, bottomRow: number) {
    super([
      new Horizontal(leftCol, bottomRow + 1, 3),
      new Vertical(leftCol + 1, bottomRow, 3),
    ]);
  }
}

class Angle extends CompositeRock {
  constructor(leftCol: number, bottomRow: number) {
    super([
      new Horizontal(leftCol, bottomRow, 3),
      new Vertical(leftCol + 2, bottomRow, 3),
    ]);
  }
}

class Square extends CompositeRock {
  constructor(leftCol: number, bottomRow: number) {
    super([
      new Horizontal(leftCol, bottomRow, 2),
      new Horizontal(leftCol, bottomRow + 1, 2),
    ]);
  }
}

class Grid {
  private readonly width = 7;

  private horizontalsRows: Horizontal[][] = [];

  private height = 0;

  constructor(
    private streamFactory: { next(): Stream },
    private blockFactory: {
      next: (col: number, row: number) => Rock;
    }
  ) {}

  get totalHeight() {
    return this.height;
  }

  log = false;
  dropBlock() {
    const rock = this.blockFactory.next(2, this.height + 3);
    this.log && console.log("begin drop");
    this.log && console.log(this.draw(rock));

    while (true) {
      this.log && console.log("begin turn");
      this.log && console.log(this.draw(rock));

      const stream = this.streamFactory.next();
      stream.execute(rock);

      this.log && console.log("after stream", Object.getPrototypeOf(stream));
      this.log && console.log(this.draw(rock));

      if (this.checkCollide(rock)) {
        stream.revert(rock);
      }

      rock.down();

      this.log && console.log("after down");
      this.log && console.log(this.draw(rock));
      if (this.checkCollide(rock)) {
        rock.up();
        break;
      }
    }

    // merge with other rows
    const horizontals = rock.getHorizontals();
    for (let h of horizontals) {
      const { minRow: row, minCol, maxCol } = h.getInfo();

      const line = this.horizontalsRows[row];
      if (!line) {
        this.horizontalsRows[row] = [h];
      } else {
        this.horizontalsRows[row] = this.mergeHorizontals(line, h);
      }
    }

    this.height = Math.max(rock.getInfo().maxRow + 1, this.height);

    this.log && console.log("end turn");
    this.log && console.log(this.draw());
  }

  mergeHorizontals(line: Horizontal[], h: Horizontal): Horizontal[] {
    const newLine = [...line];

    const place = newLine.findIndex(
      (l) => l.getInfo().minCol > h.getInfo().minCol
    );
    if (place >= 0) {
      newLine.splice(place, 0, h);
    } else {
      newLine.push(h);
    }

    let index = 0;
    while (index < newLine.length - 1) {
      const first = newLine[index];
      const second = newLine[index + 1];
      const {
        maxCol: firstMaxCol,
        minCol: firstMinCol,
        minRow: row,
      } = first.getInfo();
      const { minCol: secondMinCol, maxCol: secondMaxCol } = second.getInfo();

      if (firstMaxCol >= secondMinCol - 1) {
        // touch or overlap

        const leftCol = Math.min(firstMinCol, secondMinCol);
        const rightCol = Math.max(firstMaxCol, secondMaxCol);
        const width = rightCol - leftCol + 1;

        const mergedHorizontal = new Horizontal(leftCol, row, width);
        newLine.splice(index, 2, mergedHorizontal);
      } else {
        index++;
      }
    }
    return newLine;
  }

  private checkCollide(rock: Rock): boolean {
    const { minCol, minRow, maxCol, maxRow } = rock.getInfo();

    if (minCol < 0 || maxCol >= this.width || minRow < 0) {
      // bound collision
      return true;
    }

    const rockHorizontals = rock.getHorizontals();
    for (let row = minRow; row <= maxRow; row++) {
      if (!this.horizontalsRows[row]) {
        continue;
      }
      const collide = this.horizontalsRows[row].some((lineH) => {
        const { minCol: lineMinCol, maxCol: lineMaxCol } = lineH.getInfo();
        return rockHorizontals.some((horizontal) => {
          const {
            minCol: hMinCol,
            minRow: horizontalRow,
            maxCol: hMaxCol,
          } = horizontal.getInfo();
          return (
            horizontalRow == row &&
            hMinCol <= lineMaxCol &&
            hMaxCol >= lineMinCol
          );
        });
      });

      if (collide == true) {
        return collide;
      }
    }
    // check wall, floor and other blocks collisions
    return false;
  }

  draw(fallingRock?: Rock): string {
    const fallingRockHeight = fallingRock?.getInfo().maxRow || -Infinity;
    const heightDisplayed = Math.max(this.height, fallingRockHeight) + 3;

    const fallingH = fallingRock?.getHorizontals();

    const lines: string[] = [...Array(heightDisplayed).keys()].map(
      (invertedRow) => {
        const index = heightDisplayed - invertedRow - 1;
        const horizontals = this.horizontalsRows[index];

        const line = Array(this.width).fill(".");

        if (horizontals) {
          for (let h of horizontals) {
            const { minCol, maxCol } = h.getInfo();
            for (let c = minCol; c <= maxCol; c++) {
              line[c] = "#";
            }
          }
        }

        if (fallingH) {
          for (let h of fallingH) {
            const { minCol, maxCol, minRow } = h.getInfo();
            if (minRow === index) {
              for (let c = minCol; c <= maxCol; c++) {
                line[c] = "@";
              }
            }
          }
        }

        return `|${line.join("")}|`;
      }
    );

    lines.push("+-------+"); // floor

    this.log && console.log({ totalHeight: this.height });
    return lines.join("\n");
  }
}

function createBlockFactory(
  ctors: Array<{ new (col: number, row: number): Rock }>
) {
  let index = 0;

  return {
    next: function (col: number, row: number): Rock {
      if (index >= ctors.length) {
        index = 0;
      }
      return new ctors[index++](col, row);
    },
  };
}

function createStreamFactory(line: string) {
  const left = new LeftStream();
  const right = new RightStream();

  function mapStream(c: string): Stream {
    if (c === ">") {
      return right;
    } else {
      return left;
    }
  }

  const streams: Stream[] = line.split("").map(mapStream);

  let index = 0;

  return {
    next: function () {
      if (index >= streams.length) {
        index = 0;
      }
      return streams[index++];
    },
  };
}

function main(filename: string, answer?: number) {
  const [line] = readLines(resolve(__dirname, filename));

  const grid = new Grid(
    createStreamFactory(line),
    createBlockFactory([Horizontal, Plus, Angle, Vertical, Square])
  );

  for (let i = 0; i < 2022; i++) {
    false && console.log("drop", i + 1);
    if (false && [5].includes(i)) {
      grid.log = true;
    }
    grid.dropBlock();
    grid.log = false;
    false && console.log(grid.draw());
    if (false && i < 9) console.log("\n\n");
  }

  console.log(grid.totalHeight);

  assertNumber(answer, grid.totalHeight);
}

main("test.txt", 3068);
console.time("part1");
main("input.txt", 3215);
console.timeEnd("part1");
