import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { filter, from, map, reduce, switchMap } from 'rxjs';

const line$ = from(
  createInterface({
    input: createReadStream(`./src/21/${process.argv[2]}.txt`),
  })
);

const solve = (monkeys: Map<string, number | string>) => {
  do {
    for (const [name, task] of monkeys) {
      const result = +eval(task as string);
      if (!Number.isNaN(result))
        monkeys.set(name, result);
    }
  } while ([...monkeys.values()].some(task => typeof task === 'string'));

  return monkeys;
}

line$.pipe(
  map(line => /(.+): (.+)$/g.exec(line)?.slice(1, 3)!),
  reduce((acc, [name, task]) =>
    acc.set(name, Number.isNaN(+task)
      ? task.split(' ').map((text, i) => i !== 1 ? `monkeys.get('${text}')` : text).join(' ')
      : +task),
    new Map<string, number | string>()
  ),
  switchMap(solve),
  filter(([name])=>name === 'root'),
  map(([, root])=>root),
).subscribe(root =>
  console.log(
    'What number will the monkey named root yell',
    root,
  )
);