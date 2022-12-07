import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { combineLatest, first, from, map, of, reduce, skipWhile, switchMap } from 'rxjs';

const line$ = from(
  createInterface({
    input: createReadStream(`./src/7/${process.argv[2]}.txt`),
  })
);

type CommandCd = ['$', 'cd', '/' | '..' | string];
type CommandLs = ['$', 'ls'];
type Command = CommandCd | CommandLs;
type TerminalOutputDir = ['dir', string];
type TerminalOutputFile = [number, string];
type TerminalOutput = TerminalOutputDir | TerminalOutputFile;
type Line = Command | TerminalOutput;

const isCommand = (line: Line): line is Command => line[0] === '$';
const isCommandCd = (line: Command): line is CommandCd => line[1] === 'cd';
const isTerminalOutputFile = (line: TerminalOutput): line is TerminalOutputFile => line[0] !== 'dir';

interface Ls {
  [name: string]: Ls | number;
  size: number;
}

interface ReduceToTree { root: Ls; path: string[]; }

const fromPath = (pwd: Ls, path: string[]): Ls | number =>
  path.reduce<Ls | number>((dir, subPath) => {
    if (typeof dir === 'number') throw new Error("is not dir");
    return (dir[subPath] ??= { size: 0 });
  }, pwd);

const increaseSizeInPath = (root: Ls, path: string[], size: number): Ls => {
  let pwd = root
  pwd.size += size;
  for (const key of path) {
    const item = pwd[key]
    if (typeof item === 'number') break;
    pwd = item;
    pwd.size += size;
  }
  return root;
}

const getAllSize = (dir: Ls): number[] =>
  [dir.size, ...Object.values(dir).filter((v): v is Ls => typeof v !== 'number')
    .flatMap(subDir => getAllSize(subDir))];

const terminalToRootTree = ({ root, path }: ReduceToTree, line: Line): ReduceToTree => {
  const pwd = fromPath(root, path);
  if (typeof pwd === 'number')
    throw new Error(`${path.join('/')}/${pwd} is not a dir`);
  if (isCommand(line)) {
    if (isCommandCd(line)) {
      if (line[2] === '/')
        path.length = 0;
      else if (line[2] === '..')
        path.pop();
      else
        path.push(line[2]);
    }
  }
  else if (isTerminalOutputFile(line)) {
    const size = +line[0];
    pwd[line[1]] = size;
    increaseSizeInPath(root, path, size);
  }
  return { root, path };
};

line$.pipe(
  map(line => line.split(' ') as Line),
  reduce<Line, ReduceToTree>(terminalToRootTree, { root: { size: 0 }, path: [] }),
  switchMap(({ root }) => combineLatest({ spaceNeed: of(root.size - 40000000), size: getAllSize(root).sort((a, b) => a - b) })),
  skipWhile(({ spaceNeed, size }) => size < spaceNeed),
  map(({ size }) => size),
  first(),
).subscribe(size => {
  console.log('The smallest directory that, if deleted, would free up enough space on the filesystem to run the update is', size);
});