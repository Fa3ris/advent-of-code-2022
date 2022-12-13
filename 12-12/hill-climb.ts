import { readFileSync } from "fs";
import { resolve } from "path";

function formatEntry(row: number, col: number) {
  return `${row},${col}`;
}

class Node {
  constructor(
    private _row: number,
    private _col: number,
    private _letter: string
  ) {}

  dist: number = 0;

  get row() {
    return this._row;
  }

  get col() {
    return this._col;
  }

  get letter() {
    return this._letter;
  }
  private _neighbors: Set<[Node, number]> = new Set();

  addNeighbor(node: Node, weight: number) {
    this._neighbors.add([node, weight]);
  }

  get neighbors() {
    return [...this._neighbors.values()];
  }

  private _predecessor: Node | undefined;

  set prev(p: Node | undefined) {
    this._predecessor = p;
  }

  get prev(): Node | undefined {
    return this._predecessor;
  }
}
function main(filename: string, answer?: number) {
  const lines = readFileSync(resolve(__dirname, filename), {
    encoding: "utf-8",
  }).split(/\r|\n|\r\n/);

  const rows = lines.length;
  const cols = lines[0].length;

  const nodeMap = new Map<string, Node>();
  let sNode: Node | undefined;
  let eNode: Node | undefined;

  console.log(lines, { rows, cols });
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let letter = lines[row].charAt(col);
      let isStart = false;
      let isEnd = false;
      if (letter === "S") {
        letter = "a";
        isStart = true;
      } else if (letter === "E") {
        letter = "z";
        isEnd = true;
      }
      const node = new Node(row, col, letter);

      nodeMap.set(formatEntry(row, col), node);

      if (isStart) {
        sNode = node;
      } else if (isEnd) {
        eNode = node;
      }

      false && console.log({ row, col, letter });
    }
  }

  const setNeighbors = function (node: Node) {
    const { row, col } = node;
    const coords = [
      {
        row: row + 1,
        col: col,
      },
      {
        row: row - 1,
        col: col,
      },
      {
        row: row,
        col: col + 1,
      },
      {
        row: row,
        col: col - 1,
      },
    ];

    for (let coord of coords) {
      const neighbor = nodeMap.get(formatEntry(coord.row, coord.col));

      if (!neighbor) {
        continue;
      }

      let weight: number;
      if (neighbor.letter.charCodeAt(0) <= node.letter.charCodeAt(0) + 1) {
        weight = 1;
      } else {
        weight = Infinity;
      }
      node.addNeighbor(neighbor, weight);
    }
  };

  for (let node of nodeMap.values()) {
    setNeighbors(node);
  }

  console.log({ sNode, eNode });

  const path = findPath(
    { row: sNode!.row, col: sNode!.col },
    { row: eNode!.row, col: eNode!.col },
    nodeMap
  );

  console.log(path);

  console.log({ pathLength: path.length });

  if (answer && path.length != answer) {
    throw new Error(`expected ${answer}`);
  }
}

/* 
  not efficient but find the correct answer in a long long time

  TODO: try to use BFS starting from end 'z' and finish when first encounter an 'a'
*/
function main2(filename: string, answer?: number) {
  const lines = readFileSync(resolve(__dirname, filename), {
    encoding: "utf-8",
  }).split(/\r|\n|\r\n/);

  const rows = lines.length;
  const cols = lines[0].length;

  const nodeMap = new Map<string, Node>();
  let sNode: Node | undefined;
  let eNode: Node | undefined;
  const startNodes: Node[] = [];

  console.log(lines, { rows, cols });
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let letter = lines[row].charAt(col);
      let isStart = false;
      let isEnd = false;
      if (letter === "S") {
        letter = "a";
        isStart = true;
      } else if (letter === "E") {
        letter = "z";
        isEnd = true;
      } else if (letter === "a") {
        isStart = true;
      }
      const node = new Node(row, col, letter);

      nodeMap.set(formatEntry(row, col), node);

      if (isStart) {
        sNode = node;
        startNodes.push(node);
      } else if (isEnd) {
        eNode = node;
      }

      false && console.log({ row, col, letter });
    }
  }

  const setNeighbors = function (node: Node) {
    const { row, col } = node;
    const coords = [
      {
        row: row + 1,
        col: col,
      },
      {
        row: row - 1,
        col: col,
      },
      {
        row: row,
        col: col + 1,
      },
      {
        row: row,
        col: col - 1,
      },
    ];

    for (let coord of coords) {
      const neighbor = nodeMap.get(formatEntry(coord.row, coord.col));

      if (!neighbor) {
        continue;
      }

      let weight: number;
      if (neighbor.letter.charCodeAt(0) <= node.letter.charCodeAt(0) + 1) {
        weight = 1;
      } else {
        weight = Infinity;
      }
      node.addNeighbor(neighbor, weight);
    }
  };

  for (let node of nodeMap.values()) {
    setNeighbors(node);
  }

  console.log({ startNodes, eNode });

  const paths: string[][] = [];

  const visited = new Set<string>();
  const groupsOfGroupOfNeighbors: Set<Node>[] = [];
  for (let node of startNodes) {
    if (visited.has(formatEntry(node.row, node.col))) {
      continue;
    }

    const groupOfNeigbors = new Set<Node>();
    visited.add(formatEntry(node.row, node.col));
    groupOfNeigbors.add(node);

    // find all connected 'a' neighbors
    // BFS
    const neighbors = node.neighbors;
    while (neighbors.length > 0) {
      const [neighbor] = neighbors.shift() || [];
      if (!neighbor || visited.has(formatEntry(neighbor.row, neighbor.col))) {
        continue;
      }
      if (neighbor.letter !== "a") {
        continue;
      }
      visited.add(formatEntry(neighbor.row, neighbor.col));
      groupOfNeigbors.add(neighbor);
      for (let entry of neighbor.neighbors) {
        neighbors.push(entry);
      }
    }
    groupsOfGroupOfNeighbors.push(groupOfNeigbors);
  }

  console.log(groupsOfGroupOfNeighbors);
  const validGroups: Set<Node>[] = [];
  for (let group of groupsOfGroupOfNeighbors) {
    const firstNode = [...group.values()][0];
    try {
      findPath(
        { row: firstNode.row, col: firstNode.col },
        { row: eNode!.row, col: eNode!.col },
        nodeMap
      );
      console.log("valid group");
      validGroups.push(group);
    } catch (e) {
      console.error("invalid group");
    }
  }

  console.log({ total: validGroups.length, validGroups });

  const nodesToTest: Node[] = [];
  for (let groups of validGroups) {
    nodesToTest.push(...[...groups.values()]);
  }

  console.log({ nodesToTest: nodesToTest.length });
  const memoizedPaths = new Map<string, string[]>();
  for (let s of nodesToTest) {
    try {
      const path = findPath(
        { row: s.row, col: s.col },
        { row: eNode!.row, col: eNode!.col },
        nodeMap,
        memoizedPaths
      );

      memoizedPaths.set(formatEntry(s.row, s.col), path);

      paths.push(path);
    } catch (e) {
      console.error("no path between", { s, e }, e);
    }
  }

  console.log(paths);

  const sortedDist = paths.map((p) => p.length).sort((a, b) => a - b);
  console.log(sortedDist);
  const minDist = sortedDist.shift();
  console.log(minDist);

  if (answer && answer !== minDist) {
    throw new Error(`expected ${answer}`);
  }
}

function findPath(
  start: {
    row: number;
    col: number;
  },
  end: {
    row: number;
    col: number;
  },
  graph: Map<string, Node>,
  memoizedPaths?: Map<string, string[]>
): string[] {
  const s = graph.get(formatEntry(start.row, start.col));
  const e = graph.get(formatEntry(end.row, end.col));

  if (!e || !s) {
    return [];
  }

  const totalSize = graph.size;

  const visited = new Set<string>();

  for (let n of graph.values()) {
    n.dist = Infinity;
    const memoizedKey = formatEntry(n.row, n.col);
    if (memoizedPaths && memoizedPaths.has(memoizedKey)) {
      console.log("found memoized dist for ", n);
      n.dist = memoizedPaths.get(memoizedKey)?.length || Infinity;
    }
  }

  s.dist = 0;

  while (visited.size < totalSize) {
    console.log({ visitedSize: visited.size });
    let min = Infinity;
    let minNode: Node | undefined;
    for (let node of graph.values()) {
      if (!visited.has(formatEntry(node.row, node.col))) {
        if (node.dist < min) {
          min = node.dist;
          minNode = node;
        }
      }
    }

    if (!minNode) {
      const remainingDist = [...graph.values()]
        .filter((node) => !visited.has(formatEntry(node.row, node.col)))
        .map((n) => n.dist);
      console.log({ remainingDist });
      throw new Error("min node not found");
    }

    if (minNode === e) {
      console.log({ e }, "found");

      console.log({ s, e, totalSize });
      const path = [];
      let node: Node | undefined = e;

      while (node != undefined && node != s) {
        path.push(node.letter);
        node = node.prev;
      }

      path.reverse();
      return path;
    }
    console.log({ minNodeLetter: minNode.letter });

    visited.add(formatEntry(minNode.row, minNode.col));

    for (let [neighbor, weight] of minNode.neighbors) {
      if (!visited.has(formatEntry(neighbor.row, neighbor.col))) {
        const newDist = minNode.dist + weight;
        if (neighbor.dist > newDist) {
          neighbor.dist = newDist;
        }
        neighbor.prev = minNode;
      }
    }
  }

  console.log({ s, e, totalSize });
  const path = [];
  let node: Node | undefined = e;

  while (node != undefined && node != s) {
    path.push(node.letter);
    node = node.prev;
  }

  path.reverse();
  return path;
}

// main("test.txt", 31);
// main("input.txt", 517);
main2("test.txt", 29);
// main2("input.txt", 512);
