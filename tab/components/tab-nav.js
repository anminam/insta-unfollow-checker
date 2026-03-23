// ── Tab Navigation Component ──

import { BaseComponent } from '../core/component.js';
import { bus } from '../core/event-bus.js';
import { router } from '../core/router.js';
import { t } from '../modules/i18n.js';

const TABS = [
  { id: 'dashboard', icon: '\uD83D\uDCCA', labelKey: 'statsTitle' },
  { id: 'not-following', icon: '\uD83D\uDC94', labelKey: 'notFollowing' },
  { id: 'mutual', icon: '\uD83E\uDD1D', labelKey: 'mutual' },
  { id: 'fan', icon: '\u2B50', labelKey: 'followerOnly' },
  { id: 'following', icon: '\uD83D\uDC64', labelKey: 'following' },
  { id: 'followers', icon: '\uD83D\uDC65', labelKey: 'followers' }
];

/**
 * Bottom tab navigation with count badges.
 */
export class TabNav extends BaseComponent {
  constructor(container) {
    super(container);
    this._buttons = new Map();
    this._counts = {};
  }

  render() {
    this.container.textContent = '';

    const nav = this.createElement('nav', { className: 'tab-nav' });
    nav.style.cssText = 'display:flex;justify-content:space-around;gap:2px;padding:8px 0;';

    for (const tab of TABS) {
      const btn = this.createElement('button', {
        className: 'tab-nav-btn',
        dataset: { tab: tab.id },
        onClick: () => router.navigate(tab.id)
      });

      const iconSpan = this.createElement('span', { className: 'tab-nav-icon' }, tab.icon);
      btn.appendChild(iconSpan);

      const labelSpan = this.createElement('span', { className: 'tab-nav-label' });
      labelSpan.style.cssText = 'font-size:10px;display:block;';
      labelSpan.textContent = t(tab.labelKey);
      btn.appendChild(labelSpan);

      const badge = this.createElement('span', { className: 'tab-nav-badge' });
      badge.style.cssText = 'font-size:9px;font-weight:700;display:none;';
      btn.appendChild(badge);

      btn.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;padding:6px 2px;border:none;background:none;cursor:pointer;border-radius:var(--r-md);color:var(--text-secondary);transition:all var(--t-fast);';

      this._buttons.set(tab.id, { btn, badge });
      nav.appendChild(btn);
    }

    this.container.appendChild(nav);
  }

  onMount() {
    this._highlightActive(router.getCurrentRoute());

    const handler = ({ tab }) => this._highlightActive(tab);
    bus.on('ui:tab-change', handler);
    this._cleanups.push(() => bus.off('ui:tab-change', handler));
  }

  /**
   * Update count badges.
   * @param {{ 'not-following'?: number, mutual?: number, fan?: number, following?: number, followers?: number }} data
   */
  updateCounts(data) {
    this._counts = data;
    for (const [id, count] of Object.entries(data)) {
      const entry = this._buttons.get(id);
      if (!entry) continue;
      if (count > 0) {
        entry.badge.textContent = String(count);
        entry.badge.style.display = 'block';
      } else {
        entry.badge.style.display = 'none';
      }
    }
  }

  /** @private */
  _highlightActive(activeTab) {
    for (const [id, { btn }] of this._buttons) {
      const isActive = id === activeTab;
      btn.style.color = isActive ? 'var(--accent)' : 'var(--text-secondary)';
      btn.style.background = isActive ? 'var(--bg-card)' : 'none';
      btn.style.fontWeight = isActive ? '700' : '400';
    }
  }
}
