import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { from, map, reduce } from 'rxjs';

const line$ = from(
  createInterface({
    input: createReadStream(`./src/21/${process.argv[2]}.txt`),
  })
);

const solve = (monkeys: Map<string, number | string>) => {
  let count = 0;
  let previousCount = 0;
  do {
    previousCount = count;
    for (const [name, task] of monkeys) {
      if ((typeof task === 'string' && task.includes('humn')) || name === 'root') {
        continue;
      }
      const result = +eval(task as string);
      if (!Number.isNaN(result))
        monkeys.set(name, result);
    }
  } while (
    (count = [...monkeys.values()].filter(task => typeof task === 'string').length)
    !== previousCount
  );

  do {
    const task = monkeys.get('root') as string;
    const waitFors = [
      ...(monkeys.get('root') as string).matchAll(/monkeys\.get\('(?!humn).+?'\)/g)
    ];
    for (const [waitFor] of waitFors) {
      const translateTo = `(${eval(waitFor)})`;
      monkeys.set('root', task.replaceAll(waitFor, translateTo));
    }

  } while ([...(monkeys.get('root') as string).matchAll(/monkeys\.get\('(?!humn).+?'\)/g)].length > 0);

  let full = (monkeys.get('root') as string).replace(`monkeys.get('humn')`, 'x');
  const toReplace = [...full.matchAll(/\((\d+)\)/g)].map(([from, to]) => [from, to]);

  for (const [from, to] of toReplace) {
    full = full.replaceAll(from, to);
  }

  monkeys.set('root', full.replace(/ /g, ''));
  return monkeys.get('root');
}

line$.pipe(
  map(line => /(.+): (.+)$/g.exec(line)?.slice(1, 3)!),
  reduce((acc, [name, task]) =>
    acc.set(name, Number.isNaN(+task)
      ? (name === 'root' ? task.replace('+', '=') : task).split(' ').map((text, i) => i !== 1 ? `monkeys.get('${text}')` : text).join(' ')
      : +task),
    new Map<string, number | string>()
  ),
  map(solve),
).subscribe(humn =>
  console.log(
    `number you do yell to pass root's equality test is "x" in equation:\n`,
    humn,
  )
);