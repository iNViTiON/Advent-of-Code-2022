import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { concat, concatMap, count, defaultIfEmpty, delay, EMPTY, expand, filter, first, from, last, map, mergeAll, of, partition, range, reduce, ReplaySubject, share, switchMap, zipWith, type Observable } from 'rxjs';

const line$ = from(
  createInterface({
    input: createReadStream(`./src/23/${process.argv[2]}.txt`),
  })
);

type Direction = 'N' | 'S' | 'W' | 'E';

const checkList = new Map<Direction, [number, number][]>([
  ['N', [[-1, -1], [-1, 0], [-1, 1]]],
  ['S', [[1, -1], [1, 0], [1, 1]]],
  ['W', [[-1, -1], [0, -1], [1, -1]]],
  ['E', [[-1, 1], [0, 1], [1, 1]]],
]);

const moveOffset = new Map<Direction, [number, number]>([
  ['N', [-1, 0]],
  ['S', [1, 0]],
  ['W', [0, -1]],
  ['E', [0, 1]],
]);

const adjacentIsFree = (grove: boolean[][], row: number, column: number): boolean => [
  grove[row - 1]?.[column - 1],
  grove[row - 1]?.[column],
  grove[row - 1]?.[column + 1],
  grove[row]?.[column - 1],
  grove[row]?.[column + 1],
  grove[row + 1]?.[column - 1],
  grove[row + 1]?.[column],
  grove[row + 1]?.[column + 1],
].every(tile => tile !== true);

const isDirectionFree = (grove: boolean[][], row: number, column: number, direction: Direction): boolean =>
  checkList.get(direction)!
    .map(([rowOffset, columnOffset]) => grove[row + rowOffset]?.[column + columnOffset])
    .every(tile => tile !== true);

line$.pipe(
  concatMap(line => from(line).pipe(
    map((char, i) => char === '#' ? i : Number.MAX_SAFE_INTEGER),
    filter(column => column !== Number.MAX_SAFE_INTEGER),
    reduce((row, column) => (row[column + 500] = true, row), [] as boolean[]),
  )),
  reduce((grove, row, i) => (grove[i + 500] = row, grove), [] as boolean[][]),
  map(grove => ({ grove, round: 0, end: false, movePriority: ['N', 'S', 'W', 'E'] as Direction[] })),
  expand(({ grove, round, end, movePriority }, i) => {
    if (end) return EMPTY;
    if (i % 100 === 99) return of({ grove, round, end, movePriority }).pipe(delay(0));

    const [stableElf$, mayMoveElf$] = partition(range(0, grove.length).pipe(
      concatMap(rowi => {
        const row = grove[rowi] ?? [];
        return range(0, row.length).pipe(
          filter(columni => row[columni]),
          map(columni => [rowi, columni] as const),
        );
      }),
    ), ([rowi, columni]) => adjacentIsFree(grove, rowi, columni));
    const [candidateElf$, stuckElf$] = partition(mayMoveElf$.pipe(
      concatMap(([row, column]) => from(movePriority).pipe(
        filter(direction => isDirectionFree(grove, row, column, direction)),
        map(direction => {
          const [rowOffset, columnOffset] = moveOffset.get(direction)!;
          const newRow = row + rowOffset;
          const newColumn = column + columnOffset;
          const target = (newRow * 1000000) + newColumn;
          return [[row, column], [newRow, newColumn], target] as const;
        }),
        defaultIfEmpty([row, column] as const),
        first(),
      )),
    ), (output): output is [[number, number], [number, number], number] => Array.isArray(output[0]));

    const target$ = candidateElf$.pipe(
      reduce(
        (targets, [, , target]) => targets.set(target, (targets.get(target) ?? 0) + 1),
        new Map<number, number>()
      ),
      share({
        connector: () => new ReplaySubject(1),
        resetOnComplete: false,
      }),
    );

    const moveAndStuckElf$ = target$.pipe(
      switchMap(targets => candidateElf$.pipe(
        map(([oldTile, newTile, target]) => targets.get(target)! > 1 ? oldTile : newTile),
      )),
    );
    const [firstDirection, ...restDirection] = movePriority;

    return concat(
      stableElf$,
      stuckElf$ as Observable<[number, number]>,
      moveAndStuckElf$,
    ).pipe(
      reduce((newGrove, [row, column]) =>
        ((newGrove[row] ??= [])[column] = true, newGrove),
        [] as boolean[][]
      ),
      zipWith(target$.pipe(mergeAll(), count(([, count]) => count === 1))),
      map(([newGrove, moveCount]) => ({ grove: newGrove, round: round + 1, end: moveCount === 0, movePriority: [...restDirection, firstDirection] }))
    );
  }, 1),
  last(),
  map(({ round }) => round),
).subscribe(empty =>
  console.log(
    `the number of the first round where no Elf moves`,
    empty,
  )
);