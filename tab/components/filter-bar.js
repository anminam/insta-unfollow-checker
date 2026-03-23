// ── Filter Bar Component ──

import { BaseComponent } from '../core/component.js';
import { store } from '../core/store.js';
import { bus } from '../core/event-bus.js';
import { t } from '../modules/i18n.js';

/**
 * Search input + filter buttons + sort select.
 * Emits 'ui:filter-change' on any change.
 */
export class FilterBar extends BaseComponent {
  constructor(container) {
    super(container);
    this._searchInput = null;
    this._sortSelect = null;
  }

  render() {
    this.container.textContent = '';

    const wrapper = this.createElement('div', { className: 'filter-bar' });
    wrapper.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin-bottom:12px;';

    // Search input
    this._searchInput = this.createElement('input', {
      type: 'text',
      className: 'search-input',
      placeholder: t('searchPlaceholder')
    });
    this._searchInput.style.flex = '1';
    this._searchInput.style.minWidth = '140px';
    wrapper.appendChild(this._searchInput);

    // Verified filter button
    const verifiedBtn = this.createElement('button', {
      className: 'btn btn-filter btn-verified-filter'
    }, t('verified'));
    wrapper.appendChild(verifiedBtn);

    // Ghost filter button
    const ghostBtn = this.createElement('button', {
      className: 'btn btn-filter btn-ghost-filter'
    }, t('ghost') || 'Ghost');
    wrapper.appendChild(ghostBtn);

    // Sort select
    this._sortSelect = this.createElement('select', { className: 'sort-select' });
    const sortOptions = [
      ['default', t('sortDefault')],
      ['name', t('sortName')],
      ['verified', t('sortVerified')],
      ['oldest', t('sortOldest')]
    ];
    for (const [val, label] of sortOptions) {
      const opt = this.createElement('option', { value: val }, label);
      this._sortSelect.appendChild(opt);
    }
    wrapper.appendChild(this._sortSelect);

    this.container.appendChild(wrapper);
  }

  onMount() {
    const filters = store.get('filters');
    if (this._searchInput) this._searchInput.value = filters.search || '';
    if (this._sortSelect) this._sortSelect.value = filters.sort || 'default';

    this.listen(this._searchInput, 'input', () => {
      const current = store.get('filters');
      store.setState({ filters: { ...current, search: this._searchInput.value } });
      bus.emit('ui:filter-change', store.get('filters'));
    });

    this.listen(this._sortSelect, 'change', () => {
      const current = store.get('filters');
      store.setState({ filters: { ...current, sort: this._sortSelect.value } });
      bus.emit('ui:filter-change', store.get('filters'));
    });

    const toggleFilter = (key) => {
      const current = store.get('filters');
      store.setState({ filters: { ...current, [key]: !current[key] } });
      bus.emit('ui:filter-change', store.get('filters'));
    };

    const btns = this.container.querySelectorAll('.btn-filter');
    this.listen(btns[0], 'click', () => toggleFilter('verified'));
    this.listen(btns[1], 'click', () => toggleFilter('ghost'));

    this.subscribe(['filters'], () => {
      const f = store.get('filters');
      btns[0].classList.toggle('active', !!f.verified);
      btns[1].classList.toggle('active', !!f.ghost);
    });
  }
}
