const { app } = require('electron');
const { createMainWindow } = require('./windows/mainWindow');
const { registerIpcHandlers } = require('./ipc/ipcHandlers');
const viewManager = require('./browser/viewManager');
const { applyHardening } = require('./security/hardening');

let mainWindow;

app.whenReady().then(() => {
  applyHardening();
  mainWindow = createMainWindow();
  registerIpcHandlers(mainWindow, viewManager);

  app.on('activate', () => {
    if (mainWindow === null) {
      mainWindow = createMainWindow();
      registerIpcHandlers(mainWindow, viewManager);
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
