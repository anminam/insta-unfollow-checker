// ── BaseComponent (UI component lifecycle) ──

import { store } from './store.js';

/**
 * Base class for all reusable UI components.
 * Provides mount/unmount lifecycle and auto store subscription cleanup.
 */
export class BaseComponent {
  /**
   * @param {HTMLElement} container - DOM element to render into
   */
  constructor(container) {
    /** @type {HTMLElement} */
    this.container = container;
    /** @type {boolean} */
    this._mounted = false;
    /** @type {string[]} store subscription IDs */
    this._subscriptions = [];
    /** @type {Array<() => void>} cleanup functions */
    this._cleanups = [];
  }

  /**
   * Subscribe to store keys. Auto-unsubscribed on unmount.
   * @param {string[]} keys
   * @param {Function} callback
   * @returns {string} subscription ID
   */
  subscribe(keys, callback) {
    const id = store.subscribe(keys, callback);
    this._subscriptions.push(id);
    return id;
  }

  /**
   * Add an event listener that auto-removes on unmount.
   * @param {EventTarget} target
   * @param {string} event
   * @param {Function} handler
   * @param {Object} [options]
   */
  listen(target, event, handler, options) {
    target.addEventListener(event, handler, options);
    this._cleanups.push(() => target.removeEventListener(event, handler, options));
  }

  /** Mount component into container */
  mount() {
    if (this._mounted) return;
    this._mounted = true;
    this.render();
    this.onMount();
  }

  /** Unmount component, cleanup subscriptions and listeners */
  unmount() {
    if (!this._mounted) return;
    this._mounted = false;
    this.onUnmount();
    this._subscriptions.forEach(id => store.unsubscribe(id));
    this._subscriptions = [];
    this._cleanups.forEach(fn => fn());
    this._cleanups = [];
    this.container.textContent = '';
  }

  /**
   * Render component DOM. Must be implemented by subclass.
   * @abstract
   */
  render() {
    throw new Error('render() must be implemented');
  }

  /** Called after mount. Override for event binding etc. */
  onMount() {}

  /** Called before cleanup. Override for teardown logic. */
  onUnmount() {}

  /**
   * Helper: create element with attributes and children.
   * @param {string} tag
   * @param {Object} [attrs]
   * @param {...(string|Node)} children
   * @returns {HTMLElement}
   */
  createElement(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'className') {
        el.className = value;
      } else if (key === 'dataset') {
        Object.assign(el.dataset, value);
      } else if (key.startsWith('on') && typeof value === 'function') {
        const event = key.slice(2).toLowerCase();
        this.listen(el, event, value);
      } else {
        el.setAttribute(key, value);
      }
    }
    for (const child of children) {
      if (typeof child === 'string') {
        el.appendChild(document.createTextNode(child));
      } else if (child instanceof Node) {
        el.appendChild(child);
      }
    }
    return el;
  }
}
