import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { count, filter, from, map, mergeMap, range, reduce, toArray } from 'rxjs';

const rl = createInterface({
  input: createReadStream(`./src/4/${process.argv[2]}.txt`),
});

from(rl).pipe(
  mergeMap(pairSection => from(pairSection.split(',')).pipe(
    map(section => section.split('-').map(Number)),
    mergeMap(([start, end]) => range(start, (end - start) + 1).pipe(
      reduce((sectionSet, section) => sectionSet.add(section), new Set<number>()),
    )),
    toArray(),
    filter(([sectionSetA, sectionSetB]) =>
      [...sectionSetB].every(section => sectionSetA.has(section))
      || [...sectionSetA].every(section => sectionSetB.has(section))
    ),
  )),
  count(),
).subscribe(sumOfPriorities => console.log('Assignment pairs does one range fully contain the other count is', sumOfPriorities));