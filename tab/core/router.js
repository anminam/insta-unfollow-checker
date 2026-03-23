// ── Router (hash-based view routing) ──

import { bus } from './event-bus.js';

class Router {
  /** @type {Map<string, () => import('./component.js').BaseComponent>} */
  #routes = new Map();
  /** @type {import('./component.js').BaseComponent|null} */
  #currentView = null;
  /** @type {HTMLElement|null} */
  #container = null;
  /** @type {string} */
  #defaultRoute = 'dashboard';

  /**
   * Initialize router with container element.
   * @param {HTMLElement} container
   * @param {string} [defaultRoute='dashboard']
   */
  init(container, defaultRoute = 'dashboard') {
    this.#container = container;
    this.#defaultRoute = defaultRoute;
    window.addEventListener('hashchange', () => this.#handleRoute());
    // Initial route
    this.#handleRoute();
  }

  /**
   * Register a route.
   * @param {string} name - route name (without #)
   * @param {() => import('./component.js').BaseComponent} factory - returns new view instance
   */
  register(name, factory) {
    this.#routes.set(name, factory);
  }

  /**
   * Navigate to a route.
   * @param {string} name
   */
  navigate(name) {
    if (window.location.hash === '#' + name) {
      // Force re-route even if same hash
      this.#handleRoute();
    } else {
      window.location.hash = name;
    }
  }

  /** @returns {string} current route name */
  getCurrentRoute() {
    return window.location.hash.slice(1) || this.#defaultRoute;
  }

  /** @private */
  #handleRoute() {
    const name = this.getCurrentRoute();
    const factory = this.#routes.get(name);
    if (!factory) {
      // Fallback to default route
      if (name !== this.#defaultRoute && this.#routes.has(this.#defaultRoute)) {
        window.location.hash = this.#defaultRoute;
      }
      return;
    }

    // Unmount previous view
    if (this.#currentView) {
      this.#currentView.unmount();
      this.#currentView = null;
    }

    // Mount new view
    this.#currentView = factory();
    this.#currentView.mount();
    bus.emit('ui:tab-change', { tab: name });
  }
}

export const router = new Router();
