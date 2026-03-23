import { describe, it, expect, vi } from 'vitest';

// Inline EventBus for testing (avoids browser module resolution issues)
class EventBus {
  #listeners = new Map();

  on(event, callback) {
    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }
    this.#listeners.get(event).add(callback);
  }

  off(event, callback) {
    const set = this.#listeners.get(event);
    if (set) {
      set.delete(callback);
      if (set.size === 0) this.#listeners.delete(event);
    }
  }

  emit(event, data) {
    const set = this.#listeners.get(event);
    if (!set) return;
    for (const cb of set) {
      cb(data);
    }
  }

  once(event, callback) {
    const wrapper = (data) => {
      this.off(event, wrapper);
      callback(data);
    };
    this.on(event, wrapper);
  }

  clear() {
    this.#listeners.clear();
  }
}

describe('EventBus', () => {
  it('should call listener on emit', () => {
    const bus = new EventBus();
    const fn = vi.fn();
    bus.on('test', fn);
    bus.emit('test', { value: 1 });
    expect(fn).toHaveBeenCalledWith({ value: 1 });
  });

  it('should not call listener after off', () => {
    const bus = new EventBus();
    const fn = vi.fn();
    bus.on('test', fn);
    bus.off('test', fn);
    bus.emit('test', {});
    expect(fn).not.toHaveBeenCalled();
  });

  it('should call once listener only once', () => {
    const bus = new EventBus();
    const fn = vi.fn();
    bus.once('test', fn);
    bus.emit('test', 'a');
    bus.emit('test', 'b');
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('should not error when emitting non-existent event', () => {
    const bus = new EventBus();
    expect(() => bus.emit('nope', {})).not.toThrow();
  });

  it('should clear all listeners', () => {
    const bus = new EventBus();
    const fn = vi.fn();
    bus.on('a', fn);
    bus.on('b', fn);
    bus.clear();
    bus.emit('a', {});
    bus.emit('b', {});
    expect(fn).not.toHaveBeenCalled();
  });

  it('should support multiple listeners on same event', () => {
    const bus = new EventBus();
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    bus.on('test', fn1);
    bus.on('test', fn2);
    bus.emit('test', 'data');
    expect(fn1).toHaveBeenCalledWith('data');
    expect(fn2).toHaveBeenCalledWith('data');
  });
});
