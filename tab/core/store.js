// ── AppStore (central state + subscriptions) ──

const INITIAL_STATE = {
  analysisStatus: 'idle',       // 'idle' | 'analyzing' | 'complete' | 'error'
  analysisData: null,           // { following, followers, mutual, notFollowingBack, followerOnly, ... }
  currentTab: 'not-following',  // current view/tab name
  selectedIds: new Set(),
  filters: { search: '', verified: false, ghost: false, tag: null, sort: 'default' },
  unfollowStatus: 'idle',       // 'idle' | 'running' | 'paused' | 'complete'
  unfollowProgress: { current: 0, total: 0, eta: '' },
  userTier: 'free',             // 'free' | 'premium'
  darkMode: false,
  lang: 'ko',
  error: null,                  // { code, message } | null
  isLocked: false,              // analysis duplicate prevention
};

let _subId = 0;

class AppStore {
  #state = { ...INITIAL_STATE };
  /** @type {Map<string, { keys: string[], callback: Function }>} */
  #subscribers = new Map();

  /** @returns {Object} shallow copy of state */
  getState() {
    return { ...this.#state };
  }

  /**
   * @param {string} key
   * @returns {*} value for the key
   */
  get(key) {
    return this.#state[key];
  }

  /**
   * Merge partial state. Only notifies if values actually changed.
   * @param {Object} partial
   */
  setState(partial) {
    const changedKeys = [];
    for (const [key, value] of Object.entries(partial)) {
      if (this.#state[key] !== value) {
        this.#state[key] = value;
        changedKeys.push(key);
      }
    }
    if (changedKeys.length > 0) {
      this.#notify(changedKeys);
    }
  }

  /**
   * Subscribe to specific state keys.
   * @param {string[]} keys - state keys to watch
   * @param {Function} callback - called with changedKeys array
   * @returns {string} subscription ID
   */
  subscribe(keys, callback) {
    const id = String(++_subId);
    this.#subscribers.set(id, { keys, callback });
    return id;
  }

  /**
   * @param {string} id - subscription ID
   */
  unsubscribe(id) {
    this.#subscribers.delete(id);
  }

  /** Reset to initial state */
  reset() {
    this.#state = { ...INITIAL_STATE, selectedIds: new Set() };
    this.#notify(Object.keys(INITIAL_STATE));
  }

  /** @private */
  #notify(changedKeys) {
    for (const { keys, callback } of this.#subscribers.values()) {
      const overlap = changedKeys.some(k => keys.includes(k));
      if (overlap) {
        try {
          callback(changedKeys);
        } catch (err) {
          console.error('[Store] Subscriber error:', err);
        }
      }
    }
  }
}

export const store = new AppStore();
