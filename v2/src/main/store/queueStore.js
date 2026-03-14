const path = require('path');
const { app } = require('electron');
const { writeJsonAtomic, readJsonOrDefault } = require('../utils/fsSafe');

const schemaVersion = '1.0';

function getQueuePath() {
  return path.join(app.getPath('userData'), 'queue.json');
}

function defaultQueue() {
  return {
    schemaVersion,
    items: [],
  };
}

async function getQueue() {
  return readJsonOrDefault(getQueuePath(), defaultQueue());
}

async function saveQueue(queue) {
  const nextQueue = {
    schemaVersion,
    items: Array.isArray(queue.items) ? queue.items : [],
  };
  await writeJsonAtomic(getQueuePath(), nextQueue);
  return nextQueue;
}

async function addItem(item) {
  const queue = await getQueue();
  queue.items.push(item);
  return saveQueue(queue);
}

async function setChecked(id, checked) {
  const queue = await getQueue();
  queue.items = queue.items.map((item) => (item.id === id ? { ...item, checked: Boolean(checked) } : item));
  return saveQueue(queue);
}

async function removeSelected(ids) {
  const idSet = new Set(ids);
  const queue = await getQueue();
  queue.items = queue.items.filter((item) => !idSet.has(item.id));
  return saveQueue(queue);
}

async function clearQueue() {
  return saveQueue(defaultQueue());
}

module.exports = {
  getQueue,
  saveQueue,
  addItem,
  setChecked,
  removeSelected,
  clearQueue,
};
