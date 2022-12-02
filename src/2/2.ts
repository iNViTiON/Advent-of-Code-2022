import { createReadStream } from 'fs';
import { createInterface } from 'readline/promises';
import { from, map, reduce } from 'rxjs';

const rl = createInterface({
  input: createReadStream(`./src/2/${process.argv[2]}.txt`),
});

type Shape = 'A' | 'B' | 'C';
type Result = 'X' | 'Y' | 'Z';

const shapeScoreMap: Map<Shape, number> = new Map([['A', 1], ['B', 2], ['C', 3]]);
const compareScoreMap: Map<Result, number> = new Map([['X', 0], ['Y', 3], ['Z', 6]]);

const getSelfShapeScore = (opponent: Shape, result: Result): number => {
  const opponentScore = shapeScoreMap.get(opponent)!
  return result === 'Y'
    ? opponentScore
    : result === 'X'
      ? (opponentScore - 1) || 3
      : (opponentScore + 1) % 4 || 1;
}

from(rl).pipe(
  map(line => {
    const [opponent, result] = line.split(' ') as [Shape, Result];
    return compareScoreMap.get(result)! + getSelfShapeScore(opponent, result);
  }),
  reduce((acc, item) => acc + item, 0),
).subscribe(totalScore => console.log('total score is', totalScore));