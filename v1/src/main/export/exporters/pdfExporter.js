const fs = require('fs/promises');

async function exportPdf(webContents, filePath) {
  const data = await webContents.printToPDF({});
  await fs.writeFile(filePath, data);
  return { type: 'pdf', path: 'chat.pdf' };
}

module.exports = {
  exportPdf,
};
