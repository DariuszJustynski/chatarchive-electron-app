'use strict';

// Count visible characters in a string.
// Defensive: handles null, undefined, non-strings.
function countChars(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.length;
}

// Estimate word count by splitting on whitespace.
// Rough approximation — not linguistic analysis.
function estimateWords(text) {
  if (!text || typeof text !== 'string') return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// Safe average: returns 0 when count is 0 or falsy (division by zero guard).
function safeAverage(sum, count) {
  if (!count || count === 0) return 0;
  return sum / count;
}

// Percentage: returns 0 if total is 0 (division by zero guard).
function toPercent(part, total) {
  if (!total || total === 0) return 0;
  return (part / total) * 100;
}

module.exports = { countChars, estimateWords, safeAverage, toPercent };
