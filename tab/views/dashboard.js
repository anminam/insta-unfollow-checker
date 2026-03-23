// ── Dashboard View ──

import { BaseComponent } from '../core/component.js';
import { store } from '../core/store.js';
import { bus } from '../core/event-bus.js';
import { t } from '../modules/i18n.js';
import { StatCard } from '../components/stat-card.js';
import { SkeletonLoader } from '../components/skeleton.js';
import { EmptyState } from '../components/empty-state.js';
import { startAnalysis } from '../services/analysis.js';
import { getSnapshots } from '../storage/snapshot.js';

/**
 * Dashboard view: stat cards, chart area, quick actions.
 */
export class DashboardView extends BaseComponent {
  constructor(container) {
    super(container);
    this._statCards = [];
    this._children = [];
  }

  render() {
    this.container.textContent = '';
    const data = store.get('analysisData');
    const status = store.get('analysisStatus');

    if (status === 'analyzing') {
      this._showSkeleton();
      return;
    }

    if (!data) {
      this._showEmpty();
      return;
    }

    this._renderDashboard(data);
  }

  onMount() {
    this.subscribe(['analysisStatus', 'analysisData'], () => {
      this._unmountChildren();
      this.render();
      this._mountChildren();
    });

    this._mountChildren();
  }

  onUnmount() {
    this._unmountChildren();
  }

  /** @private */
  _showSkeleton() {
    const skeleton = new SkeletonLoader(this.container, { count: 4, type: 'stat' });
    this._children.push(skeleton);
    skeleton.mount();
  }

  /** @private */
  _showEmpty() {
    const empty = new EmptyState(this.container, {
      icon: '\uD83D\uDD0D',
      message: t('startAnalysis'),
      actionLabel: t('startAnalysis'),
      onAction: () => startAnalysis()
    });
    this._children.push(empty);
    empty.mount();
  }

  /** @private */
  _renderDashboard(data) {
    // Stats grid
    const grid = this.createElement('div', { className: 'stats-grid' });
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fit,minmax(100px,1fr));gap:10px;margin-bottom:16px;';
    this.container.appendChild(grid);

    const deltas = this._calcDeltas(data);

    const stats = [
      { label: t('following'), value: data.totalFollowing, delta: deltas.following, color: '' },
      { label: t('followers'), value: data.totalFollowers, delta: deltas.followers, color: '' },
      { label: t('notFollowing'), value: data.notFollowingBack?.length || 0, delta: deltas.notFollowing, color: 'var(--color-danger)', extraClass: 'stat-highlight' },
      { label: t('mutual'), value: data.mutual?.length || 0, delta: deltas.mutual, color: 'var(--color-mutual)', extraClass: 'stat-mutual' },
      { label: t('followerOnly'), value: data.followerOnly?.length || 0, delta: null, color: 'var(--color-fan)', extraClass: 'stat-fan' }
    ];

    for (const s of stats) {
      const cell = document.createElement('div');
      grid.appendChild(cell);
      const card = new StatCard(cell, s);
      this._children.push(card);
      this._statCards.push(card);
    }

    // Ratio card
    const ratioVal = data.totalFollowers > 0
      ? (data.totalFollowing / data.totalFollowers).toFixed(2)
      : '-';
    const ratioCell = document.createElement('div');
    grid.appendChild(ratioCell);
    const ratioClass = this._ratioClass(data.totalFollowing, data.totalFollowers);
    const ratioCard = new StatCard(ratioCell, {
      label: t('ratio') || 'Ratio',
      value: 0,
      extraClass: 'stat-ratio'
    });
    this._children.push(ratioCard);

    // Chart placeholder
    const chartWrapper = this.createElement('div', { className: 'stats-chart-wrapper' });
    chartWrapper.id = 'new-chart-area';
    this.container.appendChild(chartWrapper);

    // Quick actions
    const actions = this.createElement('div', { className: 'dashboard-actions' });
    actions.style.cssText = 'display:flex;gap:8px;margin-top:16px;flex-wrap:wrap;';

    const analyzeBtn = this.createElement('button', {
      className: 'btn btn-primary',
      onClick: () => startAnalysis()
    }, t('startAnalysis'));
    actions.appendChild(analyzeBtn);

    this.container.appendChild(actions);
  }

  /** @private */
  _calcDeltas(data) {
    const snapshots = getSnapshots();
    if (snapshots.length < 2) {
      return { following: null, followers: null, notFollowing: null, mutual: null };
    }
    const prev = snapshots[1];
    return {
      following: data.totalFollowing - prev.following,
      followers: data.totalFollowers - prev.followers,
      notFollowing: (data.notFollowingBack?.length || 0) - prev.notFollowingBack,
      mutual: null
    };
  }

  /** @private */
  _ratioClass(following, followers) {
    if (followers === 0) return '';
    const ratio = following / followers;
    if (ratio <= 1.2) return 'ratio-good';
    if (ratio <= 2.0) return 'ratio-warning';
    return 'ratio-bad';
  }

  /** @private */
  _mountChildren() {
    for (const child of this._children) {
      if (!child._mounted) child.mount();
    }
  }

  /** @private */
  _unmountChildren() {
    for (const child of this._children) {
      if (child._mounted) child.unmount();
    }
    this._children = [];
    this._statCards = [];
  }
}
