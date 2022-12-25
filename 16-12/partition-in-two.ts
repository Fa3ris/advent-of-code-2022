export function partitionInTwo<T>(set: Set<T>): Array<[Set<T>, Set<T>]> {
  if (set.size == 0) {
    return [];
  }

  if (set.size == 1) {
    return [[new Set(set), new Set()]];
  }

  const response: Array<[Set<T>, Set<T>]> = [];
  const [first] = set;
  set.delete(first);

  const subPartitions = partitionInTwo(set);

  for (let [set1, set2] of subPartitions) {
    // either add it in 1st or 2nd
    response.push([new Set([...set1, first]), new Set(set2)]);
    response.push([new Set(set1), new Set([...set2, first])]);
  }

  return response;
}

const testEnabled = false;

if (testEnabled) {
  test(partitionInTwo(new Set(["a"])), [[new Set(["a"]), new Set()]]);
  test(partitionInTwo(new Set(["a", "b"])), [
    [new Set(["a", "b"]), new Set()],
    [new Set(["b"]), new Set("a")],
  ]);

  const res = partitionInTwo(new Set(["a", "b", "c", "d"]));
  console.log(res);
}

function test<T>(
  actual: Array<[Set<T>, Set<T>]>,
  expected: Array<[Set<T>, Set<T>]>
) {
  if (actual.length !== expected.length) {
    throw new Error(`different sizes`);
  }

  for (let i = 0; i < actual.length; i++) {
    for (let j = 0; j < actual[i].length; j++) {
      if (!eqSet(actual[i][j], expected[i][j])) {
        console.log("actual", actual);
        console.log("expected", expected);
        throw new Error(`different sets`);
      }
    }
  }
}

function eqSet<T>(s1: Set<T>, s2: Set<T>) {
  return s1.size === s2.size && [...s1].every((x) => s2.has(x));
}
