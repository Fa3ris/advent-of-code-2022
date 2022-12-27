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

  toSymbol(): string;
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

  toSymbol(): string {
    return "-";
  }
}

class Vertical implements Rock {
  toSymbol(): string {
    return "|";
  }
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

  toSymbol(): string {
    throw new Error("method not implemented");
  }
}

class Plus extends CompositeRock {
  constructor(leftCol: number, bottomRow: number) {
    super([
      new Horizontal(leftCol, bottomRow + 1, 3),
      new Vertical(leftCol + 1, bottomRow, 3),
    ]);
  }

  toSymbol(): string {
    return "+";
  }
}

class Angle extends CompositeRock {
  constructor(leftCol: number, bottomRow: number) {
    super([
      new Horizontal(leftCol, bottomRow, 3),
      new Vertical(leftCol + 2, bottomRow, 3),
    ]);
  }

  toSymbol(): string {
    return "J";
  }
}

class Square extends CompositeRock {
  constructor(leftCol: number, bottomRow: number) {
    super([
      new Horizontal(leftCol, bottomRow, 2),
      new Horizontal(leftCol, bottomRow + 1, 2),
    ]);
  }
  toSymbol(): string {
    return "[]";
  }
}

class Grid {
  private readonly width = 7;

  private horizontalsRows: Horizontal[][] = [];

  private height = 0;

  constructor(
    private streamFactory: { next(): Stream; index(): number },
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

    let jetIndex = undefined;

    while (true) {
      this.log && console.log("begin turn");
      this.log && console.log(this.draw(rock));

      const stream = this.streamFactory.next();
      if (jetIndex == undefined) {
        jetIndex = this.streamFactory.index();
      }
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

    const prevHeight = this.height;
    this.height = Math.max(rock.getInfo().maxRow + 1, this.height);

    const heightGained = this.height - prevHeight;

    this.log && console.log("end turn");
    this.log && console.log(this.draw());

    return {
      heightGained,
      jetIndex,
      rock: rock.toSymbol(),
      profile: this.drawProfile(),
    };
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

  // use height arg big enough to discriminate well
  drawProfile(height = 10): string {
    const maxRow = Math.max(height, this.height);

    const minRow = maxRow - height;

    const lines: string[] = [];
    for (let i = maxRow; i >= minRow; i--) {
      const horizontals = this.horizontalsRows[i];

      const line: string[] = Array(this.width).fill(".");

      if (horizontals) {
        for (let h of horizontals) {
          const { minCol, maxCol } = h.getInfo();
          for (let c = minCol; c <= maxCol; c++) {
            line[c] = "#";
          }
        }
      }

      lines.push(`|${line.join("")}|`);
    }
    return lines.join("\n");
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

  let currentIndex = 0;
  return {
    next: function () {
      if (index >= streams.length) {
        index = 0;
      }
      currentIndex = index;
      return streams[index++];
    },
    index: function () {
      return currentIndex;
    },
  };
}

function createGrid(line: string): Grid {
  return new Grid(
    createStreamFactory(line),
    createBlockFactory([Horizontal, Plus, Angle, Vertical, Square])
  );
}

function main(filename: string, answer?: number) {
  const [line] = readLines(resolve(__dirname, filename));

  const grid = createGrid(line);

  const states: State[] = [];

  for (let i = 0; i < 2022; i++) {
    false && console.log("drop", i + 1);
    if (false && [5].includes(i)) {
      grid.log = true;
    }
    const state = grid.dropBlock();

    states.push(state);

    // console.log(state);
    // console.log(state.profile);

    if (i == 6) {
      console.assert(
        !equalState(states[0], states[1]),
        "states should be different"
      );
      console.assert(
        equalState(states[0], states[0]),
        "state should be the same"
      );
      process.exit();
    }
    grid.log = false;
    false && console.log(grid.draw());
    if (false && i < 9) console.log("\n\n");
  }

  console.log(grid.totalHeight);

  assertNumber(answer, grid.totalHeight);
}

function main2(filename: string, dropsToMake = 2022, answer?: number) {
  const [line] = readLines(resolve(__dirname, filename));

  const gridTortoise = createGrid(line);
  const gridHare = createGrid(line);

  // for (let i = 0; i < 2022; i++) {
  //   console.log("drop", i);
  //   const tortoiseState = gridTortoise.dropBlock();

  //   gridHare.dropBlock();
  //   const hareState = gridHare.dropBlock();

  //   if (equalState(tortoiseState, hareState)) {
  //     console.log({ tortoiseState, hareState, drop: i });
  //     console.log(tortoiseState.profile);
  //     break;
  //   }
  // }

  let tortoiseState: State;
  let hareState: State;
  let drops = 0;
  while (true) {
    drops++;
    tortoiseState = gridTortoise.dropBlock();

    gridHare.dropBlock();
    hareState = gridHare.dropBlock();

    // if (drops == 1) {
    //   console.log(gridTortoise.drawProfile());
    //   console.log("\n\n");
    // }

    if (equalState(tortoiseState, hareState)) {
      // console.log({ tortoiseState, hareState, drop: drops });
      // console.log(tortoiseState.profile);
      break;
    } else {
    }
  }

  console.log("drops to repeat", drops);
  console.log(gridTortoise.drawProfile());
  console.log(gridHare.drawProfile());

  let startOfLoopIndex = 0;
  const tortoiseGridForMu = createGrid(line); // start from beginning
  let tortoiseStateForMu: State;

  while (true) {
    tortoiseStateForMu = tortoiseGridForMu.dropBlock();
    hareState = gridHare.dropBlock();

    startOfLoopIndex++;
    if (equalState(tortoiseStateForMu, hareState)) {
      break;
    }
  }

  let cycleLength = 1;
  const tortoiseStateAtStartOfLoop = tortoiseStateForMu;
  console.log({ tortoiseStateAtStartOfLoop });
  tortoiseState = tortoiseGridForMu.dropBlock();
  while (!equalState(tortoiseState, tortoiseStateAtStartOfLoop)) {
    tortoiseState = tortoiseGridForMu.dropBlock();
    cycleLength++;
  }

  console.log({
    startOfLoopIndex,
    cycleLength,
  });

  const testGrid = createGrid(line);
  let startOfLoopState: State | undefined = undefined;

  for (let i = 0; i < startOfLoopIndex; i++) {
    startOfLoopState = testGrid.dropBlock();
  }

  let firstCycleLoopState: State | undefined = undefined;

  for (let i = 0; i < cycleLength; i++) {
    firstCycleLoopState = testGrid.dropBlock();
  }

  console.log({
    startOfLoopState,
    firstCycleLoopState,
  });

  const compare1 = createGrid(line);
  const compare2 = createGrid(line);

  let compare1State: State | undefined = undefined;
  let compare2State: State | undefined = undefined;

  for (let i = 0; i < startOfLoopIndex; i++) {
    compare1State = compare1.dropBlock();
  }

  for (let i = 0; i < startOfLoopIndex + cycleLength; i++) {
    compare2State = compare2.dropBlock();
  }

  console.log({ compare1State, compare2State });

  if (!compare1State || !compare2State) {
    return;
  }

  if (!equalState(compare1State, compare2State)) {
    throw new Error("unequal");
  }
  for (let i = 0; i < cycleLength; i++) {
    compare1State = compare1.dropBlock();
    compare2State = compare2.dropBlock();

    if (!equalState(compare1State, compare2State)) {
      throw new Error("unequal");
    }
  }

  const finalGrid = createGrid(line);

  let heightOfGrid = 0;
  for (let i = 0; i < startOfLoopIndex; i++) {
    heightOfGrid += finalGrid.dropBlock().heightGained;
  }

  let gainedHeightForOneCycle = 0;

  let finalState: State;
  for (let i = 0; i < cycleLength; i++) {
    finalState = finalGrid.dropBlock();
    gainedHeightForOneCycle += finalState.heightGained;
  }

  console.log({ gainedHeightForOneCycle });

  const dropsRemainingAtBeginningOfLoop = dropsToMake - startOfLoopIndex;
  const numberOfCycles = Math.floor(
    dropsRemainingAtBeginningOfLoop / cycleLength
  );
  const dropsLeftOver = dropsRemainingAtBeginningOfLoop % cycleLength;

  console.log({
    dropsRemainingAtBeginningOfLoop,
    numberOfCycles,
    dropsLeftOver,
  });
  for (let i = 0; i < dropsLeftOver; i++) {
    heightOfGrid += finalGrid.dropBlock().heightGained;
  }
  console.log({
    heightOfGrid,
    gridTotalHeight: finalGrid.totalHeight - gainedHeightForOneCycle,
    totalHeightForAllCycles: numberOfCycles * gainedHeightForOneCycle,
    totalHeightAnswer: heightOfGrid + numberOfCycles * gainedHeightForOneCycle,
  });
}

if (false) {
  main("test.txt", 3068);
  console.time("part1");
  main("input.txt", 3215);
  console.timeEnd("part1");
}

main2("test.txt", 2022, 3068);
main2("input.txt", 2022, 3215);

main2("test.txt", 1000000000000, 1514285714288);
main2("input.txt", 1000000000000, 1514285714288);

type State = {
  heightGained: number;
  jetIndex: number;
  rock: string;
  profile: string;
};

function equalState(s1: State, s2: State): boolean {
  const allEqual = Object.getOwnPropertyNames(s1).every((name) => {
    const v1 = Object.getOwnPropertyDescriptor(s1, name)?.value;
    const v2 = Object.getOwnPropertyDescriptor(s2, name)?.value;
    return v1 === v2;
  });

  return allEqual;
}
