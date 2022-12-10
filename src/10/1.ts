import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { concatMap, filter, from, reduce, scan, skipLast, startWith, type Observable } from 'rxjs';

const line$ = from(
  createInterface({
    input: createReadStream(`./src/10/${process.argv[2]}.txt`),
  })
);

interface State {
  cycle: number;
  x: number;
};

const state$: Observable<State> = line$.pipe(
  concatMap(line => line.startsWith('addx ')
    ? [0, +(line.split(' ').at(1) ?? 0)]
    : [0]
  ),
  startWith(0),
  skipLast(1),
  scan(({ x }, add, i) => (
    { x: x + add, cycle: i + 1 }
  ), { x: 1, cycle: 0 }),
);

state$.pipe(
  filter(({ cycle }) => (cycle - 20) % 40 === 0),
  reduce((acc, { x, cycle }) => acc + x * cycle, 0),
).subscribe(strength => console.log('the sum of these six signal strengths', strength));