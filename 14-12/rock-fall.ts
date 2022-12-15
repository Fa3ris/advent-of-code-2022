import { readFileSync, writeFileSync } from "fs";
import { basename, resolve } from "path";

type Col = number;
type Row = number;

type Coord = [Col, Row];

const LOG = false;

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

function hasObstacle(
  coords: Coord,
  columns: Map<Col, Set<Row>>,
  floorRow?: Row
): boolean {
  const [col, row] = coords;
  if (floorRow !== undefined && floorRow === row) {
    return true;
  }
  const obstacles = columns.get(col);
  return !!obstacles?.has(row);
}
function placeRock(
  coords: Coord,
  columns: Map<Col, Set<Row>>,
  floorRow?: Row
): Coord | undefined {
  const [col, row] = coords;

  LOG && console.log("place rock at", { coords });

  let obstacles = columns.get(col);

  if (floorRow) {
    // always put obstacle at floorRow
    if (!obstacles) {
      obstacles = new Set<Row>();
      columns.set(col, obstacles);
    }
    obstacles.add(floorRow);
  }

  if (!obstacles) {
    console.log("cannot place rock - no obstacle");
    return undefined; // cannot come to rest
  }

  if (!hasObstacle([col, row], columns, floorRow)) {
    LOG && console.log("go down");
    let minRow = Infinity;
    for (let obstacle of obstacles.values()) {
      if (obstacle > row) {
        minRow = Math.min(minRow, obstacle);
      }
    }
    if (minRow === Infinity) {
      console.log("cannot place rock - free fall");
      return undefined; // cannot come to rest
    }
    return placeRock([col, minRow], columns, floorRow);
  } else if (!hasObstacle([col - 1, row], columns, floorRow)) {
    LOG && console.log("go left");
    return placeRock([col - 1, row], columns, floorRow);
  } else if (!hasObstacle([col + 1, row], columns, floorRow)) {
    LOG && console.log("go right");
    return placeRock([col + 1, row], columns, floorRow);
  }

  if (row - 1 < 0) {
    console.log("cannot place rock - forbidden position");
    return undefined;
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
    // console.log("rock placed at", { place });
    count++;
  }

  console.log({ count });

  if (answer && answer != count) {
    throw new Error(`expected ${answer}`);
  }
}

function main2(filename: string, answer?: number) {
  const lines = readFileSync(resolve(__dirname, filename), {
    encoding: "utf-8",
  }).split(/\r|\n|\r\n/);

  const columns = new Map<Col, Set<Row>>();

  let maxRow = -Infinity;

  for (let line of lines) {
    const coords = parse(line);
    coords.forEach((val) => {
      maxRow = Math.max(maxRow, val[1]);
    });
    setRocks(coords, columns);
  }

  console.log(columns);
  console.log({ maxRow });

  const floorRow = maxRow + 2;

  const originalColumns = new Map<Col, Set<Row>>();

  Array.from(columns.entries()).forEach(([col, obstacles]) => {
    originalColumns.set(col, new Set(Array.from(obstacles)));
  });

  let count = 0;
  let place: Coord | undefined;

  const places: Coord[] = [];
  while ((place = placeRock([500, 0], columns, floorRow)) != undefined) {
    // console.log("rock placed at", { place });
    places.push(place);
    count++;
    if (place[0] === 500 && place[1] === 0) {
      console.log("placed rock at beginning");
      break;
    }
  }

  console.log(places);
  console.log({ count });
  console.log(originalColumns);

  const gridString = drawGrid(originalColumns, places, floorRow);

  writeFileSync(
    resolve(__dirname, basename(filename, ".txt") + "-snap.2.txt"),
    gridString,
    {
      encoding: "utf-8",
    }
  );

  console.log(places);
  console.log({ count });

  if (answer && answer != count) {
    throw new Error(`expected ${answer}`);
  }
}

function drawGrid(
  originalColumns: Map<Col, Set<Row>>,
  places: Coord[],
  floorRow?: number
) {
  let minCol = Infinity;

  let maxCol = -Infinity;
  let minRow = Infinity;
  let maxRow = -Infinity;

  Array.from(originalColumns.entries()).forEach(([col, rows]) => {
    minCol = Math.min(minCol, col);
    maxCol = Math.max(maxCol, col);
    Array.from(rows.values()).forEach((row) => {
      minRow = Math.min(minRow, row);
      maxRow = Math.max(maxRow, row);
    });
  });

  places.forEach(([col, row]) => {
    minCol = Math.min(minCol, col);
    maxCol = Math.max(maxCol, col);
    minRow = Math.min(minRow, row);
    maxRow = Math.max(maxRow, row);
  });

  minCol -= 2;
  maxCol += 2;

  minRow = Math.min(minRow, 0);

  console.log("max row before floor", maxRow);

  maxRow = Math.max(maxRow, floorRow ?? 0);

  const mostLeft = places.find(([col, row]) => col === 489);
  const mostRight = places.find(([col, row]) => col === 511);
  console.log({
    mostLeft,
    mostRight,
  });

  console.log({ minRow, maxRow, minCol, maxCol });

  const grid: string[][] = new Array(maxRow - minRow + 1);
  for (let i = 0; i < grid.length; ++i) {
    grid[i] = Array(maxCol - minCol + 1).fill(".");
  }

  console.log(originalColumns);
  Array.from(originalColumns.entries()).forEach(([col, rows]) => {
    console.log([...rows.values()]);
    Array.from(rows.values()).forEach((row) => {
      grid[row][col - minCol] = "#";
    });
  });

  places.forEach(([col, row]) => {
    grid[row][col - minCol] = "o";
  });

  for (let i = 0; i < grid[0].length; ++i) {
    grid[maxRow][i] = "#";
  }

  const gridString = grid.map((col) => col.join("")).join("\n");

  console.log(gridString);

  return gridString;
}

main("test.txt", 24);
main("input.txt", 1061);
main2("test.txt", 93);
main2("input.txt", 25055);
