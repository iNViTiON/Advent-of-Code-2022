import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { concat, defer, EMPTY, from, map, type Observable, of, reduce, switchMap, tap, first, distinctUntilChanged, distinct, filter, catchError, toArray } from 'rxjs';

const line$ = from(
  createInterface({
    input: createReadStream(`./src/20/${process.argv[2]}.txt`),
  })
);

interface Linked {
  n: number;
  next: Linked;
  previous: Linked;
}

const linker = (n: number): Linked => ({ n } as Linked);

const linkerToArray = (current: Linked): number[] => {
  const result: number[] = [];
  do {
    result.push(current.n);
    current = current.next;
  }
  while (current.n !== 0)
  return result;
}

const mixing = (sequence: number[]): number[] => {
  const length = sequence.length;
  const mixed = sequence.map(linker);
  let start: Linked;
  for (let i = 0; i < length; ++i) {
    const current = mixed[i];
    if (current.n === 0) start = current;
    current.next = mixed[i + 1] ?? mixed[0];
    current.previous = mixed[i - 1] ?? mixed.at(-1);
  }
  for (let i = 0; i < 10; ++i)
    for (const current of mixed) {
      let move = current.n % (length - 1);
      if (move > 0) {
        current.previous.next = current.next;
        current.next.previous = current.previous;
        let target = current;
        while (move--) {
          target = target.next;
        }
        const next = target.next;
        target.next = current;
        current.previous = target;
        current.next = next;
        next.previous = current;
      } else if (move < 0) {
        current.previous.next = current.next;
        current.next.previous = current.previous;
        let target = current;
        while (move++) {
          target = target.previous;
        }
        const previous = target.previous;
        target.previous = current;
        current.next = target;
        current.previous = previous;
        previous.next = current;
      }
    }
  return linkerToArray(start!);
}

line$.pipe(
  map(n => 811589153 * +n),
  toArray(),
  map(mixing),
  map(mixed => mixed[1000 % mixed.length] + mixed[2000 % mixed.length] + mixed[3000 % mixed.length]),
).subscribe(coordinateSum =>
  console.log(
    'the sum of the three numbers that form the grove coordinates',
    coordinateSum,
  )
);