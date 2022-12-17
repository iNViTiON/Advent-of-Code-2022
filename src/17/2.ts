import { createReadStream } from 'node:fs';
import { defer, delay, expand, filter, fromEvent, last, of, repeat, scan, takeWhile } from 'rxjs';

const getRead = () => {
  const _readable = createReadStream(`./src/17/${process.argv[2]}.txt`, {
    encoding: 'utf8',
  });
  return [_readable, () => _readable.read(1)] as const;
}

const jet$ = defer(() => {
  let [readable, read] = getRead();
  return fromEvent(readable, 'readable').pipe(
    expand((_, i) => i % 400 ? of(read() as string) : of(read() as string).pipe(delay(0)), 1),
    filter(char => char !== undefined),
    takeWhile(char => char !== null),
  );
})

const rockShape = [
  [[15], 4],
  [[2, 5, 2], 3],
  [[7, 1, 1], 3],
  [[1, 1, 1, 1], 1],
  [[3, 3], 2],
] as [number[], number][];

const printRock = (rock: number[], rockLength: number, x = 2) => {
  const bottomUp = rock.slice().reverse().map(n => (n << 7 - rockLength - x).toString(2));
  for (const layer of bottomUp) {
    console.log(layer.split('').map(n => +n ? '#' : '.').join('').padStart(7, '.'));
  }
}

const printChamber = (chamber: number[]) => {
  for (const layer of chamber.slice().reverse()) {
    console.log((layer ?? 0).toString(2).split('').map(v => +v ? '#' : '.').join('').padStart(7, '.'));
  }
}

for (const [shape, length] of rockShape) {
  printRock(shape, length);
  console.log();
}

let rockIndex = -1;
const nextRock = () => rockShape[++rockIndex % rockShape.length];

interface State {
  chamber: number[];
  rock: [number[], number];
  rockX: number;
  rockY: number;
  firstCompareHeight: number,
  firstCompareRockIndex: number,
  rockDiff: number,
  towerOffset: number,
}

const isCollide = (chamber: number[], rock: number[], rockLength: number, rockX: number, rockY: number) => {
  for (let i = 0; i < rock.length; ++i) {
    chamber[rockY + i] ??= 0;
    const chamberLayer = chamber[rockY + i];
    const rockLayer = rock[i] << 7 - rockLength - rockX
    if (chamberLayer & rockLayer) return true;
  }
  return false;
}

const baseIndex = 1000;
const rockLimit = 1000000000000;

jet$.pipe(
  repeat(),
  takeWhile(() => rockIndex < rockLimit),
  scan(({
    chamber,
    rock: [rock, rockLength],
    rockY,
    rockX,
    firstCompareHeight,
    firstCompareRockIndex,
    rockDiff,
    towerOffset,
  }, jet) => {
    chamber = [...chamber];
    const wantTo = jet === '>'
      ? Math.min(7 - rockLength, rockX + 1)
      : Math.max(0, rockX - 1);
    const collide = isCollide(chamber, rock, rockLength, wantTo, rockY);
    if (!collide) rockX = wantTo;
    const isFloor = rockY === 0 || isCollide(chamber, rock, rockLength, rockX, rockY - 1);
    if (isFloor) {
      const placeRock = rock.map(l => l << 7 - rockLength - rockX);
      for (let i = 0; i < placeRock.length; ++i) {
        chamber[rockY + i] ??= 0;
        chamber[rockY + i] += placeRock[i];
      }
      [rock, rockLength] = nextRock();
      const towerHeighest = chamber.indexOf(0);
      rockY = towerHeighest + 3;
      rockX = 2;

      const compareHeight = towerHeighest - 1000;
      if (rockDiff === 0 && compareHeight > baseIndex) {
        if (chamber[compareHeight] === chamber[baseIndex]) {
          let i: number;
          for (i = 1; i < 50000; ++i) {
            if (chamber[compareHeight - i] !== chamber[baseIndex - i]) break;
          }
          if (i > 100) {
            if (firstCompareHeight === 0) {
              firstCompareHeight = compareHeight;
              firstCompareRockIndex = rockIndex;
            } else {
              const heightDiff = compareHeight - firstCompareHeight;
              rockDiff = rockIndex - firstCompareRockIndex;
              const skipTimes = Math.floor((rockLimit - rockIndex) / rockDiff);
              towerOffset += heightDiff * skipTimes;
              rockIndex += rockDiff * skipTimes;
            }
          }
        }
      }
    }
    else --rockY;
    return {
      chamber,
      rock: [rock, rockLength] as [number[], number],
      rockY,
      rockX,
      firstCompareHeight,
      firstCompareRockIndex,
      rockDiff,
      towerOffset,
    };
  }, {
    chamber: [0],
    rock: nextRock(),
    rockY: 3,
    rockX: 2,
    firstCompareHeight: 0,
    firstCompareRockIndex: 0,
    rockDiff: 0,
    towerOffset: 0,
  } as State),
  last(),
).subscribe(({ chamber, towerOffset }) => {
  console.log(
    `How tall will the tower be after ${rockIndex} rocks have stopped`,
    chamber.indexOf(0) + towerOffset,
  );
});