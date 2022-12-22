import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { combineLatest, connect, forkJoin, from, map, of, reduce, skipWhile, switchMap, takeWhile, toArray } from 'rxjs';

const line$ = from(
  createInterface({
    input: createReadStream(`./src/22/${process.argv[2]}.txt`),
  })
);

type Tile = ' ' | '.' | '#';
type Facing = '>' | 'v' | '<' | '^';
type Command = 'L' | 'R' | number;

interface State {
  facing: Facing;
  row: number;
  column: number;
}

const point = new Map<Facing, number>([
  ['>', 0],
  ['v', 1],
  ['<', 2],
  ['^', 3],
]);

const opposite = new Map<Facing, Facing>([
  ['>', '<'],
  ['v', '^'],
  ['<', '>'],
  ['^', 'v'],
]);

const turnL = new Map<Facing, Facing>([
  ['>', '^'],
  ['v', '>'],
  ['<', 'v'],
  ['^', '<'],
]);

const turnR = new Map<Facing, Facing>([
  ['>', 'v'],
  ['v', '<'],
  ['<', '^'],
  ['^', '>'],
]);

const nextStep = (
  facing: Facing,
  row: number,
  column: number,
): { nextRow: number, nextColumn: number } => {
  switch (facing) {
    case '>':
      ++column;
      break;
    case 'v':
      ++row;
      break;
    case '<':
      --column;
      break;
    case '^':
      --row;
      break;
  }
  return ({ nextRow: row, nextColumn: column });
}

const tryMove = (
  maps: Tile[][],
  row: number,
  column: number,
  facing: Facing,
  count: number,
): { row: number, column: number } => {
  while (count--) {
    let { nextRow, nextColumn } = nextStep(facing, row, column);
    let nextCandidate = (maps[nextRow] ?? [])[nextColumn];
    if (nextCandidate === ' ' || nextCandidate === undefined) {
      const backFacing = opposite.get(facing)!;
      let backStep = nextStep(backFacing, nextRow, nextColumn);
      while (
        (nextCandidate = (maps[backStep.nextRow] ?? [])[backStep.nextColumn]) !== ' '
        && nextCandidate !== undefined
      ) {
        nextRow = backStep.nextRow;
        nextColumn = backStep.nextColumn;
        backStep = nextStep(backFacing, nextRow, nextColumn);
      }
    }
    nextCandidate = maps[nextRow][nextColumn];
    if (nextCandidate === '#') break;
    else if (nextCandidate === '.') {
      row = nextRow;
      column = nextColumn;
    } else throw new Error('incorrect place on tile');
  }
  return { row, column };
}

line$.pipe(
  connect(sharedLine$ =>
    forkJoin({
      maps: sharedLine$.pipe(
        takeWhile(line => line.length > 0),
        map(line => line.split('') as Tile[]),
        toArray(),
      ),
      path: sharedLine$.pipe(
        skipWhile(line => line.length > 0),
      ),
    })
  ),
  switchMap(({ maps, path }) => combineLatest({
    maps: of(maps),
    command: from(path.matchAll(/\d+|\D/g)).pipe(
      map<RegExpMatchArray, Command>(([command]) => {
        const commandInNumber = +command;
        return Number.isNaN(commandInNumber)
          ? (command as 'L' | 'R')
          : commandInNumber;
      }),
    ),
  })),
  reduce(({ facing, row, column }, { maps, command }) => {
    if (column === -1) column = maps[0].indexOf('.');
    if (typeof command === 'number') {
      const newPosition = tryMove(maps, row, column, facing, command);
      row = newPosition.row;
      column = newPosition.column;
    } else if (command === 'L') facing = turnL.get(facing)!;
    else facing = turnR.get(facing)!;
    return {
      facing,
      row,
      column,
    };
  }, {
    facing: '>',
    column: -1,
    row: 0,
  } as State),
  map(({ row, column, facing }) => (1000 * (row + 1)) + (4 * (column + 1)) + point.get(facing)!),
).subscribe(password =>
  console.log(
    'the final password',
    password,
  )
);