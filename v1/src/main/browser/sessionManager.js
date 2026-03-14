const { session } = require('electron');

function getPersistedSession() {
  return session.fromPartition('persist:chatgpt');
}

module.exports = {
  getPersistedSession,
};
