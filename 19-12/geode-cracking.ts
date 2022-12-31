import { resolve } from "path";
import { assertNumber } from "../helper/assert";
import { readLines } from "../helper/read-lines";

type Blueprint = {
  oreRobot: {
    ore: number;
  };
  clayRobot: {
    ore: number;
  };
  obsidianRobot: {
    ore: number;
    clay: number;
  };
  geodeRobot: {
    ore: number;
    obsidian: number;
  };
};

type State = {
  ore: number;
  clay: number;
  obsidian: number;
  geode: number;

  robots: {
    ore: number;
    clay: number;
    obsidian: number;
    geode: number;
  };

  history: {
    time: number;
    state: State;
  }[];

  actions: string[];
};

function formatKey(t: number, s: State) {
  return `t:${t};${JSON.stringify(s)}`;
}

function collectGeodes2(
  state: State,
  time: number,
  blueprint: Blueprint,
  memoized: Map<string, State>,
  bestSoFar = { val: -Infinity }
): State {
  const key = formatKey(time, state);

  let tempGeode = state.geode;
  let tempGeodeRobots = state.robots.geode;
  let tempTime = time;
  while (tempTime > 0) {
    tempGeode += tempGeodeRobots;
    tempGeodeRobots++;
    tempTime--;
  }

  if (tempGeode < bestSoFar.val) {
    // no need to explore
    return state;
  }

  // const m = memoized.get(key);
  // if (m) {
  //   false && console.log("memoized");
  //   return m;
  // }

  if (time === 0) {
    false && console.log("finalState", { finalState: state });
    return state;
  }

  const statesToExplore: State[] = [];

  const maxOreNeeded = Math.max(
    blueprint.oreRobot.ore,
    blueprint.clayRobot.ore,
    blueprint.obsidianRobot.ore,
    blueprint.geodeRobot.ore
  );

  const notEnoughOreRobot = state.robots.ore < maxOreNeeded;
  const canBuildOreRobot = hasRobotToCreateOreRobot(state) && notEnoughOreRobot;

  if (canBuildOreRobot) {
    false && console.log("build ore", key);
    const { time: newTime, state: newState } = newStateAfterOreRobot(
      state,
      time,
      blueprint
    );

    false && console.log("built ore", formatKey(newTime, newState));

    if (newTime > 0) {
      const s = collectGeodes2(
        newState,
        newTime,
        blueprint,
        memoized,
        bestSoFar
      );

      statesToExplore.push(s);
    } else {
      while (time > 0) {
        state = collectResources(state);
        time--;
      }
      statesToExplore.push(state);
    }
  }

  const canBuildClayRobot =
    hasRobotToCreateClayRobot(state) &&
    state.robots.clay < blueprint.obsidianRobot.clay;

  if (canBuildClayRobot) {
    false && console.log("build clay", key);

    const { time: newTime, state: newState } = newStateAfterClayRobot(
      state,
      time,
      blueprint
    );

    false && console.log("built clay", formatKey(newTime, newState));

    if (newTime > 0) {
      const s = collectGeodes2(
        newState,
        newTime,
        blueprint,
        memoized,
        bestSoFar
      );

      statesToExplore.push(s);
    } else {
      while (time > 0) {
        state = collectResources(state);
        time--;
      }
      statesToExplore.push(state);
    }
  }

  const canBuildObsidianRobot =
    hasRobotToCreateObsidianRobot(state) &&
    state.robots.obsidian < blueprint.geodeRobot.obsidian;

  if (canBuildObsidianRobot) {
    false && console.log("build obsidian", key);

    const { time: newTime, state: newState } = newStateAfterObsidianRobot(
      state,
      time,
      blueprint
    );

    false && console.log("built obsidian", formatKey(newTime, newState));

    if (newTime > 0) {
      const s = collectGeodes2(
        newState,
        newTime,
        blueprint,
        memoized,
        bestSoFar
      );

      statesToExplore.push(s);
    } else {
      while (time > 0) {
        state = collectResources(state);
        time--;
      }
      statesToExplore.push(state);
    }
  }

  if (hasRobotToCreateGeodeRobot(state)) {
    false && console.log("build geode", key);

    const { time: newTime, state: newState } = newStateAfterGeodeRobot(
      state,
      time,
      blueprint
    );

    false && console.log("built geode", formatKey(newTime, newState));

    if (newTime > 0) {
      const s = collectGeodes2(
        newState,
        newTime,
        blueprint,
        memoized,
        bestSoFar
      );

      statesToExplore.push(s);
    } else {
      while (time > 0) {
        state = collectResources(state);
        time--;
      }
      statesToExplore.push(state);
    }
  }

  statesToExplore.sort((s1, s2) => s2.geode - s1.geode);

  false && console.log({ statesToExplore });

  const s = statesToExplore[0];

  bestSoFar.val = Math.max(s.geode, bestSoFar.val);

  // memoized.set(key, s);

  // bestGeodes.set(time, Math.max(s.geode, bestGeodes.get(time) || -Infinity));

  return s;
}

function hasRobotToCreateOreRobot(state: State): boolean {
  return state.robots.ore > 0;
}

function hasRobotToCreateClayRobot(state: State): boolean {
  return state.robots.ore > 0;
}

function hasRobotToCreateObsidianRobot(state: State): boolean {
  return state.robots.ore > 0 && state.robots.clay > 0;
}

function hasRobotToCreateGeodeRobot(state: State): boolean {
  return state.robots.ore > 0 && state.robots.obsidian > 0;
}

function newStateAfterOreRobot(
  state: State,
  time: number,
  blueprint: Blueprint
): {
  time: number;
  state: State;
} {
  let sufficientOre = state.ore >= blueprint.oreRobot.ore;

  while (!sufficientOre) {
    state = collectResources(state);
    time--;
    sufficientOre = state.ore >= blueprint.oreRobot.ore;
  }

  state = collectResources(state);
  state = buildOreRobot(state, blueprint);
  time--;
  return { time, state };
}

function newStateAfterClayRobot(
  state: State,
  time: number,
  blueprint: Blueprint
): {
  time: number;
  state: State;
} {
  let sufficientOre = state.ore >= blueprint.clayRobot.ore;

  while (!sufficientOre) {
    state = collectResources(state);
    time--;
    sufficientOre = state.ore >= blueprint.clayRobot.ore;
  }

  state = collectResources(state);
  state = buildClayRobot(state, blueprint);
  time--;
  return { time, state };
}

function newStateAfterObsidianRobot(
  state: State,
  time: number,
  blueprint: Blueprint
): {
  time: number;
  state: State;
} {
  let sufficientResources =
    state.ore >= blueprint.obsidianRobot.ore &&
    state.clay >= blueprint.obsidianRobot.clay;

  while (!sufficientResources) {
    state = collectResources(state);
    time--;
    sufficientResources =
      state.ore >= blueprint.obsidianRobot.ore &&
      state.clay >= blueprint.obsidianRobot.clay;
  }

  state = collectResources(state);
  state = buildObsidianRobot(state, blueprint);
  time--;
  return { time, state };
}

function newStateAfterGeodeRobot(
  state: State,
  time: number,
  blueprint: Blueprint
): {
  time: number;
  state: State;
} {
  let sufficientResources =
    state.ore >= blueprint.geodeRobot.ore &&
    state.obsidian >= blueprint.geodeRobot.obsidian;

  while (!sufficientResources) {
    state = collectResources(state);
    time--;
    sufficientResources =
      state.ore >= blueprint.geodeRobot.ore &&
      state.obsidian >= blueprint.geodeRobot.obsidian;
  }

  state = collectResources(state);
  state = buildGeodeRobot(state, blueprint);
  time--;
  return { time, state };
}

function collectGeodes(
  state: State,
  time: number,
  blueprint: Blueprint,
  memoized: Map<string, State>
): State {
  false && console.log(formatKey(time, state));
  const key = formatKey(time, state);

  const m = memoized.get(key);
  if (m) {
    false && console.log("memoized");

    return m;
  }

  if (time === 0) {
    false && console.log("finalState", { finalState: state });
    return state;
  }

  const statesToExplore: State[] = [];

  const collectOnly = collectGeodes(
    collectResources(state),
    time - 1,
    blueprint,
    memoized
  );

  statesToExplore.push(collectOnly);

  if (canBuildGeodeRobot(state, blueprint)) {
    false && console.log("build geode");
    const collected = collectResources(state);
    const builtGeode = buildGeodeRobot(collected, blueprint);

    const s = collectGeodes(builtGeode, time - 1, blueprint, memoized);

    statesToExplore.push(s);
  }

  if (canBuildOreRobot(state, blueprint)) {
    false && console.log("build ore");
    const collected = collectResources(state);
    const builtOre = buildOreRobot(collected, blueprint);

    const s = collectGeodes(builtOre, time - 1, blueprint, memoized);
    statesToExplore.push(s);
  }

  if (canBuildClayRobot(state, blueprint)) {
    false && console.log("build clay");
    const collected = collectResources(state);
    const builtClay = buildClayRobot(collected, blueprint);

    const s = collectGeodes(builtClay, time - 1, blueprint, memoized);
    statesToExplore.push(s);
  }

  if (canBuildObsidianRobot(state, blueprint)) {
    false && console.log("build obsidian");

    const collected = collectResources(state);
    const builtObsidian = buildObsidianRobot(collected, blueprint);
    const s = collectGeodes(builtObsidian, time - 1, blueprint, memoized);
    statesToExplore.push(s);
  }

  statesToExplore.sort((s1, s2) => s2.geode - s1.geode);

  false && console.log({ statesToExplore });

  const s = statesToExplore[0];

  memoized.set(key, s);

  return s;
}

function canBuildOreRobot(state: State, blueprint: Blueprint): boolean {
  const maxOreNeeded = Math.max(
    blueprint.oreRobot.ore,
    blueprint.clayRobot.ore,
    blueprint.obsidianRobot.ore,
    blueprint.geodeRobot.ore
  );

  const notEnoughRobot = state.robots.ore < maxOreNeeded;
  return notEnoughRobot && state.ore >= blueprint.oreRobot.ore;
}

/* state will not lead to produce more geode robot collect what will be produced and return */
function resourcesToBuildGeodeRobot(blueprint: Blueprint) {
  return {
    ore: blueprint.clayRobot.ore + blueprint.oreRobot.ore,
  };
}
function buildOreRobot(state: State, blueprint: Blueprint): State {
  const s = cloneState(state);

  s.robots.ore++;

  s.ore -= blueprint.oreRobot.ore;
  return s;
}

function canBuildClayRobot(state: State, blueprint: Blueprint): boolean {
  const notEnoughRobot = state.robots.clay < blueprint.obsidianRobot.clay;

  return notEnoughRobot && state.ore >= blueprint.clayRobot.ore;
}

function buildClayRobot(state: State, blueprint: Blueprint): State {
  const s = cloneState(state);
  s.robots.clay++;
  s.ore -= blueprint.clayRobot.ore;
  return s;
}

function canBuildObsidianRobot(state: State, blueprint: Blueprint): boolean {
  const notEnoughRobot = state.robots.obsidian < blueprint.geodeRobot.obsidian;

  return (
    notEnoughRobot &&
    state.ore >= blueprint.obsidianRobot.ore &&
    state.clay >= blueprint.obsidianRobot.clay
  );
}

function buildObsidianRobot(state: State, blueprint: Blueprint): State {
  const s = cloneState(state);
  s.robots.obsidian++;

  s.ore -= blueprint.obsidianRobot.ore;
  s.clay -= blueprint.obsidianRobot.clay;
  return s;
}

function canBuildGeodeRobot(state: State, blueprint: Blueprint): boolean {
  return (
    state.ore >= blueprint.geodeRobot.ore &&
    state.obsidian >= blueprint.geodeRobot.obsidian
  );
}

function buildGeodeRobot(state: State, blueprint: Blueprint): State {
  const s = cloneState(state);
  s.robots.geode++;
  s.ore -= blueprint.geodeRobot.ore;
  s.obsidian -= blueprint.geodeRobot.obsidian;
  return s;
}

function collectResources(state: State): State {
  const s = cloneState(state);
  s.ore += s.robots.ore;
  s.clay += s.robots.clay;
  s.obsidian += s.robots.obsidian;
  s.geode += s.robots.geode;
  return s;
}

function addHistory(state: State, time: number): State {
  const s = cloneState(state);
  s.history.unshift({ time, state: s });
  return s;
}

function addAction(state: State, time: number, msg: string): State {
  const s = cloneState(state);
  s.actions.push(`t:${time};${msg}`);
  return s;
}

function cloneState(s: State): State {
  return {
    ...s,
    robots: { ...s.robots },
    // history: [...s.history],
    // actions: [...s.actions],
  };
}

if (false) {
  const finalState = collectGeodes(
    {
      ore: 0,
      clay: 0,
      obsidian: 0,
      geode: 0,
      robots: {
        ore: 1,
        clay: 0,
        obsidian: 0,
        geode: 0,
      },
      history: [],
      actions: [],
    },
    24,
    {
      oreRobot: {
        ore: 4,
      },
      clayRobot: { ore: 2 },
      obsidianRobot: {
        ore: 3,
        clay: 14,
      },
      geodeRobot: {
        ore: 2,
        obsidian: 7,
      },
    },
    new Map()
  );

  console.log({ finalState });

  const finalState2 = collectGeodes(
    {
      ore: 0,
      clay: 0,
      obsidian: 0,
      geode: 0,
      robots: {
        ore: 1,
        clay: 0,
        obsidian: 0,
        geode: 0,
      },
      history: [],
      actions: [],
    },
    24,
    {
      oreRobot: {
        ore: 2,
      },
      clayRobot: { ore: 3 },
      obsidianRobot: {
        ore: 3,
        clay: 8,
      },
      geodeRobot: {
        ore: 3,
        obsidian: 12,
      },
    },
    new Map()
  );

  console.log({ finalState2 });
}

const bp1 = {
  oreRobot: {
    ore: 4,
  },
  clayRobot: { ore: 2 },
  obsidianRobot: {
    ore: 3,
    clay: 14,
  },
  geodeRobot: {
    ore: 2,
    obsidian: 7,
  },
};

const bp2 = {
  oreRobot: {
    ore: 2,
  },
  clayRobot: { ore: 3 },
  obsidianRobot: {
    ore: 3,
    clay: 8,
  },
  geodeRobot: {
    ore: 3,
    obsidian: 12,
  },
};

if (false) {
  const finalState = collectGeodes2(
    {
      ore: 0,
      clay: 0,
      obsidian: 0,
      geode: 0,
      robots: {
        ore: 1,
        clay: 0,
        obsidian: 0,
        geode: 0,
      },
      history: [],
      actions: [],
    },
    24,
    bp1,
    new Map()
  );

  console.log({ finalState });

  const finalState2 = collectGeodes2(
    {
      ore: 0,
      clay: 0,
      obsidian: 0,
      geode: 0,
      robots: {
        ore: 1,
        clay: 0,
        obsidian: 0,
        geode: 0,
      },
      history: [],
      actions: [],
    },
    24,
    bp2,
    new Map()
  );

  console.log({ finalState2 });
}

function buildBluePrint(line: string): { bp: Blueprint; id: number } {
  const re = /(\d+)/g;

  const arr = Array.from(line.matchAll(re));

  return {
    id: Number(arr[0][0]),
    bp: {
      oreRobot: {
        ore: Number(arr[1][0]),
      },

      clayRobot: {
        ore: Number(arr[2][0]),
      },
      obsidianRobot: {
        ore: Number(arr[3][0]),
        clay: Number(arr[4][0]),
      },
      geodeRobot: {
        ore: Number(arr[5][0]),
        obsidian: Number(arr[6][0]),
      },
    },
  };
}

if (false) {
  const l =
    "Blueprint 4: Each ore robot costs 4 ore. Each clay robot costs 3 ore. Each obsidian robot costs 4 ore and 20 clay. Each geode robot costs 4 ore and 8 obsidian.";

  const { id, bp } = buildBluePrint(l);
  console.log({ id, bp });
}

function main(filename: string, answer?: number) {
  const lines = readLines(resolve(__dirname, filename));

  let sumQualityLevel = 0;

  lines.forEach((l) => {
    const { id, bp } = buildBluePrint(l);

    const finalState = collectGeodes2(
      {
        ore: 0,
        clay: 0,
        obsidian: 0,
        geode: 0,
        robots: {
          ore: 1,
          clay: 0,
          obsidian: 0,
          geode: 0,
        },
        history: [],
        actions: [],
      },
      24,
      bp,
      new Map()
    );

    console.log({ finalState });
    const geodes = finalState.geode;

    const qualityLevel = id * geodes;
    sumQualityLevel += qualityLevel;
  });

  console.log({ sumQualityLevel });

  assertNumber(answer, sumQualityLevel);
}

function main2(filename: string, answer?: number) {
  let lines = readLines(resolve(__dirname, filename));

  let product = 1;

  lines = lines.slice(0, 3);

  lines.forEach((l) => {
    const { id, bp } = buildBluePrint(l);

    console.log("begin", id);
    const finalState = collectGeodes2(
      {
        ore: 0,
        clay: 0,
        obsidian: 0,
        geode: 0,
        robots: {
          ore: 1,
          clay: 0,
          obsidian: 0,
          geode: 0,
        },
        history: [],
        actions: [],
      },
      32,
      bp,
      new Map()
    );

    console.log({ finalState });
    const geodes = finalState.geode;

    product *= geodes;
  });

  console.log({ product: product });

  assertNumber(answer, product);
}

main("test.txt", 33);
main("input.txt", 1115);
main2("test.txt", 3472);
main2("input.txt", 25056);
