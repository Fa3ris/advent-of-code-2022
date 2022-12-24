import { readFileSync } from "fs";
import { resolve } from "path";

type Valve = {
  name: string;
  flow: number;
  neighbors: Valve[];
  neighborNames: string[];
};

type ValveForPathFinding = Valve & {
  parent?: ValveForPathFinding;
};

type FlowResponse = {
  flow: number;
  visited: {
    name: string;
    time: number;
  }[];
};

const valveAndFlowRe = /Valve (?<valve>\w+).*rate=(?<flow>\d+)/;

const neighborValvesRe = /(?<neighbors>(?:(?:\w+)(?:, )?)+)$/;

function main(filename: string, answer?: number) {
  const lines = readFileSync(resolve(__dirname, filename), {
    encoding: "utf-8",
  }).split(/\r|\r\n|\n/);

  const graph = new Map<string, Valve>();

  lines.forEach((l) => {
    const { valve, flow } = l.match(valveAndFlowRe)?.groups || {};

    const { neighbors } = l.match(neighborValvesRe)?.groups || {};
    const neighborsList = neighbors.split(", ");
    graph.set(valve, {
      name: valve,
      flow: Number(flow),
      neighbors: [],
      neighborNames: neighborsList,
    });
  });

  for (let valve of graph.values()) {
    for (let neighborName of valve.neighborNames) {
      const neighbor = graph.get(neighborName);
      if (!neighbor) {
        throw new Error(`missing neighbor ${neighborName}`);
      }

      valve.neighbors.push(neighbor);
    }
  }

  const pathFinder = createPathFinder(graph);

  const notVisitedAndWorthVisiting = [...graph.values()]
    .filter((v) => v.flow > 0)
    .map((v) => v.name);

  console.log({ notVisitedAndWorthVisiting });

  for (let i = 0; i < notVisitedAndWorthVisiting.length; i++) {
    for (let j = i + 1; j < notVisitedAndWorthVisiting.length; j++) {
      pathFinder(notVisitedAndWorthVisiting[i], notVisitedAndWorthVisiting[j]);
    }
  }

  const maxFlow = createMaxFlow(graph, pathFinder);

  const root = graph.get("AA");
  if (!root) {
    throw new Error("missing root");
  }

  const time = 30;
  const { flow, visited } = maxFlow(
    root,
    time,
    new Set(notVisitedAndWorthVisiting),
    []
  );
  console.log({ flow, visited });

  if (answer && flow != answer) {
    throw new Error(`expected ${answer} but got ${flow}`);
  }
}

function createPathFinder(graph: Map<string, Valve>) {
  const memoized = new Map<string, number>();

  const keyFormatter = (start: string, end: string) => `${start};${end}`;

  return function (start: string, end: string): number {
    console.log(`find path from ${start} to ${end}`);
    const key = keyFormatter(start, end);
    const mValue = memoized.get(key);
    if (mValue) {
      console.log("cache hit!!", mValue);
      return mValue;
    }

    const { n: numberSteps, path } = bfs(start, end, graph);

    memoized.set(key, numberSteps);

    return numberSteps;
  };
}

function bfs(
  start: string,
  end: string,
  graph: Map<string, Valve>
): { n: number; path?: string[] } {
  const queue: ValveForPathFinding[] = [];
  const explored = new Set<string>();

  const root = graph.get(start);
  if (!root) {
    return { n: -1 };
  }
  queue.push(root);
  explored.add(root.name);
  let targetValve: ValveForPathFinding | undefined = undefined;
  while (queue.length > 0) {
    const v = queue.shift();
    if (!v) {
      throw new Error(`impossible`);
    }
    if (end === v.name) {
      targetValve = v;
      break;
    }
    for (let n of v.neighbors) {
      if (explored.has(n.name)) {
        continue;
      }
      explored.add(n.name);
      const neighborToExplore: ValveForPathFinding = {
        ...n,
        parent: v,
      };
      queue.push(neighborToExplore);
    }
  }

  if (!targetValve) {
    console.log(`no path from ${start} to ${end}`);
    return { n: -2 };
  }

  let node = targetValve;
  const path: string[] = [node.name];
  while (node.parent !== undefined) {
    node = node.parent;
    path.unshift(node.name);
  }

  return {
    n: path.length - 1,
    path,
  };
}
/* 
    remove flow rate 0,


*/
function maxFlow(
  current: Valve,
  time: number,
  notVisited: Set<string>,
  visited: Set<string>,
  graph: Map<string, Valve>,
  pathFinder: (start: string, end: string) => number,
  memoized: Map<string, FlowResponse>
): FlowResponse {
  return {
    flow: 0,
    visited: [],
  };
}

function createMaxFlow(
  graph: Map<string, Valve>,
  pathFinder: (start: string, end: string) => number
) {
  const memoized = new Map<string, FlowResponse>();

  const keyFormatter = (current: Valve, time: number, visited: Set<string>) => {
    const arr = [...visited.values()].sort();
    return `${current.name};${time};${arr}`;
  };

  const maxFlow = function (
    current: Valve,
    time: number,
    notOpened: Set<string>,
    visited: {
      name: string;
      time: number;
    }[]
  ): FlowResponse {
    const key = keyFormatter(
      current,
      time,
      new Set(visited.map((v) => v.name))
    );
    console.log("max flow for", key, visited);
    const mValue = memoized.get(key);
    if (mValue) {
      console.log("cache hit!!", { key, mValue });
      return mValue;
    }

    if (time < 2) {
      // cannot get flow
      const res = {
        flow: 0,
        visited,
      };
      memoized.set(key, res);
      return res;
    }

    const flowResponses: FlowResponse[] = [];

    // open if flow > 0 then go to next
    if (current.flow > 0) {
      const remainingTimeAfterOpeningValve = time - 1;
      const totalFlowForOpeningCurrentValve =
        current.flow * remainingTimeAfterOpeningValve;

      // cannot get more flow from going to another valve either because none left, or not enough time
      flowResponses.push({
        flow: totalFlowForOpeningCurrentValve,
        visited: [{ name: current.name, time }],
      });

      const newNotOpened = new Set(notOpened);
      const currentDeleted = newNotOpened.delete(current.name);
      console.log(
        "removed",
        current.name,
        "from the unopened valves",
        currentDeleted
      );

      for (let notOpenedValve of newNotOpened.values()) {
        const numberOfSteps = pathFinder(current.name, notOpenedValve);

        const nextNode = graph.get(notOpenedValve);
        if (!nextNode) {
          throw new Error(`impossible`);
        }

        if (numberOfSteps + 1 + 1 > remainingTimeAfterOpeningValve) {
          // not enough time to go, open and collect once
          console.log("do not go from", current.name, "to", notOpenedValve);
          continue;
        }

        console.log(
          "open current",
          current.name,
          "then visit next valve",
          notOpenedValve
        );

        const newVisited = [...visited, { name: current.name, time }];

        const openThenGoToNextNodeFlowResponse = maxFlow(
          nextNode,
          remainingTimeAfterOpeningValve - numberOfSteps,
          newNotOpened,
          newVisited
        );

        const totalFlow =
          totalFlowForOpeningCurrentValve +
          openThenGoToNextNodeFlowResponse.flow;

        flowResponses.push({
          flow: totalFlow,
          visited: [
            { name: current.name, time },
            ...openThenGoToNextNodeFlowResponse.visited,
          ],
        });
      }
    } else {
      // go to next directly without opening current - should only happen when at valve AA
      for (let possibleNode of notOpened.values()) {
        if (possibleNode === current.name) {
          continue;
        }

        const numberOfSteps = pathFinder(current.name, possibleNode);

        const nextNode = graph.get(possibleNode);
        if (!nextNode) {
          throw new Error(`impossible`);
        }

        const newNotOpened = new Set(notOpened);

        if (numberOfSteps + 1 + 1 > time) {
          // not enough time to go, open and collect once
          console.log("do not go from", current.name, "to", possibleNode);
          continue;
        }

        console.log(
          "from",
          current.name,
          "visit next node directly",
          possibleNode
        );

        const goToNextNodeDirectlyFlowResponse = maxFlow(
          nextNode,
          time - numberOfSteps,
          newNotOpened,
          visited
        );

        flowResponses.push({
          flow: goToNextNodeDirectlyFlowResponse.flow,
          visited: [...goToNextNodeDirectlyFlowResponse.visited],
        });
      }
    }

    if (flowResponses.length == 0) {
      throw new Error(`flow responses are empty`);
      const remainingTimeAfterOpeningValve = time - 1;
      const totalFlowForOpeningCurrentValve =
        current.flow * remainingTimeAfterOpeningValve;

      flowResponses.push({
        flow: totalFlowForOpeningCurrentValve,
        visited: [{ name: current.name, time }],
      });
    }

    flowResponses.sort((r1, r2) => r2.flow - r1.flow);

    const res = flowResponses[0];
    memoized.set(key, res);
    return res;
  };

  return maxFlow;
}

main("test.txt", 1651);
main("input.txt", 1880);
