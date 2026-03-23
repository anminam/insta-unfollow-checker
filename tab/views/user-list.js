// ── User List View ──

import { BaseComponent } from '../core/component.js';
import { store } from '../core/store.js';
import { bus } from '../core/event-bus.js';
import { t } from '../modules/i18n.js';
import { FilterBar } from '../components/filter-bar.js';
import { SkeletonLoader } from '../components/skeleton.js';
import { EmptyState } from '../components/empty-state.js';
import { ErrorState } from '../components/error-state.js';
import { createUserCard } from '../components/user-card.js';
import { startAnalysis } from '../services/analysis.js';
import { getWhitelist } from '../storage/whitelist.js';
import { getMemos } from '../storage/memo.js';
import { getFirstSeen } from '../storage/preferences.js';
import { getFilteredUsers } from '../modules/filter.js';

/**
 * User list view with filter bar.
 */
export class UserListView extends BaseComponent {
  /**
   * @param {HTMLElement} container
   * @param {{ tabName?: string }} options
   */
  constructor(container, { tabName = 'not-following' } = {}) {
    super(container);
    this._tabName = tabName;
    this._filterBar = null;
    this._listEl = null;
    this._children = [];
  }

  render() {
    this.container.textContent = '';

    // Filter bar container
    const filterContainer = document.createElement('div');
    this.container.appendChild(filterContainer);
    this._filterBar = new FilterBar(filterContainer);
    this._children.push(this._filterBar);

    // Controls (select all, batch unfollow)
    if (this._showUnfollowControls()) {
      const controls = this._renderControls();
      this.container.appendChild(controls);
    }

    // List container
    this._listEl = this.createElement('div', { className: 'user-list' });
    this._listEl.style.cssText = 'overflow-y:auto;max-height:60vh;';
    this.container.appendChild(this._listEl);

    this._renderList();
  }

  onMount() {
    for (const child of this._children) {
      if (!child._mounted) child.mount();
    }

    this.subscribe(['analysisData', 'analysisStatus'], () => {
      this._renderList();
    });

    const filterHandler = () => this._renderList();
    bus.on('ui:filter-change', filterHandler);
    this._cleanups.push(() => bus.off('ui:filter-change', filterHandler));

    // Delegate click events on list
    this.listen(this._listEl, 'click', (e) => this._handleListClick(e));
  }

  onUnmount() {
    for (const child of this._children) {
      if (child._mounted) child.unmount();
    }
    this._children = [];
  }

  /** @private */
  _showUnfollowControls() {
    return this._tabName === 'not-following';
  }

  /** @private */
  _renderControls() {
    const controls = this.createElement('div', { className: 'list-controls' });
    controls.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;align-items:center;flex-wrap:wrap;';
    const btnDefs = [
      ['btn btn-sm', () => this._toggleSelectAll(), t('selectAll')],
      ['btn btn-danger btn-sm', () => bus.emit('unfollow:batch-request'), t('unfollowSelected')],
      ['btn btn-sm', () => bus.emit('unfollow:schedule-request'), t('scheduledUnfollow')]
    ];
    for (const [cls, handler, label] of btnDefs) {
      controls.appendChild(this.createElement('button', { className: cls, onClick: handler }, label));
    }
    this._countSpan = this.createElement('span', { className: 'list-count' });
    this._countSpan.style.cssText = 'margin-left:auto;font-size:12px;color:var(--text-secondary);';
    controls.appendChild(this._countSpan);
    return controls;
  }

  /** @private */
  _renderList() {
    if (!this._listEl) return;

    const status = store.get('analysisStatus');
    const data = store.get('analysisData');

    if (status === 'analyzing') {
      this._listEl.textContent = '';
      const skeleton = new SkeletonLoader(this._listEl, { count: 8 });
      skeleton.mount();
      return;
    }

    if (status === 'error') {
      this._listEl.textContent = '';
      const err = store.get('error');
      const errState = new ErrorState(this._listEl, {
        message: err?.message || t('error'),
        onRetry: () => startAnalysis()
      });
      errState.mount();
      return;
    }

    if (!data) {
      this._listEl.textContent = '';
      const empty = new EmptyState(this._listEl, {
        icon: '\uD83D\uDD0D',
        message: t('startAnalysis'),
        actionLabel: t('startAnalysis'),
        onAction: () => startAnalysis()
      });
      empty.mount();
      return;
    }

    const filters = store.get('filters');
    const users = getFilteredUsers({
      analysisData: data,
      currentTab: this._tabName,
      searchQuery: filters.search,
      filterVerified: filters.verified,
      filterGhost: filters.ghost,
      filterTag: filters.tag,
      sortValue: filters.sort,
      whitelistSet: getWhitelist(),
      firstSeen: getFirstSeen(),
      memos: getMemos()
    });

    if (this._countSpan) this._countSpan.textContent = String(users.length);
    this._listEl.textContent = '';
    this._listEl.onscroll = null;
    if (users.length === 0) {
      const p = document.createElement('p');
      p.style.cssText = 'text-align:center;color:var(--text-secondary);padding:20px;';
      p.textContent = t('emptyList');
      this._listEl.appendChild(p);
      return;
    }
    const selectedIds = store.get('selectedIds');
    const showControls = this._showUnfollowControls();
    const fragment = document.createDocumentFragment();
    users.forEach((user, i) => {
      fragment.appendChild(createUserCard(user, showControls, i, selectedIds, users.length));
    });
    this._listEl.appendChild(fragment);
  }

  /** @private */
  _toggleSelectAll() {
    const data = store.get('analysisData');
    if (!data) return;
    const users = data.notFollowingBack || [];
    const isFull = store.get('selectedIds').size >= users.length;
    store.setState({ selectedIds: isFull ? new Set() : new Set(users.map(u => u.id)) });
    this._renderList();
  }

  /** @private */
  _handleListClick(e) {
    const btn = e.target.closest('button');
    if (!btn) return;
    const { userId, username } = btn.dataset;
    if (btn.classList.contains('btn-unfollow') && userId) bus.emit('unfollow:single-request', { userId, username });
    else if (btn.classList.contains('btn-whitelist') && userId) bus.emit('whitelist:toggle', { userId });
    else if (btn.classList.contains('btn-memo') && userId) bus.emit('memo:open', { userId, username });
  }
}
