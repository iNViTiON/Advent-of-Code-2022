import assert from 'node:assert';
import test, { describe } from 'node:test';
import { toResult } from './1.js';
import { from, concatMap } from 'rxjs';

const files = (function* () {
  yield 'ex';
  yield 'in';
})();

const results = (function* () {
  yield 157;
  yield 8298;
})();

describe('test day 3/1', () => {
  test('result', (_, done) => {
    from(files).pipe(
      concatMap(file => toResult(`./src/3/${file}.txt`)),
    ).subscribe({
      next: value => assert.strictEqual(value, results.next().value),
      complete: done,
    });
  });
});