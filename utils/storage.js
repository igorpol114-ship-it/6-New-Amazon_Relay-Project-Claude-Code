const STORAGE_KEYS = {
  SPEED:       'refreshSpeedSeconds',
  RUNNING:     'isRunning',
  SOUND_MUTED: 'soundMuted',
  AUTO_OPEN:   'autoOpenTopNew',
  NIGHT_MODE:  'nightMode',
  TAB_ALERT:   'tabAlert',
  HIDE_SIMILAR: 'hideSimilarMatches'
};

const storage = {

  async get(key, defaultValue) {
    logger.log('storage', 'get', { key, defaultValue });
    try {
      const result = await chrome.storage.local.get(key);
      return result[key] !== undefined ? result[key] : defaultValue;
    } catch (e) {
      logger.error('storage', 'get failed', { key, error: e });
      return defaultValue;
    }
  },

  async set(key, value) {
    logger.log('storage', 'set', { key, value });
    try {
      await chrome.storage.local.set({ [key]: value });
    } catch (e) {
      logger.error('storage', 'set failed', { key, value, error: e });
    }
  },

  async remove(key) {
    logger.log('storage', 'remove', { key });
    try {
      await chrome.storage.local.remove(key);
    } catch (e) {
      logger.error('storage', 'remove failed', { key, error: e });
    }
  },

  async getAll() {
    logger.log('storage', 'getAll');
    try {
      return await chrome.storage.local.get(null);
    } catch (e) {
      logger.error('storage', 'getAll failed', { error: e });
      return {};
    }
  }

};
