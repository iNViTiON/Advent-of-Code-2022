import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { combineLatest, connect, from, map, max, mergeAll, mergeMap, pipe, range, toArray } from 'rxjs';

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

const getScenicScore = ([grid, [x, y]]: [number[][], readonly [number, number]]): number => {
  const row = grid[x];
  const treeHeight = row[y];
  let upScore = 0, downScore = 0, leftScore = 0, rightScore = 0;
  for (let i = x - 1; i >= 0 && (++upScore, grid[i][y] < treeHeight); --i);
  for (let i = x + 1; i < grid.length && (++downScore, grid[i][y] < treeHeight); ++i);
  for (let i = y - 1; i >= 0 && (++leftScore, row[i] < treeHeight); --i);
  for (let i = y + 1; i < row.length && (++rightScore, row[i] < treeHeight); ++i);
  return upScore * downScore * leftScore * rightScore;
}

line$.pipe(
  map(line => line.split('').map(Number)),
  toArray(),
  connect(grid$ => combineLatest([
    grid$,
    grid$.pipe(toGridScan)
  ])),
  map(getScenicScore),
  max(),
).subscribe(score => console.log('the highest scenic score possible for any tree', score));