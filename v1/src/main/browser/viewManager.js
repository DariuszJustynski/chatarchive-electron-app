const { BrowserView } = require('electron');
const { getPersistedSession } = require('./sessionManager');

let browserView;

function createBrowserView(mainWindow) {
  browserView = new BrowserView({
    webPreferences: {
      session: getPersistedSession(),
      sandbox: true,
    },
  });

  mainWindow.setBrowserView(browserView);
  setBounds(mainWindow);
  browserView.webContents.loadURL('https://chatgpt.com');
  return browserView;
}

function setBounds(mainWindow) {
  if (!browserView) return;
  const [width, height] = mainWindow.getContentSize();
  const controlPanelWidth = 360;
  browserView.setBounds({ x: controlPanelWidth, y: 0, width: Math.max(300, width - controlPanelWidth), height });
  browserView.setAutoResize({ width: true, height: true });
}

function getWebContents() {
  return browserView?.webContents;
}

async function goTo(url) {
  const wc = getWebContents();
  if (!wc) return;
  await wc.loadURL(url);
}

function goBack() {
  const wc = getWebContents();
  if (wc?.canGoBack()) wc.goBack();
}

function goForward() {
  const wc = getWebContents();
  if (wc?.canGoForward()) wc.goForward();
}

function reload() {
  getWebContents()?.reload();
}

function getCurrentPageInfo() {
  const wc = getWebContents();
  return {
    url: wc?.getURL() || '',
    title: wc?.getTitle() || '',
  };
}

module.exports = {
  createBrowserView,
  setBounds,
  getWebContents,
  goTo,
  goBack,
  goForward,
  reload,
  getCurrentPageInfo,
};
