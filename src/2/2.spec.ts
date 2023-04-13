import assert from 'node:assert';
import test, { describe } from 'node:test';
import { Result, Shape, getSelfShapeScore, toResult } from './2.js';
import { from, concatMap } from 'rxjs';

const files = (function* () {
  yield 'ex';
  yield 'in';
})();

const results = (function* () {
  yield 12;
  yield 14470;
})();

describe('test day 2/2', () => {
  test('getSelfShapeScore, should return the correct self shape score for given opponent shape and result', () => {
    const testCases: Array<[Shape, Result, number]> = [
      ['A', 'X', 3],
      ['A', 'Y', 1],
      ['A', 'Z', 2],
      ['B', 'X', 1],
      ['B', 'Y', 2],
      ['B', 'Z', 3],
      ['C', 'X', 2],
      ['C', 'Y', 3],
      ['C', 'Z', 1],
    ];

    testCases.forEach(([opponent, result, expected]) => {
      assert.strictEqual(getSelfShapeScore(opponent, result), expected);
    });
  });

  test('result', (_, done) => {
    from(files).pipe(
      concatMap(file => toResult(`./src/2/${file}.txt`)),
    ).subscribe({
      next: value => assert.strictEqual(value, results.next().value),
      complete: done,
    });
  });
});