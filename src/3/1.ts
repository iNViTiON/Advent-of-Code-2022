import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { combineLatestWith, concat, distinct, filter, from, map, mergeMap, range, reduce, skip, switchMap, take } from 'rxjs';
import type { Observable } from 'rxjs';

const itemTypePriorities$ = concat(
  range(97, 26),
  range(65, 26),
).pipe(
  reduce((dict, codePoint, i) => dict.set(String.fromCodePoint(codePoint), i + 1), new Map<string, number>()),
);

export const toResult = (path: string): Observable<number> =>
  from(createInterface({
    input: createReadStream(path),
  })).pipe(
    mergeMap(line => from(line).pipe(
      take(line.length / 2),
      reduce((charSet, char) => charSet.add(char), new Set<string>()),
      switchMap(charSet => from(line).pipe(
        skip(line.length / 2),
        distinct(),
        filter(char => charSet.has(char)),
      )))),
    combineLatestWith(itemTypePriorities$),
    map(([char, itemTypePriorities]) => itemTypePriorities.get(char) ?? 0),
    reduce((acc, priority) => acc + priority, 0),
  );

const file = process.argv[2];
file && toResult(`./src/3/${file}.txt`).subscribe(sumOfPriorities => console.log('The sum of the priorities of error item types', sumOfPriorities));