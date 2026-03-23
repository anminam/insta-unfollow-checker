// ── Empty State Component ──

import { BaseComponent } from '../core/component.js';

/**
 * Shows an icon + message + optional action button when content is empty.
 */
export class EmptyState extends BaseComponent {
  /**
   * @param {HTMLElement} container
   * @param {{ icon?: string, message?: string, actionLabel?: string, onAction?: Function|null }} options
   */
  constructor(container, { icon = '', message = '', actionLabel = '', onAction = null } = {}) {
    super(container);
    this._icon = icon;
    this._message = message;
    this._actionLabel = actionLabel;
    this._onAction = onAction;
  }

  render() {
    this.container.textContent = '';

    const wrapper = this.createElement('div', { className: 'empty-state' });

    if (this._icon) {
      const iconEl = this.createElement('div', { className: 'empty-state-icon' }, this._icon);
      iconEl.style.fontSize = '48px';
      iconEl.style.marginBottom = '12px';
      wrapper.appendChild(iconEl);
    }

    if (this._message) {
      const msgEl = this.createElement('p', { className: 'empty-state-message' }, this._message);
      msgEl.style.color = 'var(--text-secondary)';
      msgEl.style.textAlign = 'center';
      wrapper.appendChild(msgEl);
    }

    if (this._actionLabel && this._onAction) {
      const btn = this.createElement('button', {
        className: 'btn btn-primary',
        onClick: this._onAction
      }, this._actionLabel);
      btn.style.marginTop = '12px';
      wrapper.appendChild(btn);
    }

    wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;';
    this.container.appendChild(wrapper);
  }
}
