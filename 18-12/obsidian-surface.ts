import { writeFileSync } from "fs";
import { resolve } from "path";
import { assertNumber } from "../helper/assert";
import { readLines } from "../helper/read-lines";

const positionRE = /(?<x>\d+),(?<y>\d+),(?<z>\d+)/;
const sidesPerCube = 6;
const sidesToDeductWhenAdjacent = 2;

function getSidesExposed(lines: string[]) {
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

  return { sidesExposed, occupiedPositions };
}
function main(filename: string, answer?: number) {
  const lines = readLines(resolve(__dirname, filename));

  const { sidesExposed } = getSidesExposed(lines);
  console.log({ sidesExposed });

  assertNumber(answer, sidesExposed);
}

function drawStrata(
  occupiedPositions: Set<string>,
  bounds: {
    minZ: number;
    maxZ: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  }
): string {
  const strata: string[] = [];
  const { minZ, maxZ, minX, minY, maxX, maxY } = bounds;

  for (let z = minZ; z <= maxZ; z++) {
    strata.push(`stratum z=${z}`);
    const stratum: string[] = [];
    for (let x = minX; x <= maxX; x++) {
      const line: string[] = Array(maxY - minY + 1).fill(".");
      for (let y = minY; y <= maxY; y++) {
        if (occupiedPositions.has(formatXYZ(x, y, z))) {
          line[y - minY] = "#";
        }
      }
      stratum.push(line.join(""));
    }

    strata.push(stratum.join("\n"));
    strata.push("\n");
  }

  return strata.join("\n");
}

function formatXYZ(x: number, y: number, z: number) {
  return `${x},${y},${z}`;
}

function main2(filename: string, answer?: number) {
  const lines = readLines(resolve(__dirname, filename));

  const occupiedPositions = new Set<string>(lines);

  let minZ = Infinity;
  let maxZ = -Infinity;

  let minX = Infinity;
  let maxX = -Infinity;

  let minY = Infinity;
  let maxY = -Infinity;

  lines.forEach((l) => {
    const { x: xs, y: ys, z: zs } = l.match(positionRE)?.groups || {};

    const x = Number(xs);
    const y = Number(ys);
    const z = Number(zs);

    minZ = Math.min(z, minZ);
    maxZ = Math.max(z, maxZ);

    minX = Math.min(x, minX);
    maxX = Math.max(x, maxX);

    minY = Math.min(y, minY);
    maxY = Math.max(y, maxY);
  });

  minX--;
  minY--;
  minZ--;
  maxX++;
  maxY++;
  maxZ++;

  const bounds = {
    minZ,
    maxZ,
    minX,
    maxX,
    minY,
    maxY,
  };

  false && console.log(occupiedPositions);

  false && console.log({ start: formatXYZ(minX, minY, minZ), bounds });

  const queue: { x: number; y: number; z: number }[] = [];

  const visited = new Set<string>();

  if (!occupiedPositions.has(formatXYZ(minX, minY, minZ))) {
    visited.add(formatXYZ(minX, minY, minZ));
    queue.push({
      x: minX,
      y: minY,
      z: minZ,
    });
  }

  let sidesExposedToWater = 0;

  while (queue.length > 0) {
    const elt = queue.shift();
    if (!elt) throw `anomaly`;

    const { x, y, z } = elt;

    const neighbors: { x: number; y: number; z: number }[] = [
      { x: x - 1, y, z },
      { x: x + 1, y, z },
      { x, y: y - 1, z },
      { x, y: y + 1, z },
      { x, y, z: z - 1 },
      { x, y, z: z + 1 },
    ];

    false && console.group("check neighbors of", { x, y, z });
    neighbors.forEach(({ x, y, z }) => {
      if (
        x < minX ||
        x > maxX ||
        y < minY ||
        y > maxY ||
        z < minZ ||
        z > maxZ
      ) {
        false && console.log({ x, y, z }, "OOB");
        return; // OOB
      }

      const neighborKey = formatXYZ(x, y, z);

      if (occupiedPositions.has(neighborKey)) {
        false && console.log("occupied", { x, y, z });
        // wall
        sidesExposedToWater++;
        return;
      }

      if (!visited.has(neighborKey)) {
        false && console.log({ x, y, z }, "to visit");
        visited.add(neighborKey);
        queue.push({ x, y, z });
      }
    });

    false && console.groupEnd();
  }

  if (false) {
    const state = drawStrata(occupiedPositions, bounds);

    writeFileSync(resolve(__dirname, "snap.txt"), state, {
      encoding: "utf-8",
    });

    const state2 = drawStrata(visited, bounds);

    writeFileSync(resolve(__dirname, "visited.txt"), state2, {
      encoding: "utf-8",
    });
  }
  console.log({ sidesExposedToWater });

  assertNumber(answer, sidesExposedToWater);
}

main("test.txt", 64);
main2("test.txt", 58);

main("input.txt", 4192);
main2("input.txt", 2520);

/* USELESS */

function createZFormatter(pos: { x: number; y: number }) {
  return (z: number) => {
    return formatXYZ(pos.x, pos.y, z);
  };
}

function createXFormatter(pos: { z: number; y: number }) {
  return (x: number) => {
    return formatXYZ(x, pos.y, pos.z);
  };
}

function createYFormatter(pos: { x: number; z: number }) {
  return (y: number) => {
    return formatXYZ(pos.x, y, pos.z);
  };
}

function checkObstacle(
  boundsIncluded: { min: number; max: number },
  formatter: (n: number) => string,
  occupiedPositions: Set<string>
) {
  for (let i = boundsIncluded.min; i <= boundsIncluded.max; i++) {
    if (occupiedPositions.has(formatter(i))) {
      return true;
    }
  }
  return false;
}
function isSurroundedByObstacles(
  pos: { x: number; y: number; z: number },
  occupiedPositions: Set<string>,
  bounds: {
    minZ: number;
    maxZ: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  }
): boolean {
  const { x, y, z } = pos;
  const { minX, maxX, minY, maxY, minZ, maxZ } = bounds;

  const zFormatter = createZFormatter({ x, y });
  const xFormatter = createXFormatter({ z, y });
  const yFormatter = createYFormatter({ x, z });
  const obstacleBelowZ = checkObstacle(
    { min: minZ, max: z - 1 },
    zFormatter,
    occupiedPositions
  );

  if (!obstacleBelowZ) return false;

  const obstacleAboveZ = checkObstacle(
    { min: z + 1, max: maxZ },
    zFormatter,
    occupiedPositions
  );

  if (!obstacleAboveZ) return false;

  const obstacleBelowX = checkObstacle(
    { min: minX, max: x - 1 },
    xFormatter,
    occupiedPositions
  );

  if (!obstacleBelowX) return false;

  const obstacleAboveX = checkObstacle(
    { min: x + 1, max: maxX },
    xFormatter,
    occupiedPositions
  );

  if (!obstacleAboveX) return false;

  const obstacleBelowY = checkObstacle(
    { min: minY, max: y - 1 },
    yFormatter,
    occupiedPositions
  );

  if (!obstacleBelowY) return false;

  const obstacleAboveY = checkObstacle(
    { min: y + 1, max: maxY },
    yFormatter,
    occupiedPositions
  );

  if (!obstacleAboveY) return false;

  return true;
}

function hasObstacleAboveOrBelow(
  pos: { x: number; y: number; z: number },
  occupiedPositions: Set<string>,
  bounds: {
    minZ: number;
    maxZ: number;
  }
): boolean {
  const { x, y, z } = pos;
  const { minZ, maxZ } = bounds;

  let obstacleBelow = false;
  for (let i = minZ; i < z; i++) {
    if (occupiedPositions.has(formatXYZ(x, y, i))) {
      obstacleBelow = true;
      break;
    }
  }
  let obstacleAbove = false;

  for (let i = z + 1; i <= maxZ; i++) {
    if (occupiedPositions.has(formatXYZ(x, y, i))) {
      obstacleAbove = true;
      break;
    }
  }

  return obstacleBelow && obstacleAbove;
}
