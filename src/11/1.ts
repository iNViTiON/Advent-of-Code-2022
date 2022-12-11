import { readFile } from 'node:fs/promises';
import { concatMap, from, last, map, pipe, range, reduce, switchMap, tap, UnaryFunction, type Observable } from 'rxjs';

const in$ = from(readFile(`./src/11/${process.argv[2]}.txt`, { encoding: 'utf8' }))

interface Monkey {
  items: number[];
  operation: string;
  test: number;
  trueTo: number;
  falseTo: number;
  inspectCount: number;
}

const doRound = (monkeyMap: Map<number, Monkey>) =>
  range(0, monkeyMap.size).pipe(
    map(id => monkeyMap.get(id)!),
    map(monkey => {
      while (monkey.items.length > 0) {
        const old = monkey.items.shift()!;
        ++monkey.inspectCount;
        let newW = 0;
        eval(monkey.operation);
        newW = Math.floor(newW / 3);
        const targetMonkey = newW % monkey.test === 0 ? monkey.trueTo : monkey.falseTo;
        monkeyMap.get(targetMonkey)!.items.push(newW);
      }
      return monkeyMap;
    }),
    last(),
  );

const doMultipleRound = (round: number): UnaryFunction<Observable<Map<number, Monkey>>, Observable<Map<number, Monkey>>> =>
  // @ts-ignore
  pipe(...Array.from({ length: round }).map(() => concatMap(doRound)));

const monkeyMap$ = in$.pipe(
  switchMap(data => [...data.matchAll(
    /Monkey (\d)[\s\S]+?items: ((?:\d|,| )+?)\r?\n(?:.+Operation: )(.+)\r?\n.+?(\d+)\r?\n.+(\d+)\r?\n.+(\d+)/gm
  )]),
  reduce((monkeyMap, [, monkey, start, operation, test, trueTo, falseTo]) =>
    monkeyMap.set(+monkey, {
      items: start.split(', ').map(Number),
      operation: operation.replace('new', 'newW'),
      test: +test,
      trueTo: +trueTo,
      falseTo: +falseTo,
      inspectCount: 0,
    }), new Map<number, Monkey>()
  ),
);

monkeyMap$.pipe(
  doMultipleRound(20),
  map(monkeyMap =>
    [...monkeyMap.values()]
      .map(monkey => monkey.inspectCount)
      .sort((a, b) => b - a)
  ),
).subscribe(([mostAMI, secondMostAMI]) =>
  console.log(
    'level of monkey business after 20 rounds of stuff-slinging simian shenanigans',
    mostAMI * secondMostAMI,
  )
)