import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const re = /(?<op>noop|addx)\s*(?<value>-?\d+)?/;

class Clock {
  private _count = 1;

  private _inCycle = false;

  get inCycle() {
    return this._inCycle;
  }
  get cycle() {
    return this._count;
  }

  tick() {
    this._count++;
  }

  beginCycle() {
    this._inCycle = true;
  }

  endCycle() {
    this._count++;
    this._inCycle = false;
  }
}

class CPU {
  private _x: number = 1;

  get x() {
    return this._x;
  }
  addX(val: number) {
    this._x += val;
  }

  printSprite(): string {
    const arr = Array(CRT.cols).fill(".");

    for (let i = this.x - 1; i <= this._x + 1; i++) {
      arr[i] = "#";
    }
    return arr.join("");
  }
}

class CRT {
  private arr: string[] = Array(CRT.cols * CRT.rows).fill("");
  private index = 0;

  static cols = 40;
  static rows = 6;

  draw(x: number) {
    const virtualIndex = this.index % CRT.cols;
    const visible = Math.abs(virtualIndex - x) < 2;
    if (visible) {
      console.log("light for", {
        x,
        index: this.index,
      });
      this.arr[this.index] = "#";
    } else {
      this.arr[this.index] = ".";
    }
    this.index++;
  }

  printScreen(eraseDot = false): string {
    const arr = [...this.arr];

    if (eraseDot) {
      arr.forEach((val, index, array) => {
        if (val === ".") {
          array[index] = " ";
        }
      });
    }

    const rows: string[][] = [];
    while (arr.length > 0) {
      rows.push(arr.splice(0, CRT.cols));
    }
    return rows.map((s) => s.join("")).join("\n");
  }

  printLine(n: number) {
    return [...this.arr].slice(CRT.cols * n, CRT.cols * (n + 1)).join("");
  }
}
function main(
  filename: string,
  config?: {
    snap?: string;
    eraseDot?: boolean;
    out?: string;
  }
) {
  const lines = readFileSync(resolve(__dirname, filename), {
    encoding: "utf-8",
  }).split(/\r|\n|\r\n/);

  const clock = new Clock();
  const cpu = new CPU();
  const crt = new CRT();

  console.log({ cycle: clock.cycle, isInCycle: clock.inCycle, x: cpu.x });

  let pc = 0;

  function executeInstruction(op: string, value?: string) {
    const OP_Cycles: Record<string, number> = {
      noop: 1,
      addx: 2,
    };

    for (let i = 0; i < OP_Cycles[op]; i++) {
      clock.beginCycle();
      console.log({ cycle: clock.cycle, isInCycle: clock.inCycle, x: cpu.x });

      crt.draw(cpu.x);

      const crtLine = Math.floor((clock.cycle - 1) / CRT.cols);

      process.stdout.write(
        `crt\n${crt.printLine(crtLine)}\nsprite\n${cpu.printSprite()}\n`
      );

      clock.endCycle();

      if (value && i == OP_Cycles[op] - 1) {
        cpu.addX(Number(value));
      }

      console.log({ cycle: clock.cycle, isInCycle: clock.inCycle, x: cpu.x });
    }
  }

  while (pc < lines.length) {
    const { op, value } = lines[pc++].match(re)?.groups || {};
    executeInstruction(op, value);
  }

  const { eraseDot, snap, out } = config || {};
  const screen = crt.printScreen(eraseDot);

  console.log("screen");
  process.stdout.write(screen + "\n");

  if (out) {
    writeFileSync(resolve(__dirname, out), screen, {
      encoding: "utf-8",
    });
  }

  if (snap) {
    const snapshot = readFileSync(resolve(__dirname, snap), {
      encoding: "utf-8",
    });
    console.log("snapshot");
    process.stdout.write(snapshot + "\n");

    if (screen !== snapshot) {
      throw new Error("snapshot not matched");
    }
  }
}

main("test.txt");
main("test-2.txt", { snap: "test-2.snap.txt" });
main("input.txt", {
  eraseDot: true,
  snap: "input-snap.txt",
  out: "input-out.txt",
});
