import { resolve } from "path";
import { AllReader } from "../helper/all-reader";

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
      const re = /\s?\[(?<letter>\w+)\]\s?|\s{4}/g;

      let match;
      let col = 0;
      while ((match = re.exec(lines[j]))) {
        console.log(match);
        const letter = match.groups?.letter || "";
        if (letter) {
          mapOfStacks.get(col + 1)?.push(letter);
        }
        ++col;
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
    if (result !== "VWLCWGSDQ") {
      throw "invalid response";
    }
  });

  r.run();
}

main();
