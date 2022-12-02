import { createReadStream } from "fs";
import { createInterface } from "readline";
import { resolve } from "path";

const stream = createReadStream(resolve(__dirname, "input.txt"), {
  encoding: "utf8",
});

const rl = createInterface({
  input: stream,
  crlfDelay: Infinity,
});

let maxCal = Number.NEGATIVE_INFINITY;

let currentCal = 0;
async function main() {
  rl.on("line", (input) => {
    const val = Number.parseInt(input);
    if (Number.isInteger(val)) {
      console.log("found number", val);
      currentCal += val;
    } else {
      maxCal = Math.max(maxCal, currentCal);
      currentCal = 0;
      console.log("new line");
    }
  });

  rl.on("close", () => {
    console.log("end of file", maxCal);
  });
}

main();
