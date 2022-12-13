import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { bufferCount, filter, from, map, reduce } from 'rxjs';

const line$ = from(
  createInterface({
    input: createReadStream(`./src/13/${process.argv[2]}.txt`),
  })
);

type Data = number | Data[] | undefined;

const isRightOrder = (left: Data, right: Data): boolean | null => {
  if (left === undefined && right === undefined) return null;
  else if (left === undefined) return true;
  else if (right === undefined) return false;
  if (Array.isArray(left)) {
    if (Array.isArray(right)) {
      let i = 0;
      const lenght = Math.max(left.length, right.length);
      while (true) {
        const leftData = left[i];
        const rightData = right[i];
        const compare = isRightOrder(leftData, rightData);
        if (compare !== null) return compare;
        if (++i >= lenght) return null;
      }
    }
    return isRightOrder(left, [right]);
  } else {
    if (Array.isArray(right)) return isRightOrder([left], right);
    if (left < right) return true;
    else if (right < left) return false;
    return null;
  }
}

line$.pipe(
  filter(line => line.length !== 0),
  map(line => JSON.parse(line)),
  bufferCount(2),
  map(([left, right]) => isRightOrder(left, right)),
  map((isRight, i) => [isRight, i + 1] as const),
  filter(([isRight]) => !!isRight),
  reduce((acc, [, indice]) => acc + indice, 0),
).subscribe(strength => console.log(
  'the sum of the indices of the pairs of packets are already in the right order',
  strength,
));