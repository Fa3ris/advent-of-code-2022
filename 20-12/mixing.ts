import { resolve } from "path";
import { assertNumber } from "../helper/assert";
import { readLines } from "../helper/read-lines";

type NumberHolder = {
  value: number;
  index: number;
};

const LOG = false;
function shift(
  holders: NumberHolder[],
  holderIndex: number,
  absoluteShift: number,
  sign: number
) {
  const maxIndex = holders.length - 1;

  const toShift = holders[holderIndex];
  const prevIndex = toShift.index;

  LOG && console.log({ absoluteShift, sign });

  if (sign > 0) {
    const canAdvance = maxIndex - prevIndex;
    LOG && console.log("canAdvance", canAdvance);
    if (absoluteShift >= canAdvance) {
      const newShift = absoluteShift - canAdvance;
      LOG && console.log("loop back to beginning", { newShift });

      holders
        .filter((h) => h.index < prevIndex)
        .forEach((h) => {
          h.index++;
        });
      toShift.index = 0;
      shift(holders, holderIndex, newShift, sign);
    } else {
      LOG && console.log("can advance normally");
      const newIndex = prevIndex + absoluteShift;
      holders
        .filter((h) => h.index > prevIndex && h.index <= newIndex)
        .forEach((h) => {
          h.index--;
        });
      toShift.index = newIndex; // shift after updating others
    }
  } else if (sign < 0) {
    const canGoBack = prevIndex - 0;
    LOG && console.log("canGoBack", canGoBack);
    if (absoluteShift >= canGoBack) {
      const newShift = absoluteShift - canGoBack;
      LOG && console.log("loop back to end", { newShift });

      holders
        .filter((h) => h.index > prevIndex)
        .forEach((h) => {
          h.index--;
        });
      toShift.index = maxIndex;
      shift(holders, holderIndex, newShift, sign);
    } else {
      LOG && console.log("can go back normally");
      const newIndex = prevIndex - absoluteShift;
      holders
        .filter((h) => h.index >= newIndex && h.index < prevIndex)
        .forEach((h) => {
          h.index++;
        });
      toShift.index = newIndex; // shift after updating others
    }
  }
}

function mixHolders(holders: NumberHolder[], holderIndex: number) {
  const toMix = holders[holderIndex];

  const absoluteShift = Math.abs(toMix.value) % (holders.length - 1);
  const sign = Math.sign(toMix.value);

  shift(holders, holderIndex, absoluteShift, sign);
}

function testMix(expected: number[][], holders: NumberHolder[]) {
  testArray(expected[0], toArray(holders));

  for (let index = 0; index < holders.length; index++) {
    mixHolders(holders, index);
    try {
      testArray(expected[index + 1], toArray(holders));
    } catch (error) {
      console.log(`error at mix ${index}`);
      throw error;
    }
  }
}
function mix(file: number[]) {
  const holders = file.map((val, index) => {
    return { value: val, index: index };
  });

  let index = 0;

  const expectedSteps: number[][] = [
    [1, 2, -3, 3, -2, 0, 4],
    [2, 1, -3, 3, -2, 0, 4],
    [1, -3, 2, 3, -2, 0, 4],
    [1, 2, 3, -2, -3, 0, 4],
    [1, 2, -2, -3, 0, 3, 4],
    [1, 2, -3, 0, 3, 4, -2],
    [1, 2, -3, 0, 3, 4, -2],
    [1, 2, -3, 4, 0, 3, -2],
  ];

  const holders2 = file.map((val, index) => {
    return { value: val, index: index };
  });

  testMix(expectedSteps, holders2);

  testArray([1, 2, -3, 3, -2, 0, 4], toArray(holders));

  mixHolders(holders, index);
  testArray([2, 1, -3, 3, -2, 0, 4], toArray(holders));
  index++;
  mixHolders(holders, index);
  testArray([1, -3, 2, 3, -2, 0, 4], toArray(holders));

  index++;
  mixHolders(holders, index);
  testArray([1, 2, 3, -2, -3, 0, 4], toArray(holders));

  index++;
  mixHolders(holders, index);
  testArray([1, 2, -2, -3, 0, 3, 4], toArray(holders));

  index++;
  mixHolders(holders, index);
  testArray([1, 2, -3, 0, 3, 4, -2], toArray(holders));

  index++;
  mixHolders(holders, index);
  testArray([1, 2, -3, 0, 3, 4, -2], toArray(holders));

  index++;
  mixHolders(holders, index);
  testArray([1, 2, -3, 4, 0, 3, -2], toArray(holders));

  const val1000th = findValueAtIndex(holders, 1000);
  assertNumber(4, val1000th);

  const val2000th = findValueAtIndex(holders, 2000);
  assertNumber(-3, val2000th);

  const val3000th = findValueAtIndex(holders, 3000);
  assertNumber(2, val3000th);

  console.log({ sum: val1000th + val2000th + val3000th });
}

function findValueAtIndex(holders: NumberHolder[], i: number) {
  const zeroHolder = holders.find((h) => h.value === 0);

  const { index: startIndex } = zeroHolder || {};

  if (startIndex === undefined) {
    throw new Error("0 holder not found");
  }

  const shift = i % holders.length;

  LOG && console.log({ startIndex, shift });

  let k = startIndex;
  for (let j = 0; j < shift; j++) {
    k++;
    if (k > holders.length - 1) {
      k = 0;
    }
  }

  const holder = holders.find((h) => h.index === k);

  if (!holder) {
    throw new Error(`no holder found`);
  }

  return holder.value;
}

function toArray(holders: NumberHolder[]) {
  const sortedCopy = [...holders].sort((a, b) => a.index - b.index);

  const mixed = sortedCopy.map((v) => v.value);

  return mixed;
}

if (false) {
  const file = [1, 2, -3, 3, -2, 0, 4];
  mix(file);
}

function testArray(a1: any[], a2: any[]) {
  if (a1 === a2) {
    return;
  }

  if (a1.length !== a2.length) {
    throw new Error("different length");
  }

  for (let index = 0; index < a1.length; index++) {
    if (a1[index] !== a2[index]) {
      throw new Error(`difference at index ${index}\n${a1}\n${a2}`);
    }
  }
}

function main(filename: string, answer?: number) {
  const lines = readLines(resolve(__dirname, filename));
  const numbers = lines.map(Number);

  const holders = numbers.map((val, index) => {
    return { value: val, index: index };
  });

  for (let index = 0; index < holders.length; index++) {
    mixHolders(holders, index);
  }

  const val1000th = findValueAtIndex(holders, 1000);

  const val2000th = findValueAtIndex(holders, 2000);

  const val3000th = findValueAtIndex(holders, 3000);

  const sum = val1000th + val2000th + val3000th;
  console.log({ sum });

  assertNumber(answer, sum);
}

if (false) {
  main("test.txt", 3);
  main("input.txt", 1591);
}

function main2(filename: string, key: number = 811589153, answer?: number) {
  const lines = readLines(resolve(__dirname, filename));
  const numbers = lines.map(Number).map((v) => v * key);

  const holders = numbers.map((val, index) => {
    return { value: val, index: index };
  });

  LOG && console.log(toArray(holders));

  for (let mix = 0; mix < 10; mix++) {
    for (let index = 0; index < holders.length; index++) {
      mixHolders(holders, index);
    }
    LOG && console.log("after mix", mix + 1);
    LOG && console.log(toArray(holders));
  }

  const val1000th = findValueAtIndex(holders, 1000);

  const val2000th = findValueAtIndex(holders, 2000);

  const val3000th = findValueAtIndex(holders, 3000);

  const sum = val1000th + val2000th + val3000th;
  console.log({ sum });

  assertNumber(answer, sum);
}

main2("test.txt", 811589153, 1623178306); // position of the values in the array do not match example but we only care about the cycling order
main2("input.txt", 811589153, 14579387544492);
