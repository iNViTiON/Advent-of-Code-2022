import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { count, delayWhen, filter, from, map, max, merge, mergeMap, min, of, range, reduce, ReplaySubject, share, switchMap, withLatestFrom } from 'rxjs';

const isEx = process.argv[2] === 'ex';
const targetRow = isEx ? 10 : 2000000;

const shareReplayConfig = <T>() => ({
  connector: () => new ReplaySubject<T>(),
  resetOnComplete: false,
  resetOnRefCountZero: false,
});

const line$ = from(
  createInterface({
    input: createReadStream(`./src/15/${process.argv[2]}.txt`),
  })
);

const position$ = line$.pipe(
  map(line => line
    .match(/Sensor at x=((?:-?)\d+), y=((?:-?)\d+): closest beacon is at x=((?:-?)\d+), y=((?:-?)\d+)/)!
    .slice(1, 5)
    .map(Number)
  ),
  share(shareReplayConfig())
);

const minBeaconX$ = position$.pipe(
  mergeMap(([sx, , bx]) => [sx, bx]),
  min(),
  share(shareReplayConfig()),
);
const maxBeaconX$ = position$.pipe(
  mergeMap(([sx, , bx]) => [sx, bx]),
  max(),
  share(shareReplayConfig()),
);
minBeaconX$.subscribe();
maxBeaconX$.subscribe();
const minCoverageX$ = position$.pipe(
  map(([sx, sy, bx, by]) => 
     sx - Math.abs(sx - bx) + Math.abs(sy - by)
  ),
  min(),
);
const maxCoverageX$ = position$.pipe(
  map(([sx, sy, bx, by]) => 
     sx + Math.abs(sx - bx) + Math.abs(sy - by)
  ),
  max(),
);
const minX$ = merge(minBeaconX$, minCoverageX$).pipe(min());
const maxX$ = merge(maxBeaconX$, maxCoverageX$).pipe(max());

const beaconX$ = position$.pipe(
  filter(([, , , by]) => by === targetRow),
  map(([, , bx]) => bx),
  reduce((acc, cur) => acc.add(cur), new Set<number>()),
);

of(null).pipe(
  delayWhen(() => maxX$),
  switchMap(() => position$),
  filter(([sx, sy, bx, by]) =>
    Math.abs(sx - bx) + Math.abs(sy - by) >= Math.abs(sy - targetRow)
  ),
  mergeMap(([sx, sy, bx, by]) => {
    const distance = Math.abs(sx - bx) + Math.abs(sy - by);
    const distanceToRow = Math.abs(sy - targetRow)
    const remainingDistance = Math.abs(distanceToRow - distance);
    const xs = [sx];
    for (let i = 1; i <= remainingDistance; ++i) { xs.push(sx + i); xs.push(sx - i) };
    return xs;
  }),
  reduce((acc, cur) => acc.add(cur), new Set<number>()),
  withLatestFrom(minX$, maxX$, beaconX$),
  mergeMap(([cov, minX, maxX, beaconX]) => range(0, maxX - minX + 1).pipe(
    map(x => x + minX),
    filter(x => cov.has(x) && !beaconX.has(x)),
  )),
  count(),
).subscribe(count => {
  console.log(
    `positions cannot contain a beacon in the row where y=${targetRow}`,
    count,
  );
});