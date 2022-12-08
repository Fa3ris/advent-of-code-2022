import { resolve } from "path";
import { AllReader } from "../helper/all-reader";

const regexCmd = /(?<cmd>cd|ls)\s*(?<path>\w+|\/|\.\.)?/;

const regexEntry = /dir (?<dir>\w+)|(?<fsize>\d+) (?<fname>\w+(?:\.\w+)*)/;

class FS {
  private root: DirNode;
  private cwd: DirNode;

  constructor() {
    this.root = {
      type: "dir",
      name: "/",
      children: [],
    };

    this.cwd = this.root;
  }

  cd(path: string) {
    if (path === "/") {
      console.log("go to root");
      this.cwd = this.root;
      return;
    }

    if (path === "..") {
      console.log("go to parent");
      if (!this.cwd.parent) {
        throw new Error(`${this.cwd} has no parent`);
      }
      this.cwd = this.cwd.parent;
      return;
    }

    const dest = this.cwd.children
      .filter((child): child is DirNode => child.type === "dir")
      .find((child) => child.name === path);

    if (!dest) {
      throw new Error(`${this.cwd} has no child ${path}`);
    }

    this.cwd = dest;
  }

  ls(entry: Entry) {
    if (entry.dir) {
      console.log(`add dir ${entry.dir} to ${this.cwd.name}`);
      this.cwd.children.push({
        type: "dir",
        name: entry.dir,
        parent: this.cwd,
        children: [],
      });
    } else {
      console.log(`add file ${entry.fname} to ${this.cwd.name}`);
      if (!entry.fname) {
        throw new Error(`missing file name in entry ${entry}`);
      }
      this.cwd.children.push({
        type: "file",
        name: entry.fname,
        size: Number(entry.fsize),
      });
    }
  }

  getTotalSumOfDirectoriesWithSizeAtMost(size: number): number {
    const root = this.sumNode(this.root);
    const validNodes: SumNode[] = [];
    this.visitSumsPredicate(root, (node) => node.size <= size, validNodes);
    // this.visitSums(root, size, validNodes);
    const res = validNodes.reduce((sum, n) => sum + n.size, 0);
    return res;
  }

  getSizeOfDirToDelete(totalSpace: number, requiredSpace: number): number {
    const root = this.sumNode(this.root);
    console.log("root size is", root.size);
    const freeSpace = totalSpace - root.size;
    console.log("free space is", freeSpace);
    const spaceToDelete = requiredSpace - freeSpace;
    console.log("need to find at least space", spaceToDelete);
    const validNodes: SumNode[] = [];
    this.visitSumsPredicate(
      root,
      (node) => node.size >= spaceToDelete,
      validNodes
    );

    console.log(validNodes);

    validNodes.sort((n1, n2) => n1.size - n2.size);

    return validNodes[0].size;
  }

  private visitSumsPredicate(
    node: SumNode,
    predicate: (node: SumNode) => boolean,
    validNodes: SumNode[]
  ) {
    if (predicate(node)) {
      validNodes.push(node);
    }
    node.children?.forEach((current) =>
      this.visitSumsPredicate(current, predicate, validNodes)
    );
  }

  private visitSums(node: SumNode, n: number, validNodes: SumNode[]) {
    if (node.size <= n) {
      validNodes.push(node);
    }
    node.children?.forEach((current) => this.visitSums(current, n, validNodes));
  }

  private sumNode(dir: DirNode): SumNode {
    const fileSum = dir.children
      .filter(isFileNode)
      .reduce((sum, file) => sum + file.size, 0);
    const dirs = dir.children.filter(isDirNode);

    if (!dirs.length) {
      return {
        name: dir.name,
        size: fileSum,
        path: [dir.name],
      };
    }

    const dirNodes = dirs.map((child) => {
      const node = this.sumNode(child);
      node.path = [dir.name, ...node.path];
      return node;
    });

    const dirsSum = dirNodes.reduce((acc, val) => acc + val.size, 0);
    return {
      name: dir.name,
      path: [dir.name],
      size: fileSum + dirsSum,
      children: dirNodes,
    };
  }

  /**
   * @deprecated
   */
  private getTotalSumWithLimit(
    dir: DirNode
  ): { size: number; path: string[]; name: string }[] {
    const fileSum = dir.children
      .filter(isFileNode)
      .reduce((sum, file) => sum + file.size, 0);
    const dirs = dir.children.filter(isDirNode);

    // leaf dir
    if (!dirs.length) {
      return [
        {
          size: fileSum,
          path: [dir.name],
          name: dir.name,
        },
      ];
    }

    const dirSizes = dirs.flatMap((dir) => this.getTotalSumWithLimit(dir));
    dirSizes.forEach((size) => {
      size.path = [dir.name, ...size.path];
    });
    const dirsSum = dirSizes.reduce((acc, val) => acc + val.size, 0);

    const currentSize = {
      size: fileSum + dirsSum,
      path: [dir.name],
      name: dir.name,
    };

    return [currentSize, ...dirSizes];
  }
}

type SumNode = {
  name: string;
  size: number;
  path: string[];
  children?: SumNode[];
};

function isDirNode(child: DirNode | FileNode): child is DirNode {
  return child.type === "dir";
}
function isFileNode(child: DirNode | FileNode): child is FileNode {
  return child.type === "file";
}

function createFS(instructions: string[]): FS {
  const fs = new FS();
  let line = 0;
  while (line < instructions.length) {
    const cmd = parseCmd(instructions[line]);
    if (cmd.cmd === "ls") {
      console.log("ls");
      let entry: Entry | undefined;
      line++;
      while (
        line < instructions.length &&
        (entry = parseEntry(instructions[line])) !== undefined
      ) {
        console.log("find entry", entry);
        fs.ls(entry);
        line++;
      }
    } else if (cmd.cmd === "cd") {
      console.log("cd", cmd.path);
      fs.cd(cmd.path);
      line++;
    }
  }

  return fs;
}
function run(instructions: string[]): void {
  const fs = createFS(instructions);
  const n = 100000;
  const res = fs.getTotalSumOfDirectoriesWithSizeAtMost(100000);
  console.log(`total size of dir with size at most ${n}`, res);

  const answer = 1513699;
  if (res !== answer) {
    throw new Error(`answer must be ${answer}`);
  }
}

type Q1 = {
  dirLimitSize: number;
  answer?: number;
};

type Q2 = {
  totalSpace: number;
  requiredSpace: number;
  answer?: number;
};
function createRunner(path: string, q: { q1?: Q1; q2?: Q2 }): { run(): void } {
  const r = new AllReader(resolve(__dirname, path));

  const { q1, q2 } = q;

  const fn = (lines: string[]) => {
    const fs = createFS(lines);

    let res1: number | undefined;
    let res2: number | undefined;
    if (q1) {
      res1 = fs.getTotalSumOfDirectoriesWithSizeAtMost(q1.dirLimitSize);
      console.log(
        `total size of dir with size at most ${q1.dirLimitSize} =`,
        res1
      );
      if (q1.answer) {
        if (res1 !== q1.answer) {
          throw new Error(`answer 1 must be ${q1.answer}`);
        } else {
          console.log("correct answer 1");
        }
      }
    }

    if (q2) {
      res2 = fs.getSizeOfDirToDelete(q2.totalSpace, q2.requiredSpace);
      console.log(
        `size of dir to delete for free space ${q2.totalSpace} and required space ${q2.requiredSpace} =`,
        res2
      );
      if (q2.answer) {
        if (res2 !== q2.answer) {
          throw new Error(`answer 2 must be ${q2.answer}`);
        } else {
          console.log("correct answer 2");
        }
      }
    }
  };
  r.addLinesListener(fn);
  return r;
}

function main() {
  const runnerTest = createRunner(resolve(__dirname, "test.txt"), {
    q1: {
      dirLimitSize: 100000,
      answer: 95437,
    },
    q2: {
      totalSpace: 70000000,
      requiredSpace: 30000000,
      answer: 24933642,
    },
  });

  const runner = createRunner(resolve(__dirname, "input.txt"), {
    q1: {
      dirLimitSize: 100000,
      answer: 1513699,
    },
    q2: {
      totalSpace: 70000000,
      requiredSpace: 30000000,
    },
  });

  // runnerTest.run();
  runner.run();
}

main();

type FSNode = {
  type: "file" | "dir";
};

type FileNode = FSNode & {
  type: "file";
  name: string;
  size: number;
};

type DirNode = FSNode & {
  type: "dir";
  name: string;
  parent?: DirNode;
  children: Array<FileNode | DirNode>;
};

function parseCmd(line: string): Cmd {
  const cmd = regexCmd.exec(line);

  if (!cmd?.groups) {
    throw new Error(`invalid cmd ${line}`);
  }
  return {
    type: "CMD",
    ...cmd.groups,
  } as Cmd;
}

function parseEntry(line: string): Entry | undefined {
  const entry = regexEntry.exec(line);

  if (!entry?.groups) {
    return;
  }
  return {
    type: "ENTRY",
    ...entry.groups,
  } as Entry;
}

type Line = {
  type: "CMD" | "ENTRY";
};

type Cmd = Line & {
  type: "CMD";
  cmd: "cd" | "ls";
  path: string;
};

type Entry = Line & {
  type: "ENTRY";
  dir?: string;
  fsize?: string;
  fname?: string;
};
