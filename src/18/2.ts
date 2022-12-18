import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { concat, delay, forkJoin, from, InteropObservable, map, type Observable, of, pipe, reduce, share, switchMap, tap } from 'rxjs';

const line$ = from(
  createInterface({
    input: createReadStream(`./src/18/${process.argv[2]}.txt`),
  })
);

let count = 0;
let limit = 230;
const limit$ = <T>(obs: Observable<T>) =>
  ++count < limit
    ? obs
    : (limit += 230, obs.pipe(delay(0)))

const fillOuter = (
  originalCubes: number[][][],
  cubes: number[][][],
  x: number,
  y: number,
  z: number,
) => {
  if (originalCubes[x]?.[y]?.[z] === undefined || cubes[x][y][z] === 1) return of(cubes);
  const tasks: Observable<number[][][]>[] = [];
  cubes[x][y][z] = 1;
  if ((originalCubes[x - 1]?.[y]?.[z]) !== 1) tasks.push(fillOuter(originalCubes, cubes, x - 1, y, z));
  if ((originalCubes[x + 1]?.[y]?.[z]) !== 1) tasks.push(fillOuter(originalCubes, cubes, x + 1, y, z));
  if ((originalCubes[x]?.[y - 1]?.[z]) !== 1) tasks.push(fillOuter(originalCubes, cubes, x, y - 1, z));
  if ((originalCubes[x]?.[y + 1]?.[z]) !== 1) tasks.push(fillOuter(originalCubes, cubes, x, y + 1, z));
  if ((originalCubes[x]?.[y]?.[z - 1]) !== 1) tasks.push(fillOuter(originalCubes, cubes, x, y, z - 1));
  if ((originalCubes[x]?.[y]?.[z + 1]) !== 1) tasks.push(fillOuter(originalCubes, cubes, x, y, z + 1));
  return limit$(concat(...tasks.map(limit$)));
}

const getEmptyRow = (length: number) => Array.from<number>({ length }).fill(0);
const getEmptyLayer = (length: number, rowLength: number) =>
  Array.from<number[]>({ length })
    .map(() => getEmptyRow(rowLength));

const cubes$ = line$.pipe(
  map(line => line.match(/(\d+),(\d+),(\d+)/)!.slice(1, 4).map(Number)),
  reduce((acc, [x, y, z]) => {
    acc[x] ??= [];
    acc[x][y] ??= [];
    acc[x][y][z] = 1;
    return acc;
  }, [] as number[][][]),
  tap(cubes => {
    const maxLengthY = Math.max(...cubes.map(rows => rows.length).filter(Boolean));
    const maxLengthZ = Math.max(...cubes.flat().map(row => row.length).filter(Boolean));
    for (let i = 0; i < cubes.length; ++i) {
      (cubes[i] ??= []).length = maxLengthY;
      for (let j = 0; j < maxLengthY; ++j) {
        (cubes[i][j] ??= []).length = maxLengthZ;
        for (let k = 0; k < maxLengthZ; ++k)
          cubes[i][j][k] ??= 0;
      }
    }
  }),
  share(),
);

const interior$ = cubes$.pipe(
  map(cubes => JSON.parse(JSON.stringify(cubes)) as typeof cubes),
  tap(cubes => {
    const maxLengthY = cubes[0].length
    const maxLengthZ = cubes[0][0].length
    cubes.unshift(getEmptyLayer(maxLengthY, maxLengthZ));
    cubes.push(getEmptyLayer(maxLengthY, maxLengthZ));
  }),
  switchMap(cubes => fillOuter(
    cubes,
    JSON.parse(JSON.stringify(cubes)) as typeof cubes,
    0,
    0,
    0)
  ),
)

const findSurface = (all: boolean) => pipe(
  map((cubes: number[][][]) => {
    const start = all ? 0 : 1;
    const lengthPlus = all ? 1 : 0;
    let surface = 0;
    const layerLength = cubes.length + lengthPlus;
    const rowLength = cubes[0].length + lengthPlus;
    const cubeLength = cubes[0][0].length + lengthPlus;
    for (let i = start; i < layerLength; ++i) {
      const layer = cubes[i] ?? [];
      for (let j = start; j < rowLength; ++j) {
        const row = layer[j] ?? []
        for (let k = start; k < cubeLength; ++k) {
          surface += row[k] ^ row[k - 1] ?? 1;
          surface += row[k] ^ layer[j - 1]?.[k] ?? 1;
          surface += row[k] ^ cubes[i - 1]?.[j]?.[k] ?? 1;
        }
      }
    }
    return surface;
  }),
);

forkJoin({
  allSurface: cubes$.pipe(findSurface(true)),
  interiorSurface: interior$.pipe(findSurface(false)),
}).subscribe(({ allSurface, interiorSurface }) => console.log(
  'the exterior surface area of scanned lava droplet',
  allSurface - interiorSurface,
));