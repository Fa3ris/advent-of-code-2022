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
    history: [...s.history],
    actions: [...s.actions],
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
}
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
