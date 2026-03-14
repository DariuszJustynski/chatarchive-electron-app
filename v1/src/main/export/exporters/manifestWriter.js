const fs = require('fs/promises');
const path = require('path');

async function writeManifest(dirPath, source, files) {
  const manifest = {
    schemaVersion: '1.0',
    savedAt: new Date().toISOString(),
    source: {
      url: source.url,
      title: source.title,
    },
    files,
  };

  await fs.writeFile(path.join(dirPath, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
}

module.exports = {
  writeManifest,
};
