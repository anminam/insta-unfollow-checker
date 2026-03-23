// ── Stat Card Component ──

import { BaseComponent } from '../core/component.js';

/**
 * Renders a single stat card with value, label, and delta indicator.
 * Uses CSS classes: .stat, .stat-value, .stat-label, .stat-delta
 */
export class StatCard extends BaseComponent {
  /**
   * @param {HTMLElement} container
   * @param {{ label?: string, value?: number, delta?: number|null, color?: string, extraClass?: string }} options
   */
  constructor(container, { label = '', value = 0, delta = null, color = '', extraClass = '' } = {}) {
    super(container);
    this._label = label;
    this._value = value;
    this._delta = delta;
    this._color = color;
    this._extraClass = extraClass;
    this._el = null;
  }

  render() {
    this.container.textContent = '';

    const cls = ['stat', this._extraClass].filter(Boolean).join(' ');
    this._el = this.createElement('div', { className: cls });

    const valueEl = this.createElement('span', { className: 'stat-value' }, String(this._value));
    if (this._color) valueEl.style.color = this._color;
    this._el.appendChild(valueEl);

    const labelEl = this.createElement('span', { className: 'stat-label' }, this._label);
    this._el.appendChild(labelEl);

    const deltaEl = this.createElement('span', { className: 'stat-delta' });
    this._updateDelta(deltaEl, this._delta);
    this._el.appendChild(deltaEl);

    this.container.appendChild(this._el);
  }

  /**
   * Update value and delta without full re-render.
   * @param {{ value?: number, delta?: number|null }} data
   */
  update({ value, delta }) {
    if (!this._el) return;
    if (value !== undefined) {
      const valueEl = this._el.querySelector('.stat-value');
      if (valueEl) valueEl.textContent = String(value);
    }
    if (delta !== undefined) {
      const deltaEl = this._el.querySelector('.stat-delta');
      if (deltaEl) this._updateDelta(deltaEl, delta);
    }
  }

  /** @private */
  _updateDelta(el, delta) {
    if (delta === null || delta === undefined || delta === 0) {
      el.textContent = '';
      el.className = 'stat-delta';
    } else if (delta > 0) {
      el.textContent = `\u25B2 ${delta}`;
      el.className = 'stat-delta up';
    } else {
      el.textContent = `\u25BC ${Math.abs(delta)}`;
      el.className = 'stat-delta down';
    }
  }
}
