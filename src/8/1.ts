import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { combineLatest, connect, count, from, map, mergeAll, mergeMap, pipe, range, toArray } from 'rxjs';

const line$ = from(
  createInterface({
    input: createReadStream(`./src/8/${process.argv[2]}.txt`),
  })
);

const toGridScan = pipe(
    mergeAll<number[][]>(),
    mergeMap(({ length }, i) => range(0, length).pipe(
      map(j => [i, j] as const),
    ))
  );

const isVisible = ([grid, [x, y]]: [number[][], readonly [number, number]]): boolean => {
  const row = grid[x];
  const treeHeight = row[y];
  let i = 0, heighest = -1;
  for (; i < x && (heighest = Math.max(heighest, grid[i][y])) < treeHeight; ++i);
  if (heighest < treeHeight) return true;
  for (i = x + 1, heighest = -1; i < grid.length && (heighest = Math.max(heighest, grid[i][y])) < treeHeight; ++i);
  if (heighest < treeHeight) return true;
  for (i = 0, heighest = -1; i < y && (heighest = Math.max(heighest, row[i])) < treeHeight; ++i);
  if (heighest < treeHeight) return true;
  for (i = y + 1, heighest = -1; i < row.length && (heighest = Math.max(heighest, row[i])) < treeHeight; ++i);
  return (heighest < treeHeight);
}

line$.pipe(
  map(line => line.split('').map(Number)),
  toArray(),
  connect(grid$ => combineLatest([
    grid$,
    grid$.pipe(toGridScan)
  ])),
  count(isVisible),
).subscribe(trees => console.log('trees are visible from outside the grid', trees));