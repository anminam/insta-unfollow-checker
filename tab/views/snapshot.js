// ── Snapshot View ──

import { BaseComponent } from '../core/component.js';
import { t } from '../modules/i18n.js';
import { escapeHtml, formatDate } from '../modules/ui.js';
import { getSnapshots, deleteSnapshot } from '../storage/snapshot.js';
import { EmptyState } from '../components/empty-state.js';
import { showConfirm } from '../components/modal.js';
import { showToast } from '../components/toast.js';

/**
 * Snapshot comparison view: list snapshots, select 2 for comparison.
 */
export class SnapshotView extends BaseComponent {
  constructor(container) {
    super(container);
    this._selected = new Set();
  }

  render() {
    this.container.textContent = '';

    const headerRow = this.createElement('div', { className: 'snapshot-header-row' });
    const title = this.createElement('h3', { className: 'history-title' }, t('snapshotTitle'));
    headerRow.appendChild(title);

    const compareBtn = this.createElement('button', {
      className: 'btn btn-sm',
      onClick: () => this._compareSelected()
    }, t('compare') || 'Compare');
    compareBtn.style.display = 'none';
    this._compareBtn = compareBtn;
    headerRow.appendChild(compareBtn);

    this.container.appendChild(headerRow);

    const snapshots = getSnapshots();

    if (snapshots.length === 0) {
      const empty = new EmptyState(this.container, {
        icon: '\uD83D\uDCC5',
        message: t('noSnapshots') || 'No analysis snapshots yet'
      });
      empty.mount();
      this._cleanups.push(() => empty.unmount());
      return;
    }

    const list = this.createElement('div', { className: 'snapshot-list' });

    snapshots.forEach((snap, i) => {
      const card = this._createSnapshotCard(snap, i);
      list.appendChild(card);
    });

    this.container.appendChild(list);
  }

  /** @private */
  _createSnapshotCard(snap, index) {
    const card = this.createElement('div', { className: 'snapshot-card' });

    const header = this.createElement('div', { className: 'snapshot-header' });
    const dateEl = this.createElement('span', { className: 'snapshot-date' });
    dateEl.textContent = formatDate(snap.date);
    header.appendChild(dateEl);

    const actions = this.createElement('div', { className: 'snapshot-actions' });

    const checkbox = this.createElement('input', {
      type: 'checkbox',
      className: 'snapshot-compare-check'
    });
    this.listen(checkbox, 'change', () => {
      if (checkbox.checked) {
        this._selected.add(index);
      } else {
        this._selected.delete(index);
      }
      this._updateCompareBtn();
      card.classList.toggle('selected-compare', checkbox.checked);
    });
    actions.appendChild(checkbox);

    const deleteBtn = this.createElement('button', {
      className: 'snapshot-delete',
      onClick: () => this._deleteSnapshot(index)
    });
    deleteBtn.textContent = '\u2715';
    actions.appendChild(deleteBtn);

    header.appendChild(actions);
    card.appendChild(header);

    // Stats row
    const stats = this.createElement('div', { className: 'snapshot-stats' });

    const statItems = [
      [t('following'), snap.following],
      [t('followers'), snap.followers],
      [t('notFollowing'), snap.notFollowingBack]
    ];

    for (const [label, value] of statItems) {
      const stat = this.createElement('div', { className: 'snapshot-stat' });
      const labelEl = this.createElement('span', { className: 'snapshot-stat-label' }, label + ': ');
      const valueEl = this.createElement('span', { className: 'snapshot-stat-value' }, String(value));
      stat.appendChild(labelEl);
      stat.appendChild(valueEl);
      stats.appendChild(stat);
    }

    card.appendChild(stats);
    return card;
  }

  /** @private */
  _updateCompareBtn() {
    if (this._compareBtn) {
      this._compareBtn.style.display = this._selected.size === 2 ? 'inline-block' : 'none';
    }
  }

  /** @private */
  _compareSelected() {
    const indices = [...this._selected].sort((a, b) => a - b);
    if (indices.length !== 2) return;
    const snapshots = getSnapshots();
    const [a, b] = [snapshots[indices[0]], snapshots[indices[1]]];
    if (!a || !b) return;

    // Emit comparison event for external handling
    const detail = {
      newer: indices[0] < indices[1] ? a : b,
      older: indices[0] < indices[1] ? b : a
    };
    showToast(`Comparing ${formatDate(detail.older.date)} vs ${formatDate(detail.newer.date)}`);
  }

  /** @private */
  async _deleteSnapshot(index) {
    const confirmed = await showConfirm(t('confirmDelete') || 'Delete this snapshot?');
    if (!confirmed) return;
    deleteSnapshot(index);
    this._selected.clear();
    this.render();
  }
}
