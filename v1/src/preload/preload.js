const { contextBridge, ipcRenderer } = require('electron');

// Channel names inlined: sandbox: true preloads cannot require() local project files.
// Electron's sandboxed require() only supports 'electron' and core Node built-ins.
const CH = {
  NAV_GO: 'NAV_GO',
  NAV_BACK: 'NAV_BACK',
  NAV_FORWARD: 'NAV_FORWARD',
  NAV_RELOAD: 'NAV_RELOAD',
  QUEUE_ADD_CURRENT: 'QUEUE_ADD_CURRENT',
  QUEUE_GET_ALL: 'QUEUE_GET_ALL',
  QUEUE_SET_CHECKED: 'QUEUE_SET_CHECKED',
  QUEUE_REMOVE_SELECTED: 'QUEUE_REMOVE_SELECTED',
  QUEUE_CLEAR: 'QUEUE_CLEAR',
  SETTINGS_GET: 'SETTINGS_GET',
  SETTINGS_SET_OUTPUT_DIR: 'SETTINGS_SET_OUTPUT_DIR',
  SETTINGS_SET_FORMATS: 'SETTINGS_SET_FORMATS',
  EXPORT_RUN_SELECTED: 'EXPORT_RUN_SELECTED',
  EXPORT_PROGRESS: 'EXPORT_PROGRESS',
  EXPORT_DONE: 'EXPORT_DONE',
};

contextBridge.exposeInMainWorld('api', {
  navGo: (url) => ipcRenderer.invoke(CH.NAV_GO, { url }),
  navBack: () => ipcRenderer.invoke(CH.NAV_BACK),
  navForward: () => ipcRenderer.invoke(CH.NAV_FORWARD),
  navReload: () => ipcRenderer.invoke(CH.NAV_RELOAD),
  queueAddCurrent: () => ipcRenderer.invoke(CH.QUEUE_ADD_CURRENT),
  queueGetAll: () => ipcRenderer.invoke(CH.QUEUE_GET_ALL),
  queueSetChecked: (id, checked) => ipcRenderer.invoke(CH.QUEUE_SET_CHECKED, { id, checked }),
  queueRemoveSelected: (ids) => ipcRenderer.invoke(CH.QUEUE_REMOVE_SELECTED, { ids }),
  queueClear: () => ipcRenderer.invoke(CH.QUEUE_CLEAR),
  settingsGet: () => ipcRenderer.invoke(CH.SETTINGS_GET),
  settingsSetOutputDir: (outputDir) => ipcRenderer.invoke(CH.SETTINGS_SET_OUTPUT_DIR, { outputDir }),
  settingsSetFormats: (formats) => ipcRenderer.invoke(CH.SETTINGS_SET_FORMATS, { formats }),
  exportRunSelected: () => ipcRenderer.invoke(CH.EXPORT_RUN_SELECTED),
  onExportProgress: (cb) => ipcRenderer.on(CH.EXPORT_PROGRESS, (_evt, payload) => cb(payload)),
  onExportDone: (cb) => ipcRenderer.on(CH.EXPORT_DONE, (_evt, payload) => cb(payload)),
});
