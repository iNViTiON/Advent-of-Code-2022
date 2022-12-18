import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { from, map, reduce, tap } from 'rxjs';

const line$ = from(
  createInterface({
    input: createReadStream(`./src/18/${process.argv[2]}.txt`),
  })
);

line$.pipe(
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
  map(cubes => {
    let surface = 0;
    const layerLength = cubes.length + 1;
    const rowLength = cubes[0].length + 1;
    const cubeLength = cubes[0][0].length + 1;
    for (let i = 0; i < layerLength; ++i) {
      const layer = cubes[i] ?? [];
      for (let j = 0; j < rowLength; ++j) {
        const row = layer[j] ?? []
        for (let k = 0; k < cubeLength; ++k) {
          surface += row[k] ^ row[k - 1];
          surface += row[k] ^ layer[j - 1]?.[k];
          surface += row[k] ^ cubes[i - 1]?.[j]?.[k];
        }
      }
    }
    return surface;
  }),
).subscribe(released =>
  console.log(
    'the surface area of scanned lava droplet',
    released,
  )
);