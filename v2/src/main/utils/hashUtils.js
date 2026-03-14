'use strict';

const crypto = require('crypto');

// Compute a deterministic hash of an input value using Node.js built-in crypto.
// Input is stringified with JSON.stringify if it is not already a string.
// Returns a prefixed hex string: "<algorithm>:<hex>".
function createHash(input, algorithm = 'sha256') {
  const str = typeof input === 'string' ? input : JSON.stringify(input);
  const hex = crypto.createHash(algorithm).update(str, 'utf8').digest('hex');
  return `${algorithm}:${hex}`;
}

module.exports = { createHash };
