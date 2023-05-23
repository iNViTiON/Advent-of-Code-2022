import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { bufferCount, combineLatestWith, concat, filter, first, from, map, mergeAll, mergeMap, range, reduce, skip, switchMap, take, toArray } from 'rxjs';
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
  bufferCount(3),
  mergeMap(groupRucksacks => from(groupRucksacks).pipe(
    take(2),
    mergeMap(rucksack => from(rucksack).pipe(
      reduce((itemSet, char) => itemSet.add(char), new Set<string>()),
    )),
    toArray(),
    switchMap(itemSets => from(groupRucksacks).pipe(
      skip(2),
      mergeAll(),
      filter(item => itemSets.every(itemSet => itemSet.has(item))),
      first(),
    ))
  )),
  combineLatestWith(itemTypePriorities$),
  map(([char, itemTypePriorities]) => itemTypePriorities.get(char) ?? 0),
  reduce((acc, priority) => acc + priority, 0),
);

const file = process.argv[2];
file && toResult(`./src/3/${file}.txt`).subscribe(sumOfPriorities => console.log('The sum of the priorities of badge item types', sumOfPriorities));