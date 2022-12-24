import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { concat, concatMap, connect, defaultIfEmpty, defer, delay, EMPTY, expand, filter, first, forkJoin, from, last, map, max, merge, mergeMap, of, partition, range, reduce, ReplaySubject, share, switchMap, tap, toArray, type Observable } from 'rxjs';

const line$ = from(
  createInterface({
    input: createReadStream(`./src/24/${process.argv[2]}.txt`),
  })
);

type TileType = '^' | '>' | 'v' | '<' | '#';

const moveOffset = new Map<TileType, [number, number]>([
  ['^', [-1, 0]],
  ['>', [0, 1]],
  ['v', [1, 0]],
  ['<', [0, -1]],
  ['#', [0, 0]],
]);

const moveOffset$ = from(moveOffset.values()).pipe(share({
  connector: () => new ReplaySubject(),
  resetOnComplete: false,
  resetOnRefCountZero: false,
}));

interface Tile {
  char: TileType;
  row: number;
  column: number;
};

interface Valley {
  maps: Tile[];
  height: number;
  width: number;
}

const valleyTimeCache = new Map<Valley, Map<number, Valley>>();

const valleyAtTime = (valley: Valley, time: number): Valley => {
  let timeValleyCache = valleyTimeCache.get(valley);
  if (timeValleyCache === undefined) {
    timeValleyCache = new Map<number, Valley>();
    valleyTimeCache.set(valley, timeValleyCache);
  }

  const { maps, height, width } = valley;
  const interiorHeight = height - 2;
  const interiorWidth = width - 2;
  const trimTime = time % (interiorHeight * interiorWidth);

  {
    const valleyTimeMapCache = timeValleyCache.get(trimTime);
    if (valleyTimeMapCache !== undefined) return valleyTimeMapCache;
  }

  const mapsAtTime = maps.map(({ char, row, column }) => {
    if (char === '#') return ({ char, row, column });
    const interiorRow = row - 1;
    const interiorColumn = column - 1;
    const [rowOffset, columnOffset] = moveOffset.get(char)!.map(n => n * trimTime);
    return {
      char,
      row: ((((interiorRow + rowOffset) % interiorHeight) + interiorHeight) % interiorHeight) + 1,
      column: ((((interiorColumn + columnOffset) % interiorWidth) + interiorWidth) % interiorWidth) + 1,
    };
  })
  const newValley = { maps: mapsAtTime, height, width };
  timeValleyCache.set(trimTime, newValley);
  return newValley;
}

const setKey = (trimmedTime: number, row: number, column: number) => `${trimmedTime}:${row}:${column}`;

const possibleMovePosition = (
  originalValley: Valley,
  time: number,
  currentRow: number,
  currentColumn: number,
  visited: Set<string>,
): Observable<number> => {
  const { height, width } = originalValley;
  const endRow = height - 1;
  const end = originalValley.maps
    .filter(({ row }) => row === height - 1)
    .findIndex(({ column }, i) => column !== i);
  if (currentRow === endRow && currentColumn === end) return of(time);
  const start = originalValley.maps
    .filter(({ row }) => row === 0)
    .findIndex(({ column }, i) => column !== i);
  const { maps } = valleyAtTime(originalValley, time + 1);
  const interiorHeight = height - 2;
  const interiorWidth = width - 2;
  const timeLoop = interiorHeight * interiorWidth;

  return moveOffset$.pipe(
    delay(0),
    map(([rowOffset, columnOffset]) => ({
      row: currentRow + rowOffset,
      column: currentColumn + columnOffset,
    })),
    filter(({ row, column }) =>
      row >= 0
      && column >= 0
      && maps.every(({ row: mapsRow, column: mapsColumn }) => row !== mapsRow || column !== mapsColumn)),
    filter(({ row, column }) =>
      !visited.has(setKey(time % timeLoop, row, column))
      && (time < timeLoop || (row !== 0 && column !== start))
    ),
    tap(({ row, column }) => visited.add(setKey(time % timeLoop, row, column))),
    map(({ row, column }) => defer(() => possibleMovePosition(originalValley, time + 1, row, column, visited))),
    toArray(),
    switchMap(agg => merge(...agg)),
  );
};

line$.pipe(
  concatMap((line, row) => from(line).pipe(
    map((char, column) => ({ char, row, column })),
    filter((tilt): tilt is Tile => tilt.char !== '.'),
  )),
  connect(tile$ => forkJoin({
    maps: tile$.pipe(toArray<Tile>()),
    height: tile$.pipe(map(({ row }) => row), max(), map(height => height + 1)),
    width: tile$.pipe(map(({ column }) => column), max(), map(width => width + 1)),
  })),
  switchMap((valley: Valley) => possibleMovePosition(valley, 0, 0, 1, new Set())),
  first(),
).subscribe(time =>
  console.log(
    `the fewest number of minutes required to avoid the blizzards and reach the goal`,
    time,
  )
);