import { createReadStream } from 'fs';
import { createInterface } from 'readline/promises';
import { connect, filter, from, map, mergeMap, reduce, toArray, window } from 'rxjs';

const rl = createInterface({
  input: createReadStream(process.argv[2]),
});

from(rl).pipe(
  connect(rl$ => rl$.pipe(
    window(rl$.pipe(filter(line => line.length === 0))),
  )),
  mergeMap(item$ => item$.pipe(
    reduce((acc, item) => acc + +item, 0),
  )),
  toArray(),
  map(sumCalories => (sumCalories.sort((a, b) => b - a).length = 3, sumCalories.reduce((acc, sumCal) => acc + sumCal, 0))),
).subscribe(mostCalories => console.log('Most total Calories the Elf carrying is', mostCalories));