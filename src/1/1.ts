import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { connect, filter, from, max, mergeMap, reduce, window } from 'rxjs';

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
  max(),
).subscribe(mostCalories => console.log('Most total Calories the Elf carrying is', mostCalories));