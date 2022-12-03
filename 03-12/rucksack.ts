import { resolve } from "path";
import { Reader } from "../helper/reader";

const a_charCode = "a".charCodeAt(0);

function main() {
  let total = 0;
  const reader = new Reader(resolve(__dirname, "input.txt"));

  reader.addLineListener((line) => {
    const first = line.substring(0, line.length * 0.5);
    const second = line.substring(line.length * 0.5);
    console.assert(
      first.length === second.length,
      "strings of different length"
    );
    const set = first.split("").reduce((set, item) => set.add(item), new Set());

    const res = second.split("").filter((item) => set.has(item));
    const intruder = res.at(0);
    if (!intruder) {
      return;
    }
    const isUpperCase = intruder === intruder.toUpperCase();

    const intruder_CharCode = intruder.toLowerCase().charCodeAt(0);

    const diff = intruder_CharCode - a_charCode;

    const priority = 1 + diff + (isUpperCase ? 26 : 0);
    const msg = `${line} becomes ${first} - ${second} - intruder is ${intruder} priority = ${priority}`;

    total += priority;
    console.log(msg);
  });

  reader.addCloseListener(() => {
    console.log("total =", total);
  });
  reader.run();
}

function computePriority(char: string): number {
  const isUpperCase = char === char.toUpperCase();

  const intruder_CharCode = char.toLowerCase().charCodeAt(0);

  const diff = intruder_CharCode - a_charCode;

  const priority = 1 + diff + (isUpperCase ? 26 : 0);

  return priority;
}
main();
