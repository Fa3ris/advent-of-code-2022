import { createReadStream } from "fs";
import { createInterface } from "readline";
import { resolve } from "path";

class Bag {
  constructor(private tuple: number[] = []) {}

  propose(value: number): void {
    let i = 0;
    for (; i < this.tuple.length; i++) {
      if (value > this.tuple[i]) {
        break;
      }
    }

    this.tuple.splice(i, 0, value);
  }

  getSum(): number {
    console.log("tuple", this.tuple);
    return this.tuple.slice(0, 3).reduce((acc, val) => acc + val);
  }
}

async function main() {
  let currentCal = 0;
  const rl = createInterface({
    input: createReadStream(resolve(__dirname, "input.txt"), {
      encoding: "utf8",
    }),
    crlfDelay: Infinity,
  });

  const bag = new Bag();

  rl.on("line", (input) => {
    const val = Number.parseInt(input);
    if (Number.isInteger(val)) {
      console.log("found number", val);
      currentCal += val;
    } else {
      bag.propose(currentCal);
      currentCal = 0;
      console.log("new line");
    }
  });

  rl.on("close", () => {
    console.log("end of file", bag.getSum());
  });
}

main();
