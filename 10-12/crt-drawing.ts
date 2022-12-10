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

  printLine(): string {
    const arr = Array(40).fill(".");

    for (let i = this.x - 1; i <= this._x + 1; i++) {
      arr[i] = "#";
    }
    return arr.join("");
  }
}

class CRT {
  private arr: string[] = Array(40 * 6).fill("");
  private index = 0;

  draw(x: number) {
    const virtualIndex = this.index % 40;
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

    const res: string[][] = [];
    while (arr.length > 0) {
      res.push(arr.splice(0, 40));
    }

    console.log(res);
    return res.map((s) => s.join("")).join("\n");
  }

  printLine(n: number) {
    const arr = [...this.arr];
    return arr.slice(40 * n, 40).join("");
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

  while (pc < lines.length) {
    const { op, value } = lines[pc++].match(re)?.groups || {};

    if (op === "noop") {
      console.log(op);

      {
        clock.beginCycle();
        console.log({ cycle: clock.cycle, isInCycle: clock.inCycle, x: cpu.x });

        crt.draw(cpu.x);

        const crtLine = Math.floor(clock.cycle / 40);

        process.stdout.write(
          `crt\n${crt.printLine(crtLine)}\ncpu\n${cpu.printLine()}\n`
        );

        clock.endCycle();
        console.log({ cycle: clock.cycle, isInCycle: clock.inCycle, x: cpu.x });
      }
    } else if (op === "addx") {
      console.log(op, value);
      {
        clock.beginCycle();
        console.log({ cycle: clock.cycle, isInCycle: clock.inCycle, x: cpu.x });

        crt.draw(cpu.x);

        const crtLine = Math.floor(clock.cycle / 40);

        process.stdout.write(
          `crt\n${crt.printLine(crtLine)}\ncpu\n${cpu.printLine()}\n`
        );

        clock.endCycle();
        console.log({ cycle: clock.cycle, isInCycle: clock.inCycle, x: cpu.x });
      }

      {
        clock.beginCycle();
        console.log({ cycle: clock.cycle, isInCycle: clock.inCycle, x: cpu.x });

        crt.draw(cpu.x);

        const crtLine = Math.floor(clock.cycle / 40);

        process.stdout.write(
          `crt\n${crt.printLine(crtLine)}\ncpu\n${cpu.printLine()}\n`
        );

        clock.endCycle();
        cpu.addX(Number(value));
        console.log({ cycle: clock.cycle, isInCycle: clock.inCycle, x: cpu.x });
      }
    }
  }

  console.log(crt.printScreen());

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
