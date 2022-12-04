import { resolve } from "path";
import { Reader } from "../helper/reader";

const regexp = /(\d+)-(\d+),(\d+)-(\d+)/;

function main() {
  const r = new Reader(resolve(__dirname, "input.txt"));

  let totalOverlaps = 0;
  r.addLineListener((line) => {
    const res = regexp.exec(line);

    if (res) {
      const [_, a, b, c, d] = res;

      const x1 = Number(a),
        x2 = Number(b),
        y1 = Number(c),
        y2 = Number(d);

      const overlap = x1 <= y2 && x2 >= y1;
      console.log(line, { x1, x2, y1, y2 }, overlap ? "overlap" : "");

      if (overlap) {
        totalOverlaps++;
      }
    }
  });

  r.addCloseListener(() => {
    console.log("total overlaps", totalOverlaps);
  });

  r.run();
}

main();
