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

  get emptyAndBeacon() {
    return [...this.empty, ...this.beacons.values()];
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

function createBeaconsAndSensors(lines: string[]): {
  beacons: Beacon[];
  sensors: Sensor[];
} {
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

  return {
    beacons: allBeacons,
    sensors,
  };
}
function findAbsentBeacons(lines: string[], row: number) {
  const re = /x=(?<sx>-?\w+), y=(?<sy>-?\w+).*x=(?<bx>-?\w+), y=(?<by>-?\w+)/;

  const { beacons: allBeacons, sensors } = createBeaconsAndSensors(lines);

  const targetRow = new Row(row, allBeacons);

  for (let sensor of sensors) {
    targetRow.receive(sensor.findWhereBeaconIsNot(row));
  }

  const res = targetRow.empty;
  res.sort(pointStringSorter);
  console.log(res, res.length);

  return res.length;
}

function pointStringSorter(coord1: string, coord2: string) {
  const re = /(?<x>-?\d+)/;
  const a = Number(coord1.match(re)?.groups?.x);
  const b = Number(coord2.match(re)?.groups?.x);
  return a - b;
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

function createPointCoordFilter(lower: number, upper: number) {
  const re = /(?<x>-?\d+),(?<y>-?\d+)/;

  return (coord: string) => {
    const { x, y } = coord.match(re)?.groups || {};
    const xVal = Number(x);
    const yVal = Number(y);

    return xVal >= lower && xVal <= upper && yVal >= lower && yVal <= upper;
  };
}

function main2(
  filename: string,
  lowerBound: number,
  upperBound: number,
  answer?: number
) {
  const lines = readFileSync(resolve(__dirname, filename), {
    encoding: "utf-8",
  }).split(/\r|\n|\r\n/);

  const { beacons: allBeacons, sensors } = createBeaconsAndSensors(lines);

  const targetRows: Row[] = [];

  for (let row = lowerBound; row <= upperBound; row++) {
    const targetRow = new Row(row, allBeacons);
    targetRows.push(targetRow);
    console.log("check row", row);
    for (let sensor of sensors) {
      targetRow.receive(sensor.findWhereBeaconIsNot(row));
    }
  }

  const emptiesFilter = createPointCoordFilter(lowerBound, upperBound);

  const emptiesAndBeacons = targetRows.map((r) => r.emptyAndBeacon);
  emptiesAndBeacons.forEach((e, index, arr) => {
    e.sort(pointStringSorter);
    console.log(e, e.length);

    arr[index] = e.filter(emptiesFilter);
  });

  emptiesAndBeacons.forEach((e, index, arr) => {
    console.log(e, e.length);
  });

  const expectedCount = upperBound - lowerBound + 1;
  console.log({ expectedCount });

  const rowWithBeacon = emptiesAndBeacons.find(
    (list) => list.length < expectedCount
  );

  if (!rowWithBeacon) {
    throw new Error("no row found");
  }

  console.log({ rowWithBeacon });
  const reY = /,(?<y>-?\d+)/;
  const reX = /(?<x>-?\d+)/;
  const { y } = rowWithBeacon[0].match(reY)?.groups || {};
  let searchedX;
  for (let i = lowerBound; i < upperBound; i++) {
    const { x: xString } = rowWithBeacon[i].match(reX)?.groups || {};
    const x = Number(xString);

    if (x !== i) {
      searchedX = i;
      break;
    }
  }

  if (!searchedX) {
    throw new Error("no x found");
  }

  console.log({ y });
  console.log({ searchedX });

  const tuningFreq = searchedX * 4000000 + Number(y);

  console.log({ tuningFreq });

  if (answer && answer != tuningFreq) {
    throw new Error(`expected ${answer}`);
  }
}

main("test.txt", 10, 26);
// main("input.txt", 2000000, 5335787);
main2("test.txt", 0, 20, 56000011);
// main2("input.txt", 0, 4000000);

