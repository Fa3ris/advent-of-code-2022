const regexCmd = /(?<cmd>cd|ls)\s*(?<path>\w+|\/|\.\.)?/;

const str = `\$ cd /
\$ ls`;
let m;

if ((m = regexCmd.exec(str)) !== null) {
  console.log("match cmd", m);
}

const regexEntry = /dir (?<dir>\w+)|(?<fsize>\d+) (?<fname>\w+(?:\.\w+)*)/;

const str2 = `dir ccjp
201615 gbpzf.gmg`;
let m2;

if ((m2 = regexEntry.exec(str2)) !== null) {
  console.log("match entry", m2);
}
