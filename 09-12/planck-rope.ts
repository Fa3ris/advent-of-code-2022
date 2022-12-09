import { readFileSync } from "fs";
import { resolve } from "path";

const re = /(?<dir>\w) (?<steps>\d+)/;

type Point = {
  x: number;
  y: number;
};
class Head {
  constructor(
    private _x = 0,
    private _y = 0,
    private _lastPos = { x: 0, y: 0 }
  ) {}

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
}

class Tail {
  constructor(
    private _x = 0,
    private _y = 0,
    private _history = new Set<string>()
  ) {
    this.save();
  }

  get pos() {
    return { x: this._x, y: this._y };
  }

  resolve(head: Head) {
    head.x;
    head.y;
    head.lastPos;
    if (this._x === head.x && this._y === head.y) {
      console.log("same cell");
      // same cell
      return;
    }

    if (this._x === head.x) {
      // row is different
      if (this.dist(this._x, this._y, head.x, head.y) <= 1) {
        console.log("different row - close");
        return;
      }
      if (this._y > head.y) {
        console.log("different row - move down");
        this._y--;
      } else {
        console.log("different row - move up");
        this._y++;
      }
      this.save();
    } else if (this._y === head.y) {
      // col is different
      if (this.dist(this._x, this._y, head.x, head.y) <= 1) {
        console.log("different col - close");

        return;
      }
      if (this._x > head.x) {
        console.log("different col - move left");
        this._x--;
      } else {
        console.log("different col - move right");
        this._x++;
      }
      this.save();
    } else {
      // different row AND col
      if (this.dist(this._x, this._y, head.x, head.y) <= 2) {
        // diagonal
        console.log("diagonal - close");
        return;
      }
      console.log("too far - go to head last pos");
      this._x = head.lastPos.x;
      this._y = head.lastPos.y;
      this.save();
    }
  }

  get uniquePositions() {
    return this._history.size;
  }

  dist(x1: number, y1: number, x2: number, y2: number): number {
    return Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
  }

  save() {
    console.log("save", { x: this._x, y: this._y });
    this._history.add(`${this._x},${this._y}`);
  }
}

function main(path: string, answer?: number) {
  const lines = readFileSync(resolve(__dirname, path), {
    encoding: "utf-8",
  }).split(/\r|\n|\r\n/);

  const head = new Head();
  const tail = new Tail();
  tail.resolve(head);
  console.log(lines);
  for (let line of lines) {
    const match = line.match(re);
    const { dir, steps } = match?.groups || {};
    console.group({ dir, steps });

    let n = Number(steps);
    while (n > 0) {
      n--;
      switch (dir) {
        case "U":
          head.up();
          break;
        case "L":
          head.left();
          break;
        case "D":
          head.down();
          break;
        case "R":
          head.rigth();
          break;
      }
      tail.resolve(head);

      console.log("head", head.pos, "tail", tail.pos, "\n");
    }
    console.groupEnd();
    console.log("\n");
  }
  console.log("unique positions", tail.uniquePositions);
  if (answer && answer != tail.uniquePositions) {
    throw new Error(`expected ${answer}`);
  }
}

main("test.txt", 13);
main("input.txt", 6354);
