import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { Observable, from, map, reduce } from 'rxjs';

type Shape = 'A' | 'B' | 'C' | 'X' | 'Y' | 'Z';

const shapeScore: Map<Shape, number> = new Map([['A', 1], ['B', 2], ['C', 3], ['X', 1], ['Y', 2], ['Z', 3]]);

export const compareScore = (self: number, opponent: number): number =>
  self === opponent ? 3 : (((self + 3) - opponent) % 3) === 1 ? 6 : 0;

export const toResult = (path: string): Observable<number> => 
  from(createInterface({
    input: createReadStream(path),
  })).pipe(
    map(line => {
      const [opponent, self] = (line.split(' ') as [Shape, Shape]).map(shape => shapeScore.get(shape)!);
      return self + compareScore(self, opponent);
    }),
    reduce((acc, item) => acc + item, 0),
  );

const file = process.argv[2];
file && toResult(`./src/2/${file}.txt`).subscribe(totalScore => console.log('total score is', totalScore));