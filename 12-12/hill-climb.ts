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
function buildGraph(lines: string[]): {
  nodeMap: Map<string, Node>;
  start: Node;
  end: Node;
} {
  const rows = lines.length;
  const cols = lines[0].length;

  const nodeMap = new Map<string, Node>();
  let sNode: Node | undefined;
  let eNode: Node | undefined;

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

  if (!sNode || !eNode) {
    throw new Error("missing node");
  }

  return {
    nodeMap,
    start: sNode,
    end: eNode,
  };
}

function main(filename: string, answer?: number) {
  const lines = readFileSync(resolve(__dirname, filename), {
    encoding: "utf-8",
  }).split(/\r|\n|\r\n/);

  const { nodeMap, start, end } = buildGraph(lines);

  const path = dijkstraByMatcherAndWeighter(
    { row: start.row, col: start.col },
    (node: Node) => node === end,
    nodeMap,
    // neigbor must be at most (current + 1)
    (node: Node, neighbor: Node) => {
      if (neighbor.letter.charCodeAt(0) <= node.letter.charCodeAt(0) + 1) {
        return 1;
      } else {
        return Infinity;
      }
    }
  );

  console.log({ pathLength: path.length });

  if (answer && path.length != answer) {
    throw new Error(`expected ${answer}`);
  }
}

function main2(filename: string, answer?: number) {
  const lines = readFileSync(resolve(__dirname, filename), {
    encoding: "utf-8",
  }).split(/\r|\n|\r\n/);

  const { nodeMap: graph, end } = buildGraph(lines);

  const shortestPath = dijkstraByMatcherAndWeighter(
    end,
    (node) => node.letter === "a",
    graph,
    // neighbor must be at least (current - 1) - so that we can traverse in the opposite direction
    (node: Node, neighbor: Node) => {
      if (neighbor.letter.charCodeAt(0) >= node.letter.charCodeAt(0) - 1) {
        return 1;
      } else {
        return Infinity;
      }
    }
  );

  const dist = shortestPath.length;

  console.log({ shortestPath: dist });
  if (answer && answer != dist) {
    throw new Error(`expected ${answer}`);
  }
}

function dijkstraByMatcherAndWeighter(
  start: {
    row: number;
    col: number;
  },
  nodeMatcher: (node: Node) => boolean,
  graph: Map<string, Node>,
  edgeWeighter: (node: Node, neighbor: Node) => number
): string[] {
  const s = graph.get(formatEntry(start.row, start.col));

  if (!s) {
    throw new Error("start node not found in graph");
  }

  const visited = new Set<string>();

  for (let n of graph.values()) {
    n.dist = Infinity;
  }

  s.dist = 0;

  const totalSize = graph.size;
  while (visited.size < totalSize) {
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

    if (nodeMatcher(minNode)) {
      const path = [];
      let node: Node | undefined = minNode;

      while (node != undefined && node != s) {
        path.push(node.letter);
        node = node.prev;
      }

      path.reverse();
      return path;
    }

    visited.add(formatEntry(minNode.row, minNode.col));

    for (let [neighbor] of minNode.neighbors) {
      if (!visited.has(formatEntry(neighbor.row, neighbor.col))) {
        const newDist = minNode.dist + edgeWeighter(minNode, neighbor);
        if (neighbor.dist > newDist) {
          neighbor.dist = newDist;
        }
        neighbor.prev = minNode;
      }
    }
  }

  throw new Error("target node not found");
}

main("test.txt", 31);
main("input.txt", 517);
main2("test.txt", 29);
main2("input.txt", 512);
