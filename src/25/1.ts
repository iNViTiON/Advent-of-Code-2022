import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { concat, concatMap, connect, defaultIfEmpty, defer, delay, EMPTY, expand, filter, first, forkJoin, from, interval, last, map, max, merge, mergeMap, of, partition, range, reduce, ReplaySubject, scan, share, skipWhile, switchMap, takeWhile, tap, timer, toArray, type Observable } from 'rxjs';

const line$ = from(
  createInterface({
    input: createReadStream(`./src/25/${process.argv[2]}.txt`),
  })
);

type SnafuDigit = '2' | '1' | '0' | '-' | '=';

const snafuValue = new Map<SnafuDigit, number>([
  ['=', -2],
  ['-', -1],
  ['0', 0],
  ['1', 1],
  ['2', 2],
]);

const toSnafu = (target: number) => interval(0).pipe(
  scan(({ max }, i) => ({ max: max + (2 * Math.pow(5, i)), place: i }), { max: 0, place: 0 }),
  takeWhile(({ max }) => max < target),
  last(),
  map(({ place }) => ({ place: place + 1, remaining: target, snafu: '' })),
  expand(({ place, remaining, snafu }) =>
    place < 0
      ? EMPTY
      : remaining === 0
        ? of({
          place: place - 1,
          remaining,
          snafu: `${snafu}0`,
        })
        : from(snafuValue.entries()).pipe(
          map(([currentSnafu, currentValue]) => [currentSnafu, (currentValue * Math.pow(5, place))] as const),
          reduce(({ snafuCandidate, value }, [currentSnafu, currentValue]) =>
            Math.abs(remaining - currentValue) < Math.abs(remaining - value)
              ? { snafuCandidate: currentSnafu, value: currentValue }
              : { snafuCandidate, value },
            { snafuCandidate: '0', value: Number.MAX_SAFE_INTEGER }
          ),
          map(({ snafuCandidate, value }) => ({
            place: place - 1,
            remaining: remaining - value,
            snafu: `${snafu}${snafuCandidate}`,
          })),
        )
  ),
  last(),
  map(({ snafu }) => snafu),
);

line$.pipe(
  mergeMap(snafu => from(snafu.split('').reverse() as SnafuDigit[]).pipe(
    map((v, i) => snafuValue.get(v)! * Math.pow(5, i)),
    reduce((acc, cur) => acc + cur, 0),
  )),
  reduce((acc, cur) => acc + cur, 0),
  switchMap(toSnafu),
).subscribe(snafu =>
  console.log(
    `SNAFU number do you supply to Bob's console`,
    snafu,
  )
);