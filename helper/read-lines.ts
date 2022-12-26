import { readFileSync } from "fs";
import { resolve } from "path";

export function readLines(path: string) {
  return readFileSync(resolve(path), {
    encoding: "utf-8",
  }).split(/\r|\n|\r\n/);
}
