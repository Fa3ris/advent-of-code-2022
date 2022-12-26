export function assertNumber(
  expected: number | undefined = undefined,
  actual: number
) {
  if (expected != undefined && expected !== actual) {
    throw new Error(`expected ${expected} but got ${actual}`);
  }
}
