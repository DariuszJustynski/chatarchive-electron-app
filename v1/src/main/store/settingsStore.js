const path = require('path');
const { app } = require('electron');
const { writeJsonAtomic, readJsonOrDefault, ensureDir } = require('../utils/fsSafe');

const schemaVersion = '1.0';

function defaultSettings() {
  return {
    schemaVersion,
    outputDir: path.join(process.cwd(), 'output_chat_store'),
    formats: {
      html: true,
      pdf: false,
      txt: false,
    },
  };
}

function getSettingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

async function getSettings() {
  const settings = await readJsonOrDefault(getSettingsPath(), defaultSettings());
  if (!settings.outputDir) {
    settings.outputDir = defaultSettings().outputDir;
  }
  if (!settings.formats) {
    settings.formats = defaultSettings().formats;
  }
  await ensureDir(settings.outputDir);
  return settings;
}

async function saveSettings(settings) {
  const nextSettings = {
    schemaVersion,
    outputDir: settings.outputDir,
    formats: {
      html: Boolean(settings.formats?.html),
      pdf: Boolean(settings.formats?.pdf),
      txt: Boolean(settings.formats?.txt),
    },
  };
  await ensureDir(nextSettings.outputDir);
  await writeJsonAtomic(getSettingsPath(), nextSettings);
  return nextSettings;
}

async function setOutputDir(outputDir) {
  const settings = await getSettings();
  settings.outputDir = outputDir;
  return saveSettings(settings);
}

async function setFormats(formats) {
  const settings = await getSettings();
  settings.formats = {
    html: Boolean(formats.html),
    pdf: Boolean(formats.pdf),
    txt: Boolean(formats.txt),
  };
  return saveSettings(settings);
}

module.exports = {
  getSettings,
  saveSettings,
  setOutputDir,
  setFormats,
};
