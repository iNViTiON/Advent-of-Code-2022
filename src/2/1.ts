import { createReadStream } from 'fs';
import { createInterface } from 'readline/promises';
import { from, map, reduce } from 'rxjs';

const rl = createInterface({
  input: createReadStream(`./src/2/${process.argv[2]}.txt`),
});

type Shape = 'A' | 'B' | 'C' | 'X' | 'Y' | 'Z';

const shapeScore: Map<Shape, number> = new Map([['A', 1], ['B', 2], ['C', 3], ['X', 1], ['Y', 2], ['Z', 3]]);

const compareScore = (self: number, opponent: number): number =>
  self === opponent ? 3 : (((self + 3) - opponent) % 3) === 1 ? 6 : 0;

from(rl).pipe(
  map(line => {
    const [opponent, self] = (line.split(' ') as [Shape, Shape]).map(shape => shapeScore.get(shape)!);
    return self + compareScore(self, opponent);
  }),
  reduce((acc, item) => acc + item, 0),
).subscribe(totalScore => console.log('total score is', totalScore));