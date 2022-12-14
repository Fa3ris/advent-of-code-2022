type Packet = Array<number | Packet>;

type List = Array<number | List>;

const test1 = "[1,1,3,1,1]";
const parse1 = parsePacket(test1, 0);
console.log({ parse1: JSON.stringify(parse1.packet) });

const test2 = "[[1],[2,3,4]]";
const parse2 = parsePacket(test2, 0);
console.log({ parse2: parse2.packet });

const test3 = "[[1],4]";
const parse3 = parsePacket(test3, 0);
console.log({ parse3: parse3.packet });

const test4 = "[[[]]]";
const parse4 = parsePacket(test4, 0);
console.log({ parse4: parse4.packet });

const test5 = "[1,[2,[3,[4,[5,6,7]]]],8,9]";
const parse5 = parsePacket(test5, 0);
console.log({ parse5: JSON.stringify(parse5.packet) });

function parsePacket(
  line: string,
  index: number
): {
  newIndex: number;
  packet: Packet;
} {
  if (line[index] !== "[") {
    throw new Error(`packet must begin with [`);
  }

  ++index;
  const packet: Packet = [];
  while (index < line.length) {
    const char = line.charAt(index);

    if (char === "[") {
      const { newIndex, packet: subPacket } = parsePacket(line, index);
      packet.push(subPacket);
      index = newIndex;
    } else if (/\d/.test(char)) {
      const { newIndex, value } = parseNumber(line, index);
      packet.push(value);
      index = newIndex;
    } else if (char === ",") {
      index++;
    } else if (char === "]") {
      break;
    } else {
      throw new Error(`unexpected char '${char}' at index ${index}`);
    }
  }

  if (line[index] !== "]") {
    throw new Error(`packet must end with ]`);
  }
  return {
    newIndex: ++index, // go past ']'
    packet,
  };
}

function parseNumber(
  line: string,
  index: number
): { newIndex: number; value: number } {
  let s = "";
  let i = index;
  let char = line.charAt(i);
  while (/\d/.test(char)) {
    s += char;
    i++;
    char = line.charAt(i);
  }
  return {
    newIndex: i,
    value: Number(s),
  };
}
