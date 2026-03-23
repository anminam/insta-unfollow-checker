// ── Skeleton Loader Component ──

import { BaseComponent } from '../core/component.js';

/**
 * Renders skeleton loading placeholders with shimmer animation.
 * Uses CSS classes from styles/animation.css: .skeleton, .skeleton-card, etc.
 */
export class SkeletonLoader extends BaseComponent {
  /**
   * @param {HTMLElement} container
   * @param {{ count?: number, type?: 'card'|'stat'|'chart' }} options
   */
  constructor(container, { count = 8, type = 'card' } = {}) {
    super(container);
    this._count = count;
    this._type = type;
  }

  render() {
    this.container.textContent = '';
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < this._count; i++) {
      const el = document.createElement('div');
      el.className = `skeleton skeleton-${this._type}`;
      if (this._type === 'card') {
        // Card skeleton with avatar + text lines
        const row = document.createElement('div');
        row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px;';
        const avatar = document.createElement('div');
        avatar.className = 'skeleton skeleton-avatar';
        const lines = document.createElement('div');
        lines.style.flex = '1';
        const line1 = document.createElement('div');
        line1.className = 'skeleton skeleton-text';
        const line2 = document.createElement('div');
        line2.className = 'skeleton skeleton-text-short';
        lines.appendChild(line1);
        lines.appendChild(line2);
        row.appendChild(avatar);
        row.appendChild(lines);
        el.appendChild(row);
        el.style.overflow = 'hidden';
      }
      fragment.appendChild(el);
    }

    this.container.appendChild(fragment);
  }
}
