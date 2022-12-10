import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { concatMap, endWith, from, Observable, scan, skipLast, startWith } from 'rxjs';

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
  scan(({ x }, add, cycle) => (
    { x: x + add, cycle }
  ), { x: 1, cycle: 0 }),
);

const getSprite = (x: number) => new Set().add(x - 1).add(x).add(x + 1);
const getChar = (cycle: number, x: number) => 
  new Observable<string>(observer => {
    const column = cycle % 40;
    if (column === 0) observer.next('\n');
    observer.next(getSprite(x).has(column) ? '#' : '.');
    observer.complete();
  });

state$.pipe(
  concatMap(({cycle, x}) => getChar(cycle, x)),
  startWith('eight capital letters appear on your CRT\n'),
  endWith('\n'),
).subscribe(char => process.stdout.write(char));