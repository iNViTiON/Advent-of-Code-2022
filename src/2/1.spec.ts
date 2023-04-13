import assert from 'node:assert';
import test, { describe } from 'node:test';
import { compareScore, toResult } from './1.js';
import { from, concatMap } from 'rxjs';

const files = (function* () {
  yield 'ex';
  yield 'in';
})();

const results = (function* () {
  yield 15;
  yield 12679;
})();

describe('test day 2/1', () => {
  describe('compareScore', () => {
    test('should return 3 when self and opponent scores are equal', () => {
      assert.strictEqual(compareScore(0, 0), 3);
      assert.strictEqual(compareScore(1, 1), 3);
      assert.strictEqual(compareScore(2, 2), 3);
    });

    test('should return 6 when self wins over opponent', () => {
      assert.strictEqual(compareScore(0, 2), 6);
      assert.strictEqual(compareScore(1, 0), 6);
      assert.strictEqual(compareScore(2, 1), 6);
    });

    test('should return 0 when opponent wins over self', () => {
      assert.strictEqual(compareScore(0, 1), 0);
      assert.strictEqual(compareScore(1, 2), 0);
      assert.strictEqual(compareScore(2, 0), 0);
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