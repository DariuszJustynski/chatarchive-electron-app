async function exportHtml(webContents, filePath) {
  // MHTML bundles the rendered DOM + all resources (CSS, images, fonts) into a
  // single file.  HTMLOnly strips resources and produces an unreadable shell.
  // MHTML opens natively in Chrome / Edge on Windows.
  await webContents.savePage(filePath, 'MHTML');
  return { type: 'mhtml', path: 'chat.mhtml' };
}

module.exports = {
  exportHtml,
};
