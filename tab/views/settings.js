// ── Settings View ──

import { BaseComponent } from '../core/component.js';
import { store } from '../core/store.js';
import { bus } from '../core/event-bus.js';
import { t } from '../modules/i18n.js';
import { showToast } from '../components/toast.js';
import { exportJSON, importJSON } from '../services/export.js';
import {
  getScheduledInterval, saveScheduledInterval,
  getScheduledDailyLimit, saveScheduledDailyLimit
} from '../storage/preferences.js';
import { getAutoWhitelist, saveAutoWhitelist } from '../storage/whitelist.js';
import { MSG } from '../../shared/message-types.js';

/**
 * Settings view consolidating scattered settings.
 */
export class SettingsView extends BaseComponent {
  constructor(container) {
    super(container);
  }

  render() {
    this.container.textContent = '';

    const title = this.createElement('h3', { className: 'history-title' }, t('settings') || 'Settings');
    this.container.appendChild(title);

    // Sections
    this._renderUnfollowSettings();
    this._renderAutoAnalysis();
    this._renderDataSection();
  }

  /** @private */
  _renderUnfollowSettings() {
    const section = this._createSection(t('scheduledTitle') || 'Scheduled Unfollow');

    // Interval
    const intervalRow = this._createRow(t('unfollowInterval') || 'Interval (min)');
    const intervalInput = this.createElement('input', {
      type: 'number',
      className: 'settings-input',
      value: String(getScheduledInterval())
    });
    intervalInput.min = '1';
    intervalInput.max = '10';
    intervalInput.style.width = '60px';
    this.listen(intervalInput, 'change', () => {
      const val = Math.max(1, Math.min(10, parseInt(intervalInput.value, 10) || 4));
      saveScheduledInterval(val);
      intervalInput.value = String(val);
      showToast(t('saved') || 'Saved', 'success');
    });
    intervalRow.appendChild(intervalInput);
    section.appendChild(intervalRow);

    // Daily limit
    const limitRow = this._createRow(t('dailyLimit') || 'Daily Limit');
    const limitInput = this.createElement('input', {
      type: 'number',
      className: 'settings-input',
      value: String(getScheduledDailyLimit())
    });
    limitInput.min = '1';
    limitInput.max = '200';
    limitInput.style.width = '60px';
    this.listen(limitInput, 'change', () => {
      const val = Math.max(1, Math.min(200, parseInt(limitInput.value, 10) || 50));
      saveScheduledDailyLimit(val);
      limitInput.value = String(val);
      showToast(t('saved') || 'Saved', 'success');
    });
    limitRow.appendChild(limitInput);
    section.appendChild(limitRow);

    this.container.appendChild(section);
  }

  /** @private */
  _renderAutoAnalysis() {
    const section = this._createSection(t('autoAnalysis') || 'Auto Analysis');

    const row = this._createRow(t('autoAnalysisEnable') || 'Enable');
    const toggle = this.createElement('input', { type: 'checkbox', className: 'settings-toggle' });
    row.appendChild(toggle);
    section.appendChild(row);

    // Fetch current status
    chrome.runtime.sendMessage({ action: MSG.GET_AUTO_ANALYSIS_STATUS }).then(res => {
      if (res?.data) toggle.checked = res.data.enabled;
    });

    this.listen(toggle, 'change', () => {
      chrome.runtime.sendMessage({
        action: MSG.SET_AUTO_ANALYSIS,
        data: { enabled: toggle.checked, periodMinutes: 1440 }
      });
      showToast(toggle.checked ? 'Auto analysis enabled' : 'Auto analysis disabled', 'success');
    });

    this.container.appendChild(section);
  }

  /** @private */
  _renderDataSection() {
    const section = this._createSection(t('dataManagement') || 'Data');

    const btnRow = this.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:8px;flex-wrap:wrap;';

    const exportBtn = this.createElement('button', {
      className: 'btn btn-sm',
      onClick: () => exportJSON()
    }, t('exportBackup') || 'Export Backup');
    btnRow.appendChild(exportBtn);

    const importBtn = this.createElement('button', {
      className: 'btn btn-sm',
      onClick: () => this._handleImport()
    }, t('importBackup') || 'Import Backup');
    btnRow.appendChild(importBtn);

    section.appendChild(btnRow);
    this.container.appendChild(section);
  }

  /** @private */
  _handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const result = importJSON(reader.result);
        showToast(result.message, result.success ? 'success' : 'error');
      };
      reader.readAsText(file);
    });
    input.click();
  }

  /** @private */
  _createSection(title) {
    const section = this.createElement('div', { className: 'settings-section' });
    section.style.cssText = 'margin-bottom:20px;padding:16px;background:var(--bg-card);border:1px solid var(--border-card);border-radius:var(--r-lg);';
    const h4 = this.createElement('h4');
    h4.textContent = title;
    h4.style.cssText = 'margin:0 0 12px;font-size:14px;font-weight:700;';
    section.appendChild(h4);
    return section;
  }

  /** @private */
  _createRow(label) {
    const row = this.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 0;';
    const labelEl = this.createElement('span');
    labelEl.textContent = label;
    labelEl.style.cssText = 'font-size:13px;color:var(--text-primary);';
    row.appendChild(labelEl);
    return row;
  }
}
