import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { defer, distinctUntilChanged, from, last, map, merge, Observable, of, reduce, scan, switchMap, tap } from 'rxjs';

const line$ = from(
  createInterface({
    input: createReadStream(`./src/16/${process.argv[2]}.txt`),
  })
);

interface Valve { valve: string, rate: number, to: string[], toV: Map<Valve, number> }

const travelTimeCache = new Map<string, Map<string, number>>();

const travelTime = (valveMap: Map<string, Valve>, fromV: string, toV: string): number => {
  let cache = travelTimeCache.get(fromV);
  if (cache === undefined) travelTimeCache.set(fromV, (cache = new Map()));
  let step = cache.get(toV);
  if (step !== undefined) return step;
  step = 0;
  let current = [fromV];
  while (++step) {
    current = [...new Set(current
      .flatMap(valve => valveMap.get(valve)!.to))];
    if (current.some(valve => valve === toV)) break;
  }
  cache.set(toV, step);
  return step;
}

const doRound = (
  remainTime: number,
  suspend: number,
  openedValve: Set<Valve>,
  current: Valve,
  released: number,
): Observable<number> => {
  if (remainTime > 0) {
    if (suspend > 0)
      return defer(() => doRound(
        remainTime - 1,
        suspend - 1,
        new Set(openedValve),
        current,
        released
      ));
    const nextCandidate = [...current.toV.entries()]
      .filter(([valve, travelTime]) => !openedValve.has(valve) && travelTime < remainTime)
      .map(([valve, timeTo]) => {
        const time = remainTime - timeTo - 1;
        const canRelease = time * valve.rate;
        return [valve, canRelease] as const;
      }).filter(([, canRelease]) => canRelease > 0).sort(([, a], [, b]) => b - a);
    if (nextCandidate.length === 0) return of(released);
    return merge(...nextCandidate.map(([valve, canRelease]) =>
      defer(() => doRound(
        remainTime - 1,
        current.toV.get(valve)!,
        new Set([valve, ...openedValve]),
        valve,
        released + canRelease
      ))
    ));
  }
  return of(released);
}

line$.pipe(
  map(line => {
    const [valve, rate, to] = line
      .match(/Valve (\D\D) has flow rate=(\d+); tunnel(?:s?) lead(?:s?) to valve(?:s?) ((?:\D\D(?:, )?)+)/)!
      .slice(1, 5);
    return {
      valve,
      rate: +rate,
      to: to.split(', '),
      toV: new Map<Valve, number>(),
    }
  }),
  reduce((acc, cur) => acc.set(cur.valve, cur), new Map<string, Valve>()),
  tap(valveMap => {
    const allNonZero = [...valveMap.values()].filter(v => v.rate !== 0);
    for (const valve of [valveMap.get('AA')!, ...allNonZero]) {
      const others = allNonZero
        .filter(({ valve: anotherValve }) => anotherValve !== valve.valve);
      for (const another of others) {
        valve.toV.set(another, travelTime(valveMap, valve.valve, another.valve));
      }
    }
  }),
  switchMap(valveMap => doRound(
    30,
    -1,
    new Set(),
    valveMap.get('AA')!,
    0
  )),
  scan((max, candidate) => Math.max(max, candidate), 0),
  distinctUntilChanged(),
  tap(released => console.log('candidate released (may be not final answer)', released)),
  last(),
).subscribe(released =>
  console.log(
    'the most pressure you can release',
    released,
  )
);