const state = {
  items: [],
  settings: {
    outputDir: '',
    formats: { html: true, pdf: false, txt: false },
  },
  logs: [],
};

function addLog(message) {
  state.logs.unshift(`[${new Date().toLocaleTimeString()}] ${message}`);
  state.logs = state.logs.slice(0, 100);
}

async function refreshQueue() {
  state.items = await window.api.queueGetAll();
}

async function refreshSettings() {
  state.settings = await window.api.settingsGet();
}

function render() {
  window.TopBar({
    onGo: async (url) => {
      await window.api.navGo(url);
      addLog(`Go: ${url}`);
      render();
    },
    onBack: async () => {
      await window.api.navBack();
      addLog('Back');
      render();
    },
    onForward: async () => {
      await window.api.navForward();
      addLog('Forward');
      render();
    },
    onReload: async () => {
      await window.api.navReload();
      addLog('Reload');
      render();
    },
    onAddCurrent: async () => {
      state.items = await window.api.queueAddCurrent();
      addLog('Dodano bieżący czat do kolejki');
      render();
    },
  });

  window.QueuePanel({
    items: state.items,
    onToggle: async (id, checked) => {
      state.items = await window.api.queueSetChecked(id, checked);
      render();
    },
    onSelectAll: async () => {
      await Promise.all(state.items.map((item) => window.api.queueSetChecked(item.id, true)));
      await refreshQueue();
      render();
    },
    onUnselectAll: async () => {
      await Promise.all(state.items.map((item) => window.api.queueSetChecked(item.id, false)));
      await refreshQueue();
      render();
    },
    onRemoveSelected: async (ids) => {
      state.items = await window.api.queueRemoveSelected(ids);
      addLog(`Usunięto ${ids.length} pozycji`);
      render();
    },
    onClear: async () => {
      state.items = await window.api.queueClear();
      addLog('Wyczyszczono kolejkę');
      render();
    },
  });

  window.ExportPanel({
    settings: state.settings,
    onSetFormats: async (formats) => {
      state.settings = await window.api.settingsSetFormats(formats);
      addLog('Zapisano formaty eksportu');
      render();
    },
    onPickOutputDir: async () => {
      state.settings = await window.api.settingsSetOutputDir('');
      addLog(`Output: ${state.settings.outputDir}`);
      render();
    },
    onRunExport: async () => {
      addLog('Start eksportu...');
      render();
      const results = await window.api.exportRunSelected();
      const ok = results.filter((r) => r.ok).length;
      addLog(`Eksport zakończony. Sukces: ${ok}/${results.length}`);
      render();
    },
  });

  window.StatusPanel({ logs: state.logs });
}

window.api.onExportProgress((payload) => {
  addLog(`Progress ${payload.step}/${payload.total}: ${payload.message}`);
  render();
});

window.api.onExportDone((payload) => {
  addLog(`EXPORT_DONE: ${payload.results.length} wyników`);
  render();
});

(async function init() {
  await refreshQueue();
  await refreshSettings();
  addLog('Aplikacja gotowa');
  render();
})();
