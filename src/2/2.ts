import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { Observable, from, map, reduce } from 'rxjs';

export type Shape = 'A' | 'B' | 'C';
export type Result = 'X' | 'Y' | 'Z';

const shapeScoreMap: Map<Shape, number> = new Map([['A', 1], ['B', 2], ['C', 3]]);
const compareScoreMap: Map<Result, number> = new Map([['X', 0], ['Y', 3], ['Z', 6]]);

export const getSelfShapeScore = (opponent: Shape, result: Result): number => {
  const opponentScore = shapeScoreMap.get(opponent)!
  return result === 'Y'
    ? opponentScore
    : result === 'X'
      ? (opponentScore - 1) || 3
      : (opponentScore + 1) % 4 || 1;
}

export const toResult = (path: string): Observable<number> => 
  from(createInterface({
    input: createReadStream(path),
  })).pipe(
  map(line => {
    const [opponent, result] = line.split(' ') as [Shape, Result];
    return compareScoreMap.get(result)! + getSelfShapeScore(opponent, result);
  }),
  reduce((acc, item) => acc + item, 0),
  );

const file = process.argv[2];
file && toResult(`./src/2/${file}.txt`).subscribe(totalScore => console.log('total score is', totalScore));