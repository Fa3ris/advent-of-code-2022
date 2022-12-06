const re = /\s?\[(?<letter>\w+)\]\s?|\s{3}/g;

const input = "[C]     [N] [G]         [W]     [P]";

let match;
const matches = [];
while ((match = re.exec(input))) {
  console.log(match);
  const letter = match.groups?.letter || "";
  matches.push(letter);
}
console.log(matches);

export {};
