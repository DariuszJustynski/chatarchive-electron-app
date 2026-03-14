const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function writeJsonAtomic(filePath, data) {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  const tmpPath = path.join(dir, `${path.basename(filePath)}.${randomUUID()}.tmp`);
  await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf8');
  await fs.rename(tmpPath, filePath);
}

async function readJsonOrDefault(filePath, fallback) {
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

module.exports = {
  ensureDir,
  writeJsonAtomic,
  readJsonOrDefault,
};
