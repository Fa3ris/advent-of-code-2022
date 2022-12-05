import { createReadStream } from "fs";
import { createInterface } from "readline";

export class AllReader {
  constructor(private path: string) {}

  private linesListeners: Array<(lines: string[]) => void> = [];
  private lines: string[] = [];

  addLinesListener(listener: (lines: string[]) => void) {
    this.linesListeners.push(listener);
  }

  run() {
    const rl = createInterface({
      input: createReadStream(this.path, {
        encoding: "utf8",
      }),
      crlfDelay: Infinity,
      terminal: false,
    });

    rl.addListener("line", (line) => this.lines.push(line));

    rl.addListener("close", () => {
      for (const l of this.linesListeners) {
        l(this.lines);
      }
    });

    rl.prependOnceListener("line", () => console.log("begin read file"));
    rl.prependOnceListener("close", () => console.log("end file reached"));
  }
}
