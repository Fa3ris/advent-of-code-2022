import { readFileSync } from "fs";
import { resolve } from "path";

type Point = {
  x: number;
  y: number;
};

type Beacon = Point;

function formatPoint(p: Point): string {
  return `${p.x},${p.y}`;
}

function manhattanDist(p1: Point, p2: Point) {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

class Row {
  private beacons = new Set<string>();
  private emptyPositions = new Set<string>();

  get empty() {
    return [...this.emptyPositions.values()];
  }
  constructor(private row: number, allBeacons: Beacon[]) {
    allBeacons.forEach((b) => {
      if (b.y === row) {
        this.beacons.add(formatPoint(b));
      }
    });
  }

  receive(candidates: string[]) {
    candidates.forEach((c) => {
      if (this.beacons.has(c)) {
        return;
      }
      this.emptyPositions.add(c);
    });
  }
}

class Sensor {
  private _dist: number;
  constructor(private _pos: Point, private _beacon: Beacon) {
    this._dist = manhattanDist(this._pos, this._beacon);
  }

  get dist(): number {
    return this._dist;
  }
  get pos(): Point {
    return this._pos;
  }
  get beacon(): Beacon {
    return this._beacon;
  }

  findWhereBeaconIsNot(row: number): string[] {
    const res: string[] = [];

    const projectionToRow = Math.abs(this.pos.y - row);

    const remainingDist = this.dist - projectionToRow;

    if (remainingDist < 0) {
      // did not reach row
      return [];
    }

    for (
      let x = this.pos.x - remainingDist;
      x <= this.pos.x + remainingDist;
      x++
    ) {
      res.push(formatPoint({ x, y: row }));
    }

    return res;
  }
}

const re = /x=(?<sx>-?\w+), y=(?<sy>-?\w+).*x=(?<bx>-?\w+), y=(?<by>-?\w+)/;

const l1 = "Sensor at x=2, y=18: closest beacon is at x=-2, y=15";

console.log(l1.match(re)?.groups);

const { sx, sy, bx, by } = l1.match(re)?.groups || {};

const sensor = new Sensor(
  { x: Number(sx), y: Number(sy) },
  { x: Number(bx), y: Number(by) }
);

console.log(sensor);

const targetRow = 10;
const shortedDistToRow = manhattanDist(sensor.pos, {
  x: sensor.pos.x,
  y: targetRow,
});
console.log({ shortedDistToRow });

function findAbsentBeacons(lines: string[], row: number) {
  const re = /x=(?<sx>-?\w+), y=(?<sy>-?\w+).*x=(?<bx>-?\w+), y=(?<by>-?\w+)/;

  const allBeacons: Beacon[] = [];
  const sensors: Sensor[] = [];
  for (let l of lines) {
    const { sx, sy, bx, by } = l.match(re)?.groups || {};
    const beacon = { x: Number(bx), y: Number(by) };
    allBeacons.push(beacon);
    const sensor = new Sensor({ x: Number(sx), y: Number(sy) }, beacon);
    sensors.push(sensor);
  }

  const targetRow = new Row(row, allBeacons);

  for (let sensor of sensors) {
    targetRow.receive(sensor.findWhereBeaconIsNot(row));
  }

  const res = targetRow.empty;
  res.sort((coord1, coord2) => {
    const re = /(?<x>-?\w+)/;
    const a = Number(coord1.match(re)?.groups?.x);
    const b = Number(coord2.match(re)?.groups?.x);
    return a - b;
  });
  console.log(res, res.length);

  return res.length;
}

const l2 = "Sensor at x=0, y=11: closest beacon is at x=2, y=10";
const l3 = "Sensor at x=8, y=7: closest beacon is at x=2, y=10";

findAbsentBeacons([l2, l1, l3], 10);

function main(filename: string, row: number, answer?: number) {
  const lines = readFileSync(resolve(__dirname, filename), {
    encoding: "utf-8",
  }).split(/\r|\n|\r\n/);

  const res = findAbsentBeacons(lines, row);

  if (answer && answer != res) {
    throw new Error(`expected ${answer}`);
  }
}

main("test.txt", 10, 26);

main("input.txt", 2000000, 5335787);
