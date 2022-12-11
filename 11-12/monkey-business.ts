import { readFileSync } from "fs";
import { resolve } from "path";

type Worry = number;
type BigWorry = bigint;
type InspectOperation = (val: Worry) => Worry;

type InspectOperationBig = (val: BigWorry) => BigWorry;
type ReliefFn = (val: Worry) => Worry;

function relief(val: Worry): Worry {
  return Math.floor(val / 3);
}

type TargetDecision = (val: Worry) => number;

type TargetDecision2 = (val: BigWorry) => {
  newVal: BigWorry;
  dest: number;
};

type MonkeyConfig = {
  inspect: InspectOperation;
  inspectBig: InspectOperationBig;
  relief: ReliefFn;
  decide: TargetDecision;
  decide2: TargetDecision2;
};

class Monkey {
  private items: Item[] = [];

  private _log: boolean = true;
  set log(b: boolean) {
    this._log = b;
  }
  constructor(
    private _id: number,
    private config: MonkeyConfig,
    itemsLevels: number[]
  ) {
    for (let level of itemsLevels) {
      this.items.push(new Item(this, level));
    }
  }

  get id() {
    return this._id;
  }

  private _passTo: ((item: Item, monkeyId: number) => void) | undefined;

  set passTo(fn: (item: Item, monkeyId: number) => void) {
    this._passTo = fn;
  }

  get worries() {
    return this.items.map((i) => i.worry);
  }

  get bigWorries() {
    return this.items.map((i) => i.bigWorry);
  }

  receive(item: Item) {
    this.items.push(item);
  }

  private _inspected = 0;

  get inspected() {
    return this._inspected;
  }
  turn() {
    let item: Item | undefined;
    this._log && console.log(`monkey ${this._id} plays`);
    while ((item = this.items.shift())) {
      this._log && console.log("begin proceed item", item.worry);
      this._inspected++;
      item.worry = this.config.inspect(item.worry);
      item.worry = this.config.relief(item.worry);
      const newMonkey = this.config.decide(item.worry);
      this._passTo?.(item, newMonkey);
      this._log &&
        console.log(
          "end proceed item",
          item.worry,
          `passed to monkey ${newMonkey}`
        );
    }
    this._log && console.log(`monkey ${this._id} ends`);
  }

  turnV2() {
    let item: Item | undefined;
    this._log && console.log(`monkey ${this._id} plays`);
    while ((item = this.items.shift())) {
      this._log && console.log("begin proceed item", item.bigWorry);
      this._inspected++;
      item.bigWorry = this.config.inspectBig(item.bigWorry);
      this._log && console.log("after inspect worry =", item.bigWorry);
      const { dest: newMonkey, newVal } = this.config.decide2(item.bigWorry);
      item.bigWorry = newVal;
      this._log && console.log("after decide worry =", item.bigWorry);
      this._passTo?.(item, newMonkey);
      this._log &&
        console.log(
          "end proceed item",
          item.worry,
          `passed to monkey ${newMonkey}`
        );
    }
    this._log && console.log(`monkey ${this._id} ends`);
  }
}

class Item {
  private hist: Monkey[] = [];

  get worry() {
    return this._worry;
  }
  set worry(w: Worry) {
    this._worry = w;
  }

  get bigWorry(): bigint {
    return this._bigWorry;
  }

  set bigWorry(w: bigint) {
    this._bigWorry = w;
  }

  private _bigWorry: bigint;

  passTo(m: Monkey) {
    this.hist.push(m);
  }

  constructor(private original: Monkey, private _worry: Worry) {
    this._bigWorry = BigInt(_worry);
    this.passTo(original);
  }
}

const BinaryOpFn: Record<string, Function> = {
  "+": (op1: number, op2: number) => op1 + op2,
  "*": (op1: number, op2: number) => op1 * op2,
};

function createInspect(operator: string, op2: string): InspectOperation {
  const fn = BinaryOpFn[operator];

  const op2Value = Number.parseInt(op2);

  if (Number.isInteger(op2Value)) {
    return (val: Worry) => {
      const newVal = fn(val, op2Value);

      if (!Number.isSafeInteger(newVal)) {
        throw new Error("not a safe integer " + newVal);
      }
      return newVal;
    };
  } else {
    return (val: Worry) => {
      const newVal = fn(val, val);

      if (!Number.isSafeInteger(newVal)) {
        throw new Error("not a safe integer " + newVal);
      }
      return newVal;
    };
  }
}

const BinaryOpBigFn: Record<string, Function> = {
  "+": (op1: bigint, op2: bigint) => op1 + op2,
  "*": (op1: bigint, op2: bigint) => op1 * op2,
};

function createInspectBig(operator: string, op2: string): InspectOperationBig {
  const fn = BinaryOpBigFn[operator];

  const op2Value = Number.parseInt(op2);

  if (Number.isInteger(op2Value)) {
    return (val: BigWorry) => {
      const bigOP2 = BigInt(op2Value);
      const newVal = fn(val, bigOP2);

      return newVal;
    };
  } else {
    return (val: BigWorry) => {
      const newVal = fn(val, val);
      return newVal;
    };
  }
}

function createDecider(
  divider: number,
  truthyDest: number,
  falsyDest: number
): TargetDecision {
  return (val: Worry) => (val % divider === 0 ? truthyDest : falsyDest);
}

function createDeciderBig(
  divider: number,
  truthyDest: number,
  falsyDest: number
): TargetDecision2 {
  const dividerBig = BigInt(divider);
  return (val: BigWorry) => {
    const remaining = val % dividerBig;
    if (remaining === BigInt(0)) {
      return {
        newVal: val,
        dest: truthyDest,
      };
    } else {
      return {
        newVal: val,
        dest: falsyDest,
      };
    }
  };
}

const monkeyIdRE = /(?<id>\d+):$/;
const itemsRE = /\d+/g;
const divisorRE = /\d+/;
const operationRE = /(?<op1>\w+) (?<operator>\+|\*) (?<op2>\w+)/;
const trueRE = /\d+/;
const falseRE = /\d+/;

function main(filename: string, answer?: number, version = 1) {
  const lines = readFileSync(resolve(__dirname, filename), {
    encoding: "utf-8",
  }).split(/\r|\n|\r\n/);

  const monkeyMap = new Map<number, Monkey>();
  for (let i = 0; i < lines.length; ) {
    const monkeyInstructions = lines.slice(i, i + 6);
    console.log(monkeyInstructions);

    const match0 = monkeyInstructions[0].match(monkeyIdRE);

    const monkeyId = Number(match0?.groups?.id);

    const match1 = monkeyInstructions[1].match(itemsRE);

    const items = match1;

    const match2 = monkeyInstructions[2].match(operationRE);
    const op = {
      op1: match2?.groups?.op1,
      op2: match2?.groups?.op2,
      operator: match2?.groups?.operator,
    };

    const match3 = monkeyInstructions[3].match(divisorRE);

    const divisor = match3?.[0];

    const match4 = monkeyInstructions[4].match(trueRE);
    const trueDest = match4?.[0];

    const match5 = monkeyInstructions[5].match(falseRE);
    const falseDest = match5?.[0];

    console.log({
      id: monkeyId,
      items: items,
      op,
      divisor,
      trueDest,
      falseDest,
    });

    const inspectOp = createInspect(op.operator || "", op.op2 || "");
    const inspectOpBig = createInspectBig(op.operator || "", op.op2 || "");

    const decider = createDecider(
      Number(divisor),
      Number(trueDest),
      Number(falseDest)
    );

    const decider2 = createDeciderBig(
      Number(divisor),
      Number(trueDest),
      Number(falseDest)
    );

    const config: MonkeyConfig = {
      decide: decider,
      inspect: inspectOp,
      relief: relief,
      decide2: decider2,
      inspectBig: inspectOpBig,
    };

    const worries = items?.map(Number) || [];

    const monkey = new Monkey(monkeyId, config, worries);

    monkeyMap.set(monkeyId, monkey);

    i += 7;
  }

  const passTo = function (item: Item, monkeyId: number) {
    const monkey = monkeyMap.get(monkeyId);
    if (monkey) {
      item.passTo(monkey);
      monkey.receive(item);
    }
  };

  const log = false;

  for (let m of monkeyMap.values()) {
    m.passTo = passTo;
    m.log = log;
  }

  const play1 = function () {
    const turns = 20;
    for (let t = 0; t < turns; t++) {
      for (let key of monkeyMap.keys()) {
        const monkeyToPlay = monkeyMap.get(key);
        monkeyToPlay?.turn();
      }

      console.log("after turn", t + 1);
      console.group();
      for (let key of monkeyMap.keys()) {
        console.log(`monkey ${key}`, monkeyMap.get(key)?.worries);
      }
      console.groupEnd();
    }

    const inspected: number[] = [];
    for (let m of monkeyMap.values()) {
      console.log(`monkey ${m.id} inspected ${m.inspected} items`);
      inspected.push(m.inspected);
    }

    inspected.sort((a, b) => b - a);
    console.log(inspected);
    const max2 = inspected.slice(0, 2);
    console.log(max2);
    const monkeyBusiness = max2.reduce((acc, val) => acc * val, 1);
    console.log({ monkeyBusiness });

    if (answer && answer != monkeyBusiness) {
      throw new Error(`expected ${answer}`);
    }
  };

  const play2 = function () {
    const targetTurns = [
      1,
      20,
      ...[...Array(10).keys()].map((v) => (v + 1) * 1e3),
    ];
    const turns = 1e4;
    for (let t = 0; t < turns; t++) {
      for (let key of monkeyMap.keys()) {
        const monkeyToPlay = monkeyMap.get(key);
        monkeyToPlay?.turnV2();
      }

      console.log("after turn", t + 1);
      if (log) {
        console.group();
        for (let key of monkeyMap.keys()) {
          console.log(`monkey ${key}`, monkeyMap.get(key)?.worries);
        }
        console.groupEnd();
      }

      if (targetTurns.includes(t + 1)) {
        console.log("after turn", t + 1);
        console.group();

        for (let m of monkeyMap.values()) {
          console.log(`monkey ${m.id} inspected ${m.inspected} items`);
        }
        console.groupEnd();
      }
    }

    const inspected: number[] = [];
    for (let m of monkeyMap.values()) {
      console.log(`monkey ${m.id} inspected ${m.inspected} items`);
      inspected.push(m.inspected);
    }

    inspected.sort((a, b) => b - a);
    console.log(inspected);
    const max2 = inspected.slice(0, 2);
    console.log(max2);
    const monkeyBusiness = max2.reduce((acc, val) => acc * val, 1);
    console.log({ monkeyBusiness });
  };

  if (version === 1) {
    play1();
  } else {
    play2();
  }
}

// main("test.txt", 10605, 1);
main("test.txt", 10605, 2);
// main("input.txt", 119715);
