import { readFileSync } from "fs";
import { resolve } from "path";

type Col = number;
type Row = number;

type Coord = [Col, Row];

function parse(line: string): Array<Coord> {
  const matches = line.matchAll(/(?<col>\w+),(?<row>\w+)/g);

  const points: Array<Coord> = [];
  for (let m of matches) {
    points.push([Number(m.groups?.col), Number(m.groups?.row)]);
  }

  const coords: Array<Coord> = [];
  for (let i = 0; i < points.length - 1; i++) {
    const [col1, row1] = points[i];
    const [col2, row2] = points[i + 1];

    if (col1 === col2) {
      // vertical line
      const min = Math.min(row1, row2);
      const max = Math.max(row1, row2);
      for (let j = min; j <= max; j++) {
        coords.push([col1, j]);
      }
    } else {
      // horizontal line
      const min = Math.min(col1, col2);
      const max = Math.max(col1, col2);
      for (let j = min; j <= max; j++) {
        coords.push([j, row1]);
      }
    }
  }
  return coords;
}

function setRocks(coords: Array<Coord>, columns: Map<Col, Set<Row>>) {
  for (let coord of coords) {
    const [col, row] = coord;
    let rows = columns.get(col);
    if (!rows) {
      rows = new Set();
      columns.set(col, rows);
    }
    rows.add(row);
  }
}

function hasObstacle(coords: Coord, columns: Map<Col, Set<Row>>): boolean {
  const [col, row] = coords;
  const obstacles = columns.get(col);
  return !!obstacles?.has(row);
}
function placeRock(
  coords: Coord,
  columns: Map<Col, Set<Row>>
): Coord | undefined {
  const [col, row] = coords;

  console.log("place rock at", { coords });
  const obstacles = columns.get(col);
  if (!obstacles) {
    console.log("cannot place rock - no obstacle");
    return undefined;
  } // cannot come to rest

  if (!hasObstacle(coords, columns)) {
    console.log("go down");
    return placeRock([col, row + 1], columns);
  } else if (!hasObstacle([col - 1, row], columns)) {
    console.log("go left");
    return placeRock([col - 1, row], columns);
  } else if (!hasObstacle([col + 1, row], columns)) {
    console.log("go right");
    return placeRock([col + 1, row], columns);
  }

  // cannot go further - place rock here
  console.log("cannot place rock - path is blocked");
  obstacles.add(row - 1);
  return [col, row - 1];
}

function main(filename: string, answer?: number) {
  const lines = readFileSync(resolve(__dirname, filename), {
    encoding: "utf-8",
  }).split(/\r|\n|\r\n/);

  const columns = new Map<Col, Set<Row>>();

  for (let line of lines) {
    setRocks(parse(line), columns);
  }

  console.log(columns);

  let count = 0;
  let place: Coord | undefined;

  while ((place = placeRock([500, 0], columns)) != undefined) {
    console.log("rock placed at", { place });
    count++;
  }

  console.log({ count });

  if (answer && answer != count) {
    throw new Error(`expected ${answer}`);
  }
}

main("test.txt", 24);
// main("input.txt", 1061);
