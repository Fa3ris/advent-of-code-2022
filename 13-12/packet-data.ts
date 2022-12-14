type Packet = Array<number | Packet>;

type List = Array<number | List>;

const LOG = true;

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

const res1 = comparePackets(
  parsePacket("[1,1,3,1,1]", 0).packet,
  parsePacket("[1,1,5,1,1]", 0).packet,
  0
);

console.log({ res1 });

const res2 = comparePackets(
  parsePacket("[[1],[2,3,4]]", 0).packet,
  parsePacket("[[1],4]", 0).packet,
  0
);

console.log({ res2 });

const res3 = comparePackets(
  parsePacket("[9]", 0).packet,
  parsePacket("[[8,7,6]]", 0).packet,
  0
);

console.log({ res3 });

const res4 = comparePackets(
  parsePacket("[[4,4],4,4]", 0).packet,
  parsePacket("[[4,4],4,4,4]", 0).packet,
  0
);

console.log({ res4 });

const res5 = comparePackets(
  parsePacket("[7,7,7,7]", 0).packet,
  parsePacket("[7,7,7]", 0).packet,
  0
);

console.log({ res5 });

const res6 = comparePackets(
  parsePacket("[]", 0).packet,
  parsePacket("[3]", 0).packet,
  0
);

console.log({ res6 });

const res7 = comparePackets(
  parsePacket("[[[]]]", 0).packet,
  parsePacket("[[]]", 0).packet,
  0
);

console.log({ res7 });

const res8 = comparePackets(
  parsePacket("[1,[2,[3,[4,[5,6,7]]]],8,9]", 0).packet,
  parsePacket("[1,[2,[3,[4,[5,6,0]]]],8,9]", 0).packet,
  0
);

console.log({ res8 });

testPackets(
  "[1,[2,[3,[4,[5,6,7]]]],8,9]",
  "[1,[2,[3,[4,[5,6,0]]]],8,9]",
  false
);

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

function testPackets(left: string, right: string, answer: boolean) {
  const res = compareTopPackets(
    parsePacket(left, 0).packet,
    parsePacket(right, 0).packet
  );

  if (answer !== res) {
    throw new Error(`expected ${answer}`);
  }
}

function compareTopPackets(left: Packet, right: Packet): boolean | undefined {
  return comparePackets(left, right, 0);
}

function comparePackets(
  left: Packet,
  right: Packet,
  index: number
): boolean | undefined {
  const leftVal = left[index];
  const rightVal = right[index];

  LOG &&
    console.log("compare", JSON.stringify({ left: leftVal, right: rightVal }));
  if (!leftVal && rightVal) {
    return true;
  } else if (leftVal && !rightVal) {
    return false;
  } else if (!leftVal && !rightVal) {
    return;
  }

  if (typeof leftVal === "number" && typeof rightVal === "number") {
    if (leftVal < rightVal) {
      return true;
    } else if (leftVal > rightVal) {
      return false;
    } else {
      // equality
      return comparePackets(left, right, ++index);
    }
  }

  if (Array.isArray(leftVal) && Array.isArray(rightVal)) {
    const res = comparePackets(leftVal, rightVal, 0);
    if (res !== undefined) {
      return res;
    } else {
      // equality
      return comparePackets(left, right, ++index);
    }
  }

  if (typeof leftVal === "number" && Array.isArray(rightVal)) {
    return comparePackets([leftVal], rightVal, 0);
  } else if (Array.isArray(leftVal) && typeof rightVal === "number") {
    return comparePackets(leftVal, [rightVal], 0);
  }

  throw new Error(
    `comparison failed ${JSON.stringify({ left, right, index })}`
  );
}
