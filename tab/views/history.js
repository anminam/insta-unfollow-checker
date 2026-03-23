// ── History View ──

import { BaseComponent } from '../core/component.js';
import { bus } from '../core/event-bus.js';
import { t } from '../modules/i18n.js';
import { escapeHtml, formatDate } from '../modules/ui.js';
import { getUnfollowHistory, removeUnfollowRecord } from '../storage/history.js';
import { EmptyState } from '../components/empty-state.js';
import { showConfirm } from '../components/modal.js';
import { showToast } from '../components/toast.js';
import { MSG } from '../../shared/message-types.js';

/**
 * Unfollow history view with refollow and delete actions.
 */
export class HistoryView extends BaseComponent {
  constructor(container) {
    super(container);
  }

  render() {
    this.container.textContent = '';

    const history = getUnfollowHistory();
    const entries = Object.entries(history).sort(
      (a, b) => new Date(b[1].date) - new Date(a[1].date)
    );

    // Title
    const title = this.createElement('h3', { className: 'history-title' }, t('historyTitle'));
    this.container.appendChild(title);

    if (entries.length === 0) {
      const empty = new EmptyState(this.container, {
        icon: '\uD83D\uDCCB',
        message: t('noHistory') || 'No unfollow history yet'
      });
      empty.mount();
      this._cleanups.push(() => empty.unmount());
      return;
    }

    const list = this.createElement('div', { className: 'history-list' });
    list.style.cssText = 'display:flex;flex-direction:column;gap:6px;max-height:60vh;overflow-y:auto;';

    for (const [userId, entry] of entries) {
      const card = this._createHistoryCard(userId, entry);
      list.appendChild(card);
    }

    this.container.appendChild(list);
  }

  /** @private */
  _createHistoryCard(userId, entry) {
    const card = this.createElement('div', { className: 'history-card' });
    card.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg-card);border:1px solid var(--border-card);border-radius:var(--r-md);';

    const info = this.createElement('div');
    info.style.flex = '1';

    const link = this.createElement('a');
    link.href = `https://www.instagram.com/${encodeURIComponent(entry.username)}/`;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = `@${entry.username}`;
    link.style.cssText = 'font-weight:600;color:var(--text-link);text-decoration:none;';

    const date = this.createElement('span');
    date.style.cssText = 'font-size:11px;color:var(--text-secondary);margin-left:8px;';
    date.textContent = formatDate(entry.date);

    info.appendChild(link);
    info.appendChild(date);

    const actions = this.createElement('div');
    actions.style.cssText = 'display:flex;gap:6px;';

    const refollowBtn = this.createElement('button', {
      className: 'btn btn-sm',
      onClick: () => this._refollow(userId, entry.username)
    }, t('refollow') || 'Refollow');

    const deleteBtn = this.createElement('button', {
      className: 'btn btn-sm btn-danger',
      onClick: () => this._deleteRecord(userId)
    }, '\u2715');

    actions.appendChild(refollowBtn);
    actions.appendChild(deleteBtn);

    card.appendChild(info);
    card.appendChild(actions);
    return card;
  }

  /** @private */
  async _refollow(userId, username) {
    try {
      const response = await chrome.runtime.sendMessage({
        action: MSG.FOLLOW_USER,
        data: { userId }
      });
      if (response.success) {
        removeUnfollowRecord(userId);
        showToast(`@${username} refollowed`, 'success');
        this.render();
      }
    } catch {
      showToast(t('error'), 'error');
    }
  }

  /** @private */
  async _deleteRecord(userId) {
    const confirmed = await showConfirm(t('confirmDelete') || 'Delete this record?');
    if (!confirmed) return;
    removeUnfollowRecord(userId);
    this.render();
  }
}
