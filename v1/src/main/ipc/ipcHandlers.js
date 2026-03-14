const { ipcMain, dialog } = require('electron');
const { v4: uuidv4 } = require('uuid');
const { IPC_CHANNELS } = require('./ipcChannels');
const queueStore = require('../store/queueStore');
const settingsStore = require('../store/settingsStore');
const { runExport } = require('../export/exportManager');

function registerIpcHandlers(mainWindow, viewManager) {
  ipcMain.handle(IPC_CHANNELS.NAV_GO, async (_event, payload) => {
    const url = payload?.url || '';
    if (!url) return { ok: false };
    const finalUrl = /^https?:\/\//.test(url) ? url : `https://${url}`;
    await viewManager.goTo(finalUrl);
    return { ok: true };
  });

  ipcMain.handle(IPC_CHANNELS.NAV_BACK, async () => {
    viewManager.goBack();
    return { ok: true };
  });

  ipcMain.handle(IPC_CHANNELS.NAV_FORWARD, async () => {
    viewManager.goForward();
    return { ok: true };
  });

  ipcMain.handle(IPC_CHANNELS.NAV_RELOAD, async () => {
    viewManager.reload();
    return { ok: true };
  });

  ipcMain.handle(IPC_CHANNELS.QUEUE_ADD_CURRENT, async () => {
    const page = viewManager.getCurrentPageInfo();
    if (!page.url) return { ok: false };

    const item = {
      id: uuidv4(),
      url: page.url,
      title: page.title || 'chat',
      addedAt: new Date().toISOString(),
      checked: true,
      notes: '',
    };

    const queue = await queueStore.addItem(item);
    return queue.items;
  });

  ipcMain.handle(IPC_CHANNELS.QUEUE_GET_ALL, async () => {
    const queue = await queueStore.getQueue();
    return queue.items;
  });

  ipcMain.handle(IPC_CHANNELS.QUEUE_SET_CHECKED, async (_event, payload) => {
    const queue = await queueStore.setChecked(payload.id, payload.checked);
    return queue.items;
  });

  ipcMain.handle(IPC_CHANNELS.QUEUE_REMOVE_SELECTED, async (_event, payload) => {
    const queue = await queueStore.removeSelected(payload.ids || []);
    return queue.items;
  });

  ipcMain.handle(IPC_CHANNELS.QUEUE_CLEAR, async () => {
    const queue = await queueStore.clearQueue();
    return queue.items;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_GET, async () => settingsStore.getSettings());

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET_OUTPUT_DIR, async (_event, payload) => {
    if (payload?.outputDir) {
      return settingsStore.setOutputDir(payload.outputDir);
    }

    const selected = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory', 'createDirectory'],
    });

    if (!selected.canceled && selected.filePaths?.[0]) {
      return settingsStore.setOutputDir(selected.filePaths[0]);
    }

    return settingsStore.getSettings();
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS_SET_FORMATS, async (_event, payload) => settingsStore.setFormats(payload.formats));

  ipcMain.handle(IPC_CHANNELS.EXPORT_RUN_SELECTED, async () => {
    const queue = await queueStore.getQueue();
    const settings = await settingsStore.getSettings();
    const items = queue.items.filter((item) => item.checked);

    return runExport({
      mainWindow,
      items,
      formats: settings.formats,
      outputDir: settings.outputDir,
      viewManager,
    });
  });
}

module.exports = {
  registerIpcHandlers,
};
