import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { combineLatest, concatMap, connectable, filter, first, from, groupBy, map, mergeMap, of, reduce, repeat, share, skip, skipUntil, switchMap, takeUntil, toArray } from 'rxjs';

const lines$ = connectable(from(
  createInterface({
    input: createReadStream(`./src/5/${process.argv[2]}.txt`),
  })
).pipe(
  share(),
));

const emptyLine$ = lines$.pipe(
  filter(line => line.length === 0),
  first(),
  share(),
);

interface Stack {
  stack: string[],
  i: number,
}

const procedure$ = lines$.pipe(
  skipUntil(emptyLine$),
  skip(1),
  map(line => {
    const [, count, source, target] = [...line.match(/move (.+) from (.+) to (.+)/)!].map(Number);
    return { count, source, target };
  }),
  concatMap(({ count, source, target }) => of(({ source, target })).pipe(repeat(count))),
);

const stacks$ = lines$.pipe(
  takeUntil(emptyLine$),
  concatMap(line => from([...line.matchAll(/(.(.). ?)+?/g)!]).pipe(
    map((crate, i) => ({ crate: crate[2], i: i + 1 })),
  )),
  groupBy(crate => crate.i),
  mergeMap(crateGroup$ => crateGroup$.pipe(
    map(crate => crate.crate),
    filter(crate => crate !== ' ' && Number.isNaN(+crate)),
    toArray(),
    map(stack => ({ stack, i: crateGroup$.key })),
  )),
  reduce<Stack, Map<number, string[]>>((cargo, { stack, i }) => cargo.set(i, stack), new Map<number, string[]>()),
);

combineLatest([stacks$, procedure$]).pipe(
  reduce((_, [stacks, { source, target }]) =>
    (stacks.get(target)!.unshift(stacks.get(source)!.shift()!), stacks)
    , new Map<number, string[]>
  ),
  switchMap(stacks => from(stacks.entries())),
  reduce((acc, [i, [crate]]) => (acc[i] = crate, acc), [] as string[]),
  map(acc => acc.join('')),
).subscribe(result => console.log('Crate ends up on top of each stack is', result));

lines$.connect();