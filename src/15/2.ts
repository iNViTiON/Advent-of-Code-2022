import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { combineLatest, combineLatestWith, delay, delayWhen, filter, first, from, map, max, merge, mergeMap, min, of, range, reduce, ReplaySubject, share, switchMap, tap, toArray, withLatestFrom } from 'rxjs';

const isEx = process.argv[2] === 'ex';
const maxLocation = isEx ? 20 : 4000000;

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

const sensor$ = line$.pipe(
  map(line => line
    .match(/Sensor at x=((?:-?)\d+), y=((?:-?)\d+): closest beacon is at x=((?:-?)\d+), y=((?:-?)\d+)/)!
    .slice(1, 5)
    .map(Number)
  ),
).pipe(
  map(([sx, sy, bx, by]) => [sx, sy, Math.abs(sx - bx) + Math.abs(sy - by)]),
  share(shareReplayConfig()),
);

const sensors$ = sensor$.pipe(toArray(), share(shareReplayConfig()));
sensors$.subscribe();

sensors$.pipe(
  switchMap(() => sensor$),
  withLatestFrom(sensors$),
  mergeMap(([[sx, sy, radius], sensors]) => {
    const edgeRadius = radius + 1;
    return range(0, edgeRadius + 1).pipe(
      mergeMap(dx => {
        const dy = edgeRadius - dx;
        return [
          [sx - dx, sy - dy, sensors],
          [sx + dx, sy - dy, sensors],
          [sx + dx, sy + dy, sensors],
          [sx - dx, sy + dy, sensors],
        ] as [number, number, number[][]][];
      }),
    );
  }),
  filter(([ex, ey]) =>
    ex >= 0 && ex <= maxLocation && ey >= 0 && ey <= maxLocation
  ),
  filter(([ex, ey, sensors]) => sensors.every(([x, y, r]) =>
    Math.abs(x - ex) + Math.abs(y - ey) > r
  )),
  first(),
).subscribe(([x, y]) => {
  console.log(
    'tuning frequency',
    x * 4000000 + y,
  );
});