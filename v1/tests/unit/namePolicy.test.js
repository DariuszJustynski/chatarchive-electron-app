const test = require('node:test');
const assert = require('node:assert/strict');
const { makeFolderName } = require('../../src/main/export/namePolicy');

test('makeFolderName uses timestamp format', () => {
  const date = new Date(2024, 0, 2, 3, 4, 5);
  const result = makeFolderName('Sample Title', date);
  assert.match(result, /^2024-01-02_03-04-05__/);
});

test('makeFolderName uses separator __', () => {
  const result = makeFolderName('X', new Date(2024, 0, 1, 0, 0, 0));
  assert.ok(result.includes('__'));
});

test('makeFolderName falls back to chat slug', () => {
  const result = makeFolderName('', new Date(2024, 0, 1, 0, 0, 0));
  assert.match(result, /__chat$/);
});
