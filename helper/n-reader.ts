import { createReadStream } from "fs";
import { createInterface } from "readline";
import { Reader } from "./reader";

export class N_Reader {
  constructor(private path: string, private readonly n: number) {}

  private linesListeners: Array<(lines: string[]) => void> = [];
  private closeListeners: Array<() => void> = [];
  private lines: string[] = [];

  private lineCallback(line: string): void {
    this.lines.push(line);

    if (this.lines.length >= this.n) {
      for (let l of this.linesListeners) {
        l(this.lines);
      }
      this.lines.length = 0;
    }
  }

  addLinesListener(listener: (lines: string[]) => void) {
    this.linesListeners.push(listener);
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

    rl.addListener("line", this.lineCallback.bind(this));

    for (let l of this.closeListeners) {
      rl.addListener("close", l);
    }

    rl.prependOnceListener("line", () => console.log("begin read file"));
    rl.prependOnceListener("close", () => console.log("end file reached"));
  }
}
