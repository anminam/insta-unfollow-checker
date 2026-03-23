// ── Logger (structured logging) ──

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };

class Logger {
  #level = LOG_LEVELS.info;
  #prefix = '[InstaUnfollow]';

  /**
   * @param {'debug'|'info'|'warn'|'error'} level
   */
  setLevel(level) {
    this.#level = LOG_LEVELS[level] ?? LOG_LEVELS.info;
  }

  /**
   * @param {string} module
   * @param {string} message
   * @param {*} [data]
   */
  debug(module, message, data) {
    if (this.#level <= LOG_LEVELS.debug) {
      console.debug(`${this.#prefix}[${module}]`, message, data !== undefined ? data : '');
    }
  }

  /**
   * @param {string} module
   * @param {string} message
   * @param {*} [data]
   */
  info(module, message, data) {
    if (this.#level <= LOG_LEVELS.info) {
      console.info(`${this.#prefix}[${module}]`, message, data !== undefined ? data : '');
    }
  }

  /**
   * @param {string} module
   * @param {string} message
   * @param {*} [data]
   */
  warn(module, message, data) {
    if (this.#level <= LOG_LEVELS.warn) {
      console.warn(`${this.#prefix}[${module}]`, message, data !== undefined ? data : '');
    }
  }

  /**
   * @param {string} module
   * @param {string} message
   * @param {*} [data]
   */
  error(module, message, data) {
    if (this.#level <= LOG_LEVELS.error) {
      console.error(`${this.#prefix}[${module}]`, message, data !== undefined ? data : '');
    }
  }
}

export const logger = new Logger();
