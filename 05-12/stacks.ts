import { resolve } from "path";
import { AllReader } from "../helper/all-reader";

const mapping = {
  1: 1,
  5: 2,
  9: 3,
  13: 4,
  17: 5,
  21: 6,
  25: 7,
  29: 8,
  33: 9,
};

// index === 1 + i * 4 => stack i + 1
function main() {
  const r = new AllReader(resolve(__dirname, "input.txt"));

  r.addLinesListener((lines) => {
    const emptyLine = lines.findIndex((line) => line === "");
    console.log("empty line at", emptyLine);

    const numberRow = lines[emptyLine - 1];
    console.log(lines[emptyLine - 1]);
    const res = /(?<totalStacks>\d)\s*$/.exec(numberRow);
    const totalStacks = Number(res?.groups?.totalStacks);
    console.log(totalStacks);

    const mapOfStacks = new Map<number, Array<string>>();
    for (let i = 1; i <= totalStacks; i++) {
      mapOfStacks.set(i, []);
    }

    for (let j = emptyLine - 2; j >= 0; j--) {
      const row = [...lines[j].matchAll(/[\w]/g)];
      for (let match of row) {
        const matchIndex = match.index;
        if (!matchIndex) {
          throw "missing index";
        }
        let i = 0;
        while (1 + i * 4 != matchIndex) {
          // works because only 1-digit stack index, no 10, 11, ...
          ++i;
        }
        mapOfStacks.get(i + 1)?.push(match[0]);
      }
    }

    console.log(mapOfStacks);
    for (let i = emptyLine + 1; i < lines.length; i++) {
      console.log("process instruction", lines[i]);
      const res = lines[i].match(
        /move (?<qty>\d+) from (?<src>\d+) to (?<dst>\d+)/
      );
      console.log(res);
      const { qty: a, src: b, dst: c } = res?.groups || {};

      const qty = Number(a),
        src = Number(b),
        dst = Number(c);

      for (let i = 0; i < qty; i++) {
        const val = mapOfStacks.get(src)?.pop();
        if (!val) {
          throw "missing val";
        }
        mapOfStacks.get(dst)?.push(val);
      }
    }
    console.log(mapOfStacks);
    const result = [...mapOfStacks.values()].reduce(
      (acc, stack) => acc + stack.pop() || "",
      ""
    );
    console.log(result);
  });

  r.run();
}

main();
