// ── Error State Component ──

import { BaseComponent } from '../core/component.js';
import { t } from '../modules/i18n.js';

/**
 * Shows an error message with optional retry button.
 */
export class ErrorState extends BaseComponent {
  /**
   * @param {HTMLElement} container
   * @param {{ message?: string, onRetry?: Function|null }} options
   */
  constructor(container, { message = '', onRetry = null } = {}) {
    super(container);
    this._message = message;
    this._onRetry = onRetry;
  }

  render() {
    this.container.textContent = '';

    const wrapper = this.createElement('div', { className: 'error-state' });
    wrapper.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;padding:40px 20px;text-align:center;';

    const iconEl = this.createElement('div', { className: 'error-state-icon' });
    iconEl.style.cssText = 'font-size:48px;margin-bottom:12px;';
    iconEl.textContent = '\u26A0\uFE0F';
    wrapper.appendChild(iconEl);

    const msgEl = this.createElement('p', { className: 'error-state-message' });
    msgEl.style.color = 'var(--color-danger)';
    msgEl.textContent = this._message || t('error');
    wrapper.appendChild(msgEl);

    if (this._onRetry) {
      const btn = this.createElement('button', {
        className: 'btn btn-primary',
        onClick: this._onRetry
      }, t('retry'));
      btn.style.marginTop = '12px';
      wrapper.appendChild(btn);
    }

    this.container.appendChild(wrapper);
  }
}
