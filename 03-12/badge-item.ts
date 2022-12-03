import { resolve } from "path";
import { N_Reader } from "../helper/n-reader";

const a_charCode = "a".charCodeAt(0);

const CAPITAL_OFFSET = 26;

function computePriority(char: string): number {
  const isUpperCase = char === char.toUpperCase();

  const intruder_CharCode = char.toLowerCase().charCodeAt(0);

  const diff = intruder_CharCode - a_charCode;

  const priority = 1 + diff + (isUpperCase ? CAPITAL_OFFSET : 0);

  return priority;
}

function main() {
  let total = 0;
  //   const reader = new Reader(resolve(__dirname, "input.txt"));

  const reader3 = new N_Reader(resolve(__dirname, "input.txt"), 3);

  reader3.addLinesListener((lines) => {
    console.log(lines, "\n\n");

    const firstSet = lines[0]
      .split("")
      .reduce<Set<string>>((set, item) => set.add(item), new Set());
    const secondSet = lines[1]
      .split("")
      .reduce<Set<string>>((set, item) => set.add(item), new Set());

    const mergeSet = Array.from(firstSet.values()).reduce((set, item) => {
      if (secondSet.has(item)) {
        set.add(item);
      }
      return set;
    }, new Set());

    let badge: string = "";
    for (let char of lines[2].split("")) {
      if (mergeSet.has(char)) {
        badge = char;
        break;
      }
    }

    console.log("badge is", badge, "\n\n");

    const allHaveBadge = lines.every((line) => line.includes(badge));

    console.assert(allHaveBadge, "badge is missing in one bag");

    total += computePriority(badge);
  });

  reader3.addCloseListener(() => {
    console.log("total =", total);
  });

  reader3.run();

  //   reader.addLineListener((line) => {
  //     const first = line.substring(0, line.length * 0.5);
  //     const second = line.substring(line.length * 0.5);
  //     console.assert(
  //       first.length === second.length,
  //       "strings of different length"
  //     );
  //     const set = first.split("").reduce((set, item) => set.add(item), new Set());

  //     const res = second.split("").filter((item) => set.has(item));
  //     const intruder = res.at(0);
  //     if (!intruder) {
  //       return;
  //     }
  //     const isUpperCase = intruder === intruder.toUpperCase();

  //     const intruder_CharCode = intruder.toLowerCase().charCodeAt(0);

  //     const diff = intruder_CharCode - a_charCode;

  //     const priority = 1 + diff + (isUpperCase ? 26 : 0);
  //     const msg = `${line} becomes ${first} - ${second} - intruder is ${intruder} priority = ${priority}`;

  //     total += priority;
  //     console.log(msg);
  //   });

  //   reader.addCloseListener(() => {
  //     console.log("total =", total);
  //   });
  //   reader.run();
}

main();
