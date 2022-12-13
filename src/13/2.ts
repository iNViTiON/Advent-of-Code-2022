import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { filter, from, map, reduce, startWith, switchMap, toArray } from 'rxjs';

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

const dividerPacket1 = [[2]];
const dividerPacket2 = [[6]];

line$.pipe(
  filter(line => line.length !== 0),
  map(line => JSON.parse(line)),
  startWith(dividerPacket1, dividerPacket2),
  toArray(),
  switchMap(packets => packets.sort((left, right) => isRightOrder(left, right) ? -1 : 1)),
  map((packet, i) => [packet, i + 1] as const),
  filter(([packet]) => packet === dividerPacket1 || packet === dividerPacket2),
  reduce((acc, [, indice]) => acc * indice, 1),
).subscribe(strength => console.log('the decoder key for the distress signal', strength));