import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { connect, EMPTY, expand, forkJoin, from, last, map, max, mergeMap, of, pairwise, range, reduce } from 'rxjs';

const line$ = from(
  createInterface({
    input: createReadStream(`./src/14/${process.argv[2]}.txt`),
  })
);

const printMap = (
  rocks: Set<string>,
  originalRocks = new Set<string>(),
  path = new Set<string>(),
) => {
  const rockArr = [...rocks].map(rock => rock.split(',').map(Number));
  const allX = rockArr.map(([x]) => x);
  const xMin = Math.min(...allX);
  const xMax = Math.max(...allX);
  const yMax = Math.max(...rockArr.map(([, y]) => y));
  const rowTemplate = Array.from({ length: 3 + xMax - xMin })
    .map((_, i) => i + xMin - 1);
  const rockMap = Array.from({ length: yMax + 4 })
    .map((_, y) => rowTemplate.map(x => [x, y].join(',')));
  const completeMap = rockMap.map(row => row.map(rock => rocks.has(rock)
    ? originalRocks.has(rock)
      ? '#'
      : 'o'
    : path.has(rock)
      ? '~'
      : '.'
  ).join(''));
  console.log(completeMap.join('\n'));
}

line$.pipe(
  map(line => line.split(' -> ').map(coor => coor.split(',').map(Number))),
  mergeMap(path => from(path).pipe(
    pairwise(),
    mergeMap(([[sX, sY], [eX, eY]]) => {
      if (sX === eX) {
        const yLength = eY - sY;
        return (yLength > 0
          ? range(sY, (eY - sY) + 1)
          : (range(eY, (-yLength) + 1))
        ).pipe(
          map(y => [sX, y]),
        );
      }
      const xLength = eX - sX;
      if (sY !== eY) throw new Error("not straight line");
      return (xLength > 0
        ? range(sX, xLength + 1)
        : range(eX, (-xLength) + 1)
      ).pipe(
        map(x => [x, sY]),
      );
    }),
  )),
  connect(coor$ => forkJoin({
    rocks: coor$.pipe(
      reduce((acc, coor) => acc.add(coor.join(',')), new Set<string>())
    ),
    floor: coor$.pipe(map(([, y]) => y), max()),
  })),
  map(({ floor, rocks }) => ({
    floor,
    rocks,
    originalRock: new Set(rocks),
    path: new Set<string>()
  })),
  expand(({ floor, rocks, originalRock }) => {
    const path = new Set<string>();
    let current = [500, 0];
    while (true) {
      path.add(current.join(','));
      let next = current;
      if (current[1] >= floor + 3) return EMPTY;
      else if (!rocks.has((next = [current[0], current[1] + 1]).join(',')))
        current = next;
      else if (!rocks.has((next = [current[0] - 1, current[1] + 1]).join(',')))
        current = next;
      else if (!rocks.has((next = [current[0] + 1, current[1] + 1]).join(',')))
        current = next;
      else {
        rocks.add(current.join(','));
        break;
      }
    }
    return of({ floor, rocks, originalRock, path });
  }),
  last(),
).subscribe(({ rocks, originalRock, path }) => {
  printMap(rocks, originalRock, path);
  console.log(
    'units of sand come to rest before sand starts flowing into the abyss below',
    rocks.size - originalRock.size,
  );
});