import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { Observable, connect, filter, from, max, mergeMap, reduce, window } from 'rxjs';

export const toResult = (path: string): Observable<number> =>
   from(createInterface({
    input: createReadStream(path),
  })).pipe(
    connect(rl$ => rl$.pipe(
      window(rl$.pipe(filter(line => line.length === 0))),
    )),
    mergeMap(item$ => item$.pipe(
      reduce((acc, item) => acc + +item, 0),
    )),
    max(),
  );

const file = process.argv[2];

file && toResult(`./src/1/${file}.txt`).subscribe(mostCalories => console.log('Most total Calories the Elf carrying is', mostCalories));