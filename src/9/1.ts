import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { concatMap, from, map, of, pipe, reduce, repeat, scan, type Observable, type UnaryFunction } from 'rxjs';

const line$ = from(
  createInterface({
    input: createReadStream(`./src/9/${process.argv[2]}.txt`),
  })
);

type Direction = 'U' | 'D' | 'R' | 'L';
type Position = [number, number];

const directionMap = new Map<Direction, Position>([
  ['U', [1, 0]],
  ['D', [-1, 0]],
  ['R', [0, 1]],
  ['L', [0, -1]],
]);

const getNewTailPosition =
  ([tailX, tailY]: Position, [headX, headY]: Position): Position => {
    const [dX, dY] = [headX - tailX, headY - tailY];
    let newX = tailX, newY = tailY;
    if (dX > 1) {
      ++newX;
      dY !== 0 && (dY > 0 ? ++newY : --newY);
    } else if (dX < -1) {
      --newX;
      dY !== 0 && (dY > 0 ? ++newY : --newY);
    } else if (dY > 1) {
      ++newY;
      dX !== 0 && (dX > 0 ? ++newX : --newX);
    } else if (dY < -1) {
      --newY;
      dX !== 0 && (dX > 0 ? ++newX : --newX);
    }
    return [newX, newY];
  }

const addTailKnot = pipe(
  scan<Position, Position>(getNewTailPosition, [0, 0]),
);

line$.pipe(
  map(line => line.split(' ')),
  map(([direction, count]) => [direction, +count] as [Direction, number]),
  concatMap(([direction, count]: [Direction, number]) => of(direction).pipe(repeat(count))),
  scan<Direction, Position>(
    (position, direction) =>
      directionMap.get(direction)!.map((v, i) => v + position[i]) as Position,
    [0, 0],
  ),
  addTailKnot,
  reduce((acc, cur) => acc.add(cur.join()), new Set()),
).subscribe(trees => console.log('positions does the tail of the rope visit at least once', trees.size));