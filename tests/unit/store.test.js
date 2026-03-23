import { describe, it, expect, vi } from 'vitest';

// Inline Store for testing
let _subId = 0;
class AppStore {
  #state = {};
  #subscribers = new Map();

  constructor(initial) {
    this.#state = { ...initial };
  }

  getState() { return { ...this.#state }; }
  get(key) { return this.#state[key]; }

  setState(partial) {
    const changedKeys = [];
    for (const [key, value] of Object.entries(partial)) {
      if (this.#state[key] !== value) {
        this.#state[key] = value;
        changedKeys.push(key);
      }
    }
    if (changedKeys.length > 0) this.#notify(changedKeys);
  }

  subscribe(keys, callback) {
    const id = String(++_subId);
    this.#subscribers.set(id, { keys, callback });
    return id;
  }

  unsubscribe(id) { this.#subscribers.delete(id); }

  #notify(changedKeys) {
    for (const { keys, callback } of this.#subscribers.values()) {
      if (changedKeys.some(k => keys.includes(k))) {
        callback(changedKeys);
      }
    }
  }
}

describe('AppStore', () => {
  it('should return initial state', () => {
    const store = new AppStore({ count: 0, name: 'test' });
    expect(store.getState()).toEqual({ count: 0, name: 'test' });
  });

  it('should get single key', () => {
    const store = new AppStore({ count: 5 });
    expect(store.get('count')).toBe(5);
  });

  it('should update state with setState', () => {
    const store = new AppStore({ count: 0 });
    store.setState({ count: 10 });
    expect(store.get('count')).toBe(10);
  });

  it('should notify subscribers on relevant key change', () => {
    const store = new AppStore({ a: 1, b: 2 });
    const fn = vi.fn();
    store.subscribe(['a'], fn);
    store.setState({ a: 10 });
    expect(fn).toHaveBeenCalledWith(['a']);
  });

  it('should not notify subscriber for unrelated key change', () => {
    const store = new AppStore({ a: 1, b: 2 });
    const fn = vi.fn();
    store.subscribe(['a'], fn);
    store.setState({ b: 20 });
    expect(fn).not.toHaveBeenCalled();
  });

  it('should not notify if value is the same', () => {
    const store = new AppStore({ a: 1 });
    const fn = vi.fn();
    store.subscribe(['a'], fn);
    store.setState({ a: 1 });
    expect(fn).not.toHaveBeenCalled();
  });

  it('should unsubscribe correctly', () => {
    const store = new AppStore({ a: 1 });
    const fn = vi.fn();
    const id = store.subscribe(['a'], fn);
    store.unsubscribe(id);
    store.setState({ a: 99 });
    expect(fn).not.toHaveBeenCalled();
  });

  it('should return a copy from getState (immutable)', () => {
    const store = new AppStore({ a: 1 });
    const state = store.getState();
    state.a = 999;
    expect(store.get('a')).toBe(1);
  });
});
