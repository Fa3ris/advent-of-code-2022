import { open, openSync, readFileSync, writeFileSync } from "fs";
import { basename, resolve } from "path";

const re = /(?<dir>\w) (?<steps>\d+)/;

class Knot {
  private _saveHistory: boolean;
  constructor(
    saveHistory: boolean = false,
    private _x = 0,
    private _y = 0,
    private _lastPos = { x: 0, y: 0 },
    private _history = new Set<string>()
  ) {
    this._saveHistory = saveHistory;
    this.savePos();
  }

  get x() {
    return this._x;
  }

  get y() {
    return this._y;
  }

  get lastPos() {
    return { ...this._lastPos };
  }

  get pos() {
    return { x: this._x, y: this._y };
  }

  private saveLast() {
    this._lastPos.x = this._x;
    this._lastPos.y = this._y;
  }

  left() {
    this.saveLast();
    this._x--;
  }

  rigth() {
    this.saveLast();
    this._x++;
  }

  up() {
    this.saveLast();
    this._y++;
  }

  down() {
    this.saveLast();
    this._y--;
  }

  resolve(knot: Knot) {
    this.saveLast();
    if (this._x === knot.x && this._y === knot.y) {
      console.log("same cell");
      // same cell
      return;
    }

    if (this._x === knot.x) {
      // row is different
      if (this.dist(this._x, this._y, knot.x, knot.y) <= 1) {
        console.log("different row - close");
        return;
      }
      if (this._y > knot.y) {
        console.log("different row - move down");
        this._y--;
      } else {
        console.log("different row - move up");
        this._y++;
      }
      this.savePos();
    } else if (this._y === knot.y) {
      // col is different
      if (this.dist(this._x, this._y, knot.x, knot.y) <= 1) {
        console.log("different col - close");

        return;
      }
      if (this._x > knot.x) {
        console.log("different col - move left");
        this._x--;
      } else {
        console.log("different col - move right");
        this._x++;
      }
      this.savePos();
    } else {
      // different row AND col
      if (this.dist(this._x, this._y, knot.x, knot.y) <= 2) {
        // diagonal
        console.log("diagonal - close");
        return;
      }
      console.log("too far - go to head last pos");
      const signX = Math.sign(knot.x - this._x);
      // const moveX = Math.abs(knot.x - this.x);
      const signY = Math.sign(knot.y - this._y);
      // const moveY = Math.abs(knot.y - this.y);

      // this._x = knot.lastPos.x;
      // this._y = knot.lastPos.y;
      this._x += signX;
      this._y += signY;
      this.savePos();
    }
  }

  get uniquePositions() {
    return this._history.size;
  }

  dist(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  }

  savePos() {
    if (!this._saveHistory) {
      return;
    }
    console.log("save", { x: this._x, y: this._y });
    this._history.add(`${this._x},${this._y}`);
  }
}

function main2(
  path: string,
  config: {
    baseX: number;
    baseY: number;
    rows: number;
    cols: number;
    printAfterEachResolve?: boolean;
    printAfterOneInstruction?: boolean;
    printAfterInstructionFinished?: boolean;
    print?: boolean;
  },
  answer?: number
) {
  const lines = readFileSync(resolve(__dirname, path), {
    encoding: "utf-8",
  }).split(/\r|\n|\r\n/);

  const rope = [...Array(9).keys()].map((_) => new Knot());
  const tail = new Knot(true);
  rope.push(tail);

  console.log(rope.length);

  const outfile = basename(path, ".txt") + "-out.txt";
  console.log(outfile);
  const fd = openSync(resolve(__dirname, outfile), "w");

  console.log(lines);
  for (let line of lines) {
    const match = line.match(re);
    const { dir, steps } = match?.groups || {};
    console.group({ dir, steps });
    writeFileSync(fd, JSON.stringify({ dir, steps }) + "\n", {
      encoding: "utf-8",
    });

    let n = Number(steps);
    while (n > 0) {
      n--;
      switch (dir) {
        case "U":
          rope[0].up();
          break;
        case "L":
          rope[0].left();
          break;
        case "D":
          rope[0].down();
          break;
        case "R":
          rope[0].rigth();
          break;
      }
      for (let i = 1; i < rope.length; i++) {
        rope[i].resolve(rope[i - 1]);

        if (config.print && config.printAfterEachResolve) {
          const output = printRope(rope, config);
          writeFileSync(fd, output + "\n\n", {
            encoding: "utf-8",
          });
        }
        // printRope(rope, { baseX: 0, baseY: -4, rows: 5, cols: 6 });
      }
      if (config.print && config.printAfterOneInstruction) {
        const output = printRope(rope, config);
        writeFileSync(fd, output + "\n\n", {
          encoding: "utf-8",
        });
      }
    }

    if (config.print && config.printAfterInstructionFinished) {
      const output = printRope(rope, config);
      writeFileSync(fd, output + "\n\n", {
        encoding: "utf-8",
      });
    }
    // const output = rope
    //   .map(
    //     (k, index) => `${index === 0 ? "H" : index} ${JSON.stringify(k.pos)}`
    //   )
    //   .join("\n");
    // writeFileSync(fd, output + "\n\n", {
    //   encoding: "utf-8",
    // });
    console.groupEnd();
    console.log("\n");
  }
  console.log("unique positions", tail.uniquePositions);
  if (answer && answer != tail.uniquePositions) {
    throw new Error(`expected ${answer}`);
  }
}

function printRope(
  rope: Knot[],
  config: {
    rows: number;
    cols: number;
    baseX: number;
    baseY: number;
  }
): string {
  const { rows, cols, baseX, baseY } = config;
  const arr: string[] = Array(rows * cols).fill(".");
  console.log(arr);

  function findIndex(row: number, col: number, cols: number) {
    return row * cols + col;
  }

  let index = -1;
  for (let knot of rope) {
    index++;
    const row = baseY - knot.y;
    const col = baseX + knot.x;

    const i = findIndex(row, col, cols);
    if (arr[i] === ".") {
      arr[i] = index === 0 ? "H" : String(index);
    }
  }

  const startIndex = findIndex(baseY, baseX, cols);
  if (arr[startIndex] === ".") {
    arr[startIndex] = "S";
  }

  const res: string[][] = [];
  while (arr.length > 0) {
    res.push(arr.splice(0, cols));
  }

  console.log(res);
  return res.map((s) => s.join("")).join("\n");
}

// printRope([], { baseX: 0, baseY: 4, rows: 5, cols: 6 });

// main2("test.txt", { baseX: 0, baseY: -4, rows: 5, cols: 6 }, 1);
main2(
  "test-2.txt",
  {
    baseX: 11,
    baseY: 15,
    rows: 21,
    cols: 26,
    printAfterInstructionFinished: true,
    print: true,
  },
  36
);

main2("input.txt", {
  baseX: 11,
  baseY: 15,
  rows: 21,
  cols: 26,
  printAfterInstructionFinished: true,
  print: false,
});

// main2("input.txt", 6354);
