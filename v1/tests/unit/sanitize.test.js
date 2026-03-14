const test = require('node:test');
const assert = require('node:assert/strict');
const { slugify } = require('../../src/main/utils/sanitize');

test('slugify removes special chars', () => {
  assert.equal(slugify('Hello!!! @ Chat? #1'), 'hello-chat-1');
});

test('slugify converts spaces and separators to dash', () => {
  assert.equal(slugify('Ala ma_kota   i psa'), 'ala-ma-kota-i-psa');
});

test('slugify limits length to 80 chars', () => {
  const input = 'a'.repeat(120);
  assert.equal(slugify(input).length, 80);
});
