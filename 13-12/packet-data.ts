import { readFileSync } from "fs";
import { resolve } from "path";

type Packet = Array<number | Packet>;

const LOG = true;

function testParse() {
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
}

function testCompare() {
  const res1 = comparePackets(
    parsePacket("[1,1,3,1,1]", 0).packet,
    parsePacket("[1,1,5,1,1]", 0).packet,
    0
  );

  console.log({ res1 });

  testPackets("[1,1,3,1,1]", "[1,1,5,1,1]", true);

  const res2 = comparePackets(
    parsePacket("[[1],[2,3,4]]", 0).packet,
    parsePacket("[[1],4]", 0).packet,
    0
  );

  console.log({ res2 });

  testPackets("[[1],[2,3,4]]", "[[1],4]", true);

  const res3 = comparePackets(
    parsePacket("[9]", 0).packet,
    parsePacket("[[8,7,6]]", 0).packet,
    0
  );

  console.log({ res3 });

  testPackets("[9]", "[[8,7,6]]", false);

  const res4 = comparePackets(
    parsePacket("[[4,4],4,4]", 0).packet,
    parsePacket("[[4,4],4,4,4]", 0).packet,
    0
  );

  console.log({ res4 });

  testPackets("[[4,4],4,4]", "[[4,4],4,4,4]", true);

  const res5 = comparePackets(
    parsePacket("[7,7,7,7]", 0).packet,
    parsePacket("[7,7,7]", 0).packet,
    0
  );

  console.log({ res5 });

  testPackets("[7,7,7,7]", "[7,7,7]", false);

  const res6 = comparePackets(
    parsePacket("[]", 0).packet,
    parsePacket("[3]", 0).packet,
    0
  );

  console.log({ res6 });

  testPackets("[]", "[3]", true);

  const res7 = comparePackets(
    parsePacket("[[[]]]", 0).packet,
    parsePacket("[[]]", 0).packet,
    0
  );

  console.log({ res7 });

  testPackets("[[[]]]", "[[]]", false);

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

  testPackets(
    "[[5,7,[9,[],[8],10,1]]]",
    "[[[5],[0,10,[2,10,6,0,8]]],[0,6,10,9]]",
    false
  );

  testPackets("[[1],[2,3,4]]", "[[1],4]", true);
}

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
  console.log("\n");
}

function comparePacketString(left: string, right: string): boolean | undefined {
  return compareTopPackets(
    parsePacket(left, 0).packet,
    parsePacket(right, 0).packet
  );
}
function compareTopPackets(left: Packet, right: Packet): boolean | undefined {
  LOG && console.log("compare top", JSON.stringify({ left, right }));
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

  // /!\/!\ check for explicit undefined: 0 IS FALSY /!\/!\
  if (leftVal === undefined && rightVal !== undefined) {
    return true;
  } else if (leftVal !== undefined && rightVal === undefined) {
    return false;
  } else if (leftVal === undefined && rightVal === undefined) {
    return undefined;
  }

  if (typeof leftVal === "number" && typeof rightVal === "number") {
    if (leftVal < rightVal) {
      return true;
    } else if (leftVal > rightVal) {
      return false;
    } else {
      // equality - check next values of current packets
      return comparePackets(left, right, ++index);
    }
  }

  let res: boolean | undefined;

  if (Array.isArray(leftVal) && Array.isArray(rightVal)) {
    res = comparePackets(leftVal, rightVal, 0);
  } else if (typeof leftVal === "number" && Array.isArray(rightVal)) {
    res = comparePackets([leftVal], rightVal, 0);
  } else if (Array.isArray(leftVal) && typeof rightVal === "number") {
    res = comparePackets(leftVal, [rightVal], 0);
  }

  if (res != undefined) {
    return res;
  } else {
    return comparePackets(left, right, ++index);
  }
}

function main(filename: string, answer?: number) {
  const lines = readFileSync(resolve(__dirname, filename), {
    encoding: "utf-8",
  }).split(/\r|\n|\r\n/);

  console.log(lines);
  let sum = 0;
  const validPairsIndices: number[] = [];
  const validPairs: { left: string; right: string }[] = [];
  let pairIndex = 0;
  for (let i = 0; i < lines.length; i += 3) {
    const left = lines[i];
    const right = lines[i + 1];
    console.log({ left, right });
    pairIndex++;
    if (
      compareTopPackets(
        parsePacket(left, 0).packet,
        parsePacket(right, 0).packet
      )
    ) {
      validPairs.push({ left, right });
      sum += pairIndex;
      validPairsIndices.push(pairIndex);
    }
  }

  console.log({ sum, validPairsIndices });

  const res = validPairsIndices.reduce((acc, val) => acc + val, 0);
  console.log(validPairs);
  console.log(res);

  if (answer && answer !== sum) {
    throw new Error(`expected ${answer}`);
  }
}

function main2(filename: string, answer?: number) {
  const lines = readFileSync(resolve(__dirname, filename), {
    encoding: "utf-8",
  })
    .split(/\r|\n|\r\n/)
    .filter((s) => s.length !== 0);

  lines.sort(PacketComparator);

  const dividers = ["[[2]]", "[[6]]"];

  const indices: number[] = [];
  let startIndex = 0;
  for (let i = 0; i < dividers.length; i++) {
    const divider = dividers[i];
    for (let j = startIndex; j < lines.length; j++) {
      const isInOrder = comparePacketString(divider, lines[j]);
      if (isInOrder === true) {
        indices.push(j + 1);
        lines.splice(j, 0, divider);
        startIndex = j;
        break;
      }
    }
  }

  console.log(lines);
  console.log(indices);

  const decoderKey = indices.reduce((acc, val) => acc * val, 1);
  console.log({ decoderKey });

  if (answer && answer !== decoderKey) {
    throw new Error(`expected ${answer}`);
  }
}

main("test.txt", 13);
// 6133 is too high
// 6117 is too high
// 6113 is too high
main("input.txt", 6101);
main2("test.txt", 140);
main2("input.txt", 21909);

function PacketComparator(left: string, right: string): number {
  const res = compareTopPackets(
    parsePacket(left, 0).packet,
    parsePacket(right, 0).packet
  );

  if (res === undefined) {
    return 0;
  }

  return res === true ? -1 : 1;
}


