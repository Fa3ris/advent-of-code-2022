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
    this.visitSums(root, size, validNodes);
    const res = validNodes.reduce((sum, n) => sum + n.size, 0);
    return res;
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

function run(instructions: string[]): void {
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
  const res = fs.getTotalSumOfDirectoriesWithSizeAtMost(100000);
  console.log(res);

  if (res === 1290203) {
    throw "invalid response";
  }

  if (res === 1386384) {
    throw "invalid response";
  }

  if (res !== 1513699) {
    throw new Error(`answer must be ${1513699}`);
  }

  const higher = 1386384 > 1290203;

  if (higher) {
    console.log("higher");
  }

  const higher2 = 1513699 > 1386384;
  if (higher2) {
    console.log("higher2");
  }
}

function main() {
  // const r = new AllReader(resolve(__dirname, "test.txt"));
  const r = new AllReader(resolve(__dirname, "input.txt"));

  r.addLinesListener(run);

  r.run();
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
