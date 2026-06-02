const logger = {
  _ts() {
    return new Date().toISOString().slice(11, 23);
  },

  log(module, msg, data) {
    const line = `[EXT][${this._ts()}][${module}] ${msg}`;
    data !== undefined ? console.log(line, data) : console.log(line);
  },

  warn(module, msg, data) {
    const line = `[EXT][${this._ts()}][${module}] ${msg}`;
    data !== undefined ? console.warn(line, data) : console.warn(line);
  },

  error(module, msg, error) {
    const line = `[EXT][${this._ts()}][${module}] ${msg}`;
    error !== undefined ? console.error(line, error) : console.error(line);
  },

  debug(module, msg, data) {
    if (DEBUG_LEVEL < 2) return;
    const line = `[EXT][${this._ts()}][${module}] ${msg}`;
    data !== undefined ? console.debug(line, data) : console.debug(line);
  }
};
