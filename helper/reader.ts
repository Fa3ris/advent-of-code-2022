import { createReadStream } from "fs";
import { createInterface } from "readline";

export class Reader {
  private lineListeners: Array<(input: string) => void> = [];
  private closeListeners: Array<() => void> = [];
  constructor(private path: string) {}

  addLineListener(listener: (input: string) => void) {
    this.lineListeners.push(listener);
  }

  addCloseListener(listener: () => void) {
    this.closeListeners.push(listener);
  }

  run() {
    const rl = createInterface({
      input: createReadStream(this.path, {
        encoding: "utf8",
      }),
      crlfDelay: Infinity,
      terminal: false,
    });

    for (let l of this.lineListeners) {
      rl.addListener("line", l);
    }

    for (let l of this.closeListeners) {
      rl.addListener("close", l);
    }

    rl.prependOnceListener("line", () => console.log("begin read file"));
    rl.prependOnceListener("close", () => console.log("end file reached"));
  }
}
