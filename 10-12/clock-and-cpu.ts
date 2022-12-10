import { cp, readFileSync } from "fs";
import { resolve } from "path";

const re = /(?<op>noop|addx)\s*(?<value>-?\d+)?/;

class Clock {
  private _count = 1;

  private _inCycle = false;

  get inCycle() {
    return this._inCycle;
  }

  tick() {
    this._count++;
  }
  get cycle() {
    return this._count;
  }

  beginCycle() {
    this._inCycle = true;
  }

  endCycle() {
    this._count++;
    this._inCycle = false;
  }

  private halfCycle() {
    this._count += 0.5;
  }
}

const OP_Cycles = {
  noop: 1,
  addx: 2,
};

class CPU {
  private _x: number = 1;

  private clock;
  constructor(clock: Clock) {
    this.clock = clock;
  }

  get x() {
    return this._x;
  }
  addX(val: number) {
    this._x += val;
  }
}
function main(filename: string, answer?: number) {
  const lines = readFileSync(resolve(__dirname, filename), {
    encoding: "utf-8",
  }).split(/\r|\n|\r\n/);

  const clock = new Clock();
  const cpu = new CPU(clock);

  console.log({ cycle: clock.cycle, isInCycle: clock.inCycle, x: cpu.x });

  let pc = 0;

  const targetCycles = [20, 60, 100, 140, 180, 220];

  const measures = [];
  while (pc < lines.length) {
    const { op, value } = lines[pc++].match(re)?.groups || {};

    if (op === "noop") {
      console.log(op);

      {
        clock.beginCycle();
        console.log({ cycle: clock.cycle, isInCycle: clock.inCycle, x: cpu.x });

        if (targetCycles.includes(clock.cycle)) {
          console.log("signal strength", {
            cycle: clock.cycle,
            x: cpu.x,
            strength: clock.cycle * cpu.x,
          });

          measures.push({
            cycle: clock.cycle,
            x: cpu.x,
            strength: clock.cycle * cpu.x,
          });
        }

        clock.endCycle();
        console.log({ cycle: clock.cycle, isInCycle: clock.inCycle, x: cpu.x });
      }
    } else if (op === "addx") {
      console.log(op, value);
      {
        clock.beginCycle();
        console.log({ cycle: clock.cycle, isInCycle: clock.inCycle, x: cpu.x });

        if (targetCycles.includes(clock.cycle)) {
          console.log("signal strength", {
            cycle: clock.cycle,
            x: cpu.x,
            strength: clock.cycle * cpu.x,
          });
          measures.push({
            cycle: clock.cycle,
            x: cpu.x,
            strength: clock.cycle * cpu.x,
          });
        }

        clock.endCycle();
        console.log({ cycle: clock.cycle, isInCycle: clock.inCycle, x: cpu.x });
      }

      {
        clock.beginCycle();
        console.log({ cycle: clock.cycle, isInCycle: clock.inCycle, x: cpu.x });

        if (targetCycles.includes(clock.cycle)) {
          console.log("signal strength", {
            cycle: clock.cycle,
            x: cpu.x,
            strength: clock.cycle * cpu.x,
          });
          measures.push({
            cycle: clock.cycle,
            x: cpu.x,
            strength: clock.cycle * cpu.x,
          });
        }
        clock.endCycle();
        cpu.addX(Number(value));
        console.log({ cycle: clock.cycle, isInCycle: clock.inCycle, x: cpu.x });
      }
    }
  }

  console.log(measures);
  const total = measures.reduce((acc, m) => acc + m.strength, 0);
  console.log({ total });

  if (answer && answer != total) {
    throw new Error(`expected ${answer}`);
  }
}

main("test.txt");
main("test-2.txt", 13140);
main("input.txt");
