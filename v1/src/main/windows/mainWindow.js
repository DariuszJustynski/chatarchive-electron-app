const path = require('path');
const { BrowserWindow } = require('electron');
const { createBrowserView, setBounds } = require('../browser/viewManager');

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, '../../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, '../../renderer/index.html'));
  createBrowserView(mainWindow);
  mainWindow.on('resize', () => setBounds(mainWindow));

  return mainWindow;
}

module.exports = {
  createMainWindow,
};
