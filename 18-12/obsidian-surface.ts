import { resolve } from "path";
import { assertNumber } from "../helper/assert";
import { readLines } from "../helper/read-lines";

const positionRE = /(?<x>\d+),(?<y>\d+),(?<z>\d+)/;
const sidesPerCube = 6;
const sidesToDeductWhenAdjacent = 2;

function main(filename: string, answer?: number) {
  const lines = readLines(resolve(__dirname, filename));

  const occupiedPositions = new Set<string>();

  let sidesExposed = 0;
  lines.forEach((l) => {
    const { x: xs, y: ys, z: zs } = l.match(positionRE)?.groups || {};

    const x = Number(xs);
    const y = Number(ys);
    const z = Number(zs);

    sidesExposed += sidesPerCube;

    if (occupiedPositions.has(formatXYZ(x - 1, y, z))) {
      sidesExposed -= sidesToDeductWhenAdjacent;
    }

    if (occupiedPositions.has(formatXYZ(x + 1, y, z))) {
      sidesExposed -= sidesToDeductWhenAdjacent;
    }

    if (occupiedPositions.has(formatXYZ(x, y - 1, z))) {
      sidesExposed -= sidesToDeductWhenAdjacent;
    }

    if (occupiedPositions.has(formatXYZ(x, y + 1, z))) {
      sidesExposed -= sidesToDeductWhenAdjacent;
    }

    if (occupiedPositions.has(formatXYZ(x, y, z - 1))) {
      sidesExposed -= sidesToDeductWhenAdjacent;
    }

    if (occupiedPositions.has(formatXYZ(x, y, z + 1))) {
      sidesExposed -= sidesToDeductWhenAdjacent;
    }

    occupiedPositions.add(l);
  });

  console.log({ sidesExposed });

  assertNumber(answer, sidesExposed);
}

function formatXYZ(x: number, y: number, z: number) {
  return `${x},${y},${z}`;
}

main("test.txt", 64);
main("input.txt", 4192);
