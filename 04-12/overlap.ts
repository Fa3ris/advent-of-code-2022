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

      const range1WithinRange2 = x1 >= y1 && x2 <= y2;
      const range2WithinRange1 = y1 >= x1 && y2 <= x2;

      const overlap = range1WithinRange2 || range2WithinRange1;
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
