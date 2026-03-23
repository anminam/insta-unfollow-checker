// ── EventBus (pub/sub) ──

/**
 * @typedef {'analysis:start'|'analysis:progress'|'analysis:complete'|'analysis:error'
 *   |'unfollow:start'|'unfollow:progress'|'unfollow:complete'|'unfollow:error'|'unfollow:stop'
 *   |'ui:tab-change'|'ui:filter-change'|'ui:theme-change'|'ui:lang-change'
 *   |'store:updated'|'error'
 * } EventName
 */

class EventBus {
  /** @type {Map<string, Set<Function>>} */
  #listeners = new Map();

  /**
   * @param {EventName} event
   * @param {Function} callback
   */
  on(event, callback) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }
    this.#listeners.get(event).add(callback);
  }

  /**
   * @param {EventName} event
   * @param {Function} callback
   */
  off(event, callback) {
    const set = this.#listeners.get(event);
    if (set) {
      set.delete(callback);
      if (set.size === 0) this.#listeners.delete(event);
    }
  }

  /**
   * @param {EventName} event
   * @param {*} data
   */
  emit(event, data) {
    const set = this.#listeners.get(event);
    if (!set) return;
    for (const cb of set) {
      try {
        cb(data);
      } catch (err) {
        console.error(`[EventBus] Error in handler for "${event}":`, err);
      }
    }
  }

  /**
   * @param {EventName} event
   * @param {Function} callback
   */
  once(event, callback) {
    const wrapper = (data) => {
      this.off(event, wrapper);
      callback(data);
    };
    this.on(event, wrapper);
  }

  /** Remove all listeners */
  clear() {
    this.#listeners.clear();
  }
}

export const bus = new EventBus();
