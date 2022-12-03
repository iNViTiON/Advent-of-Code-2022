import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { connect, filter, from, mergeMap, reduce, switchMap, take, toArray, window } from 'rxjs';

const rl = createInterface({
  input: createReadStream(`./src/1/${process.argv[2]}.txt`),
});

from(rl).pipe(
  connect(rl$ => rl$.pipe(
    window(rl$.pipe(filter(line => line.length === 0))),
  )),
  mergeMap(item$ => item$.pipe(
    reduce((acc, item) => acc + +item, 0),
  )),
  toArray(),
  switchMap(sumCalories => sumCalories.sort((a, b) => b - a)),
  take(3),
  reduce((acc, sumCal) => acc + sumCal, 0),
).subscribe(mostCalories => console.log('Top three of most total Calories the Elf carrying combined is', mostCalories));