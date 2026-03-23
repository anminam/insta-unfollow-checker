// ── Export / Import Service ──

import { t } from '../modules/i18n.js';
import { getUserMemo, getMemos, saveMemos } from '../storage/memo.js';
import { getUnfollowHistory, saveUnfollowHistory } from '../storage/history.js';
import { getWhitelist, saveWhitelist } from '../storage/whitelist.js';
import { getScheduledQueue, saveScheduledQueue } from '../storage/preferences.js';
import { validateBackupData } from '../storage/tier.js';
import { logger } from '../core/logger.js';

/**
 * Export user list to CSV file.
 * @param {Array<{ id: string, username: string, full_name: string, is_verified: boolean }>} users
 * @param {string} filename
 */
export function exportCSV(users, filename) {
  const BOM = '\uFEFF';
  const headers = ['username', 'full_name', 'verified', 'memo', 'tags'];
  const rows = users.map(u => {
    const memo = getUserMemo(u.id);
    return [
      u.username,
      u.full_name || '',
      u.is_verified ? 'Y' : 'N',
      memo?.text || '',
      (memo?.tags || []).join(';')
    ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',');
  });

  const csv = BOM + [headers.join(','), ...rows].join('\n');
  _downloadFile(csv, filename || 'insta-unfollow.csv', 'text/csv;charset=utf-8');
  logger.info('export', `CSV exported: ${users.length} users`);
}

/**
 * Export full backup as JSON.
 */
export function exportJSON() {
  const data = {
    version: 1,
    exportDate: new Date().toISOString(),
    unfollowHistory: getUnfollowHistory(),
    memos: getMemos(),
    whitelist: [...getWhitelist()],
    scheduledQueue: getScheduledQueue()
  };

  const json = JSON.stringify(data, null, 2);
  const dateStr = new Date().toISOString().slice(0, 10);
  _downloadFile(json, `insta-backup-${dateStr}.json`, 'application/json');
  logger.info('export', 'JSON backup exported');
}

/**
 * Import backup from JSON string.
 * @param {string} jsonString
 * @returns {{ success: boolean, message: string }}
 */
export function importJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);

    if (!validateBackupData(data)) {
      return { success: false, message: t('importInvalid') || 'Invalid backup data' };
    }

    if (data.unfollowHistory) {
      saveUnfollowHistory(data.unfollowHistory);
    }
    if (data.memos) {
      saveMemos(data.memos);
    }
    if (data.whitelist) {
      saveWhitelist(new Set(data.whitelist));
    }
    if (data.scheduledQueue) {
      saveScheduledQueue(data.scheduledQueue);
    }

    logger.info('export', 'JSON backup imported');
    return { success: true, message: t('importSuccess') || 'Backup restored' };
  } catch (err) {
    logger.error('export', 'Import failed', err.message);
    return { success: false, message: err.message };
  }
}

/** @private */
function _downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
