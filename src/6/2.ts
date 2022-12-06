import { createReadStream } from 'node:fs';
import { bufferCount, delay, expand, filter, first, fromEvent, map, of, takeWhile } from 'rxjs';

const readable = createReadStream(`./src/6/${process.argv[2]}.txt`, {
  encoding: 'utf8',
})

fromEvent(readable, 'readable').pipe(
  expand((_, i) => i % 400 ? of(readable.read(1) as string) : of(readable.read(1) as string).pipe(delay(0)), 1),
  filter(char => char !== undefined),
  takeWhile(char => char !== null),
  bufferCount(14, 1),
  map((chars, i) => ({ i: i + 14, unique: new Set<string>(chars).size })),
  filter(({ unique }) => unique === 14),
  first(),
).subscribe(({ i }) => console.log('Characters need to be processed before the first start-of-message marker is detected', i))