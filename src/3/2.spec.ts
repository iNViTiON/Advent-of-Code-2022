import assert from 'node:assert';
import test, { describe } from 'node:test';
import { toResult } from './2.js';
import { from, concatMap } from 'rxjs';

const files = (function* () {
  yield 'ex';
  yield 'in';
})();

const results = (function* () {
  yield 70;
  yield 2708;
})();

describe('test day 3/2', () => {
  test('result', (_, done) => {
    from(files).pipe(
      concatMap(file => toResult(`./src/3/${file}.txt`)),
    ).subscribe({
      next: value => assert.strictEqual(value, results.next().value),
      complete: done,
    });
  });
});