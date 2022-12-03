import { createReadStream } from 'fs';
import { createInterface } from 'readline/promises';
import { combineLatestWith, concat, distinct, filter, from, map, mergeMap, range, reduce, skip, switchMap, take } from 'rxjs';

const rl = createInterface({
  input: createReadStream(`./src/3/${process.argv[2]}.txt`),
});

const itemTypePriorities$ = concat(
  range(97, 26),
  range(65, 26),
).pipe(
  reduce((dict, codePoint, i) => dict.set(String.fromCodePoint(codePoint), i + 1), new Map<string, number>()),
);

from(rl).pipe(
  mergeMap(line => from(line).pipe(
    take(line.length / 2),
    reduce((charSet, char) => charSet.add(char), new Set<string>()),
    switchMap(charSet => from(line).pipe(
      skip(line.length / 2),
      distinct(),
      filter(char => charSet.has(char)),
    )),
  )),
  combineLatestWith(itemTypePriorities$),
  map(([char, itemTypePriorities]) => itemTypePriorities.get(char) ?? 0),
  reduce((acc, priority) => acc + priority, 0),
).subscribe(sumOfPriorities => console.log('The sum of the priorities of error item types', sumOfPriorities));