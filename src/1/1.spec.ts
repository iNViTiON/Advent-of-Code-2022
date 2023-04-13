import assert from 'node:assert';
import test from 'node:test';
import { concatMap, from } from 'rxjs';
import { toResult } from './1.js';

const files = (function* () {
    yield 'ex';
    yield 'in';
})();

const results = (function* () {
    yield 24000;
    yield 71300;
})();

test('test day 1/1', (_, done) => {
    from(files).pipe(
        concatMap(file => toResult(`./src/1/${file}.txt`)),
    ).subscribe({
        next: value => assert.strictEqual(value, results.next().value),
        complete: done,
    });
});