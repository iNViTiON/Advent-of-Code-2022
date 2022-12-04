import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import type { Observable, UnaryFunction } from 'rxjs';
import { count, filter, from, map, mergeMap, pipe, range, reduce, toArray } from 'rxjs';

const pairSection$ = from(
  createInterface({
    input: createReadStream(`./src/4/${process.argv[2]}.txt`),
  })
);

const isOverlap = <T>([setA, setB]: Set<T>[]) => new Set<T>([...setA, ...setB]).size !== setA.size + setB.size;
const filterOnlyContain: UnaryFunction<Observable<string>, Observable<Set<number>[]>> = pipe(
  map((section: string) => section.split('-').map(Number)),
  mergeMap(([start, end]) => range(start, (end - start) + 1).pipe(
    reduce<number, Set<number>>((sectionSet, section) => sectionSet.add(section), new Set<number>())
  )),
  toArray(),
  filter(isOverlap),
);

pairSection$.pipe(
  mergeMap(pairSection => from(pairSection.split(',')).pipe(filterOnlyContain)),
  count(),
).subscribe(sumOfPriorities => console.log('Assignment pairs do the ranges overlap count is', sumOfPriorities));