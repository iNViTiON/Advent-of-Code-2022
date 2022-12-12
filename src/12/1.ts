import { createReadStream } from 'node:fs';
import { bufferWhen, connect, delay, EMPTY, expand, filter, fromEvent, isObservable, map, mergeMap, min, Observable, of, range, reduce, switchMap, takeWhile, tap, toArray, withLatestFrom } from 'rxjs';

const readable = createReadStream(`./src/12/${process.argv[2]}.txt`, {
  encoding: 'utf8',
})

const heightMap$ = range(97, 26).pipe(
  reduce((dict, codePoint, i) =>
    dict.set(String.fromCodePoint(codePoint), i + 1), new Map<string, number>()),
  tap(dict => dict.set('S', -1).set('E', -26).set('\n', 0)),
);

type Position = [number, number];
type InceptionObservable<T> = Observable<T | InceptionObservable<T>>

const visitKey = ([x, y]: Position) => [x, y].join();

const nextLevel = (
  [x, y]: Position,
  grid: number[][],
  vmap: Map<string, number>,
  depth: number,
  candidate: { depth: number },
): InceptionObservable<number> =>
  new Observable(observer => {
    if (grid[x][y] === -26) {
      observer.next(candidate.depth = depth);
      observer.complete();
      return;
    };
    if (depth >= candidate.depth) {
      observer.complete();
      return;
    };
    vmap.set(visitKey([x, y]), depth);
    const current = grid[x][y];
    const targets: Position[] = ([
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
    ] as Position[]).filter(([nx, ny]) =>
      Math.abs(grid[nx]?.[ny]) <= current + 1
      && (
        vmap.get(visitKey([nx, ny])) === undefined
        || vmap.get(visitKey([nx, ny]))! > depth + 1
      )
    );
    const observables = targets.map(target => nextLevel(target, grid, vmap, depth + 1, candidate));
    for (const observable of observables)
      observer.next(observable);
    observer.complete();
  });

fromEvent(readable, 'readable').pipe(
  expand((_, i) => i % 400 ? of(readable.read(1) as string) : of(readable.read(1) as string).pipe(delay(0)), 1),
  filter(char => char !== undefined && char !== '\r'),
  takeWhile(char => char !== null),
  withLatestFrom(heightMap$),
  map(([char, map]) => map.get(char)!),
  connect(height$ => height$.pipe(
    filter(height => height !== 0),
    bufferWhen(() => height$.pipe(filter(height => height === 0))),
  )),
  toArray(),
  mergeMap(grid => {
    const startRow = grid.findIndex(row => row.includes(-1));
    const startColumn = grid[startRow].findIndex(col => col === -1);
    grid[startRow][startColumn] = 1;
    return of(grid).pipe(
      switchMap(grid => nextLevel([startRow, startColumn], grid, new Map(), 0, { depth: 9999 })),
    );
  }),
  expand(res => isObservable(res) ? res : EMPTY),
  filter(res => !isObservable(res)),
  min(),
).subscribe(steps =>
  console.log(
    'the fewest steps required to move from your current position to the location that should get the best signal',
    steps,
  )
);