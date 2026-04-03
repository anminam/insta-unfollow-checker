// ── Change Entry Module ──
// Shared UI component for follower change lists (dashboard + snapshot history)

import { t } from './i18n.js';
import { getWhitelist, toggleWhitelist } from '../storage/whitelist.js';
import { showToast } from './ui.js';

/**
 * Create a user entry with hover popup actions (built lazily on first hover)
 * @param {string} username
 * @param {string|null} userId
 * @param {object} opts - { isLost, tabWhitelistCount, resolveUserId }
 *   resolveUserId: (username) => string|null — called on hover to resolve userId dynamically
 */
export function createUserEntry(username, userId, opts = {}) {
  const { isLost = false, tabWhitelistCount = null, resolveUserId = null } = opts;
  const entry = document.createElement('span');
  entry.className = 'change-entry';
  const a = document.createElement('a');
  a.href = `https://www.instagram.com/${encodeURIComponent(username)}/`;
  a.target = '_blank'; a.rel = 'noopener'; a.textContent = `@${username}`;
  entry.appendChild(a);

  let popupBuilt = false;

  entry.addEventListener('mouseenter', () => {
    if (popupBuilt) return;
    popupBuilt = true;

    // Resolve userId lazily if not provided
    const resolvedId = userId || resolveUserId?.(username) || null;

    const popup = document.createElement('div');
    popup.className = 'change-popup';

    // Protect button (requires resolvedId)
    if (resolvedId) {
      const protectBtn = document.createElement('button');
      protectBtn.className = 'change-popup-btn';
      protectBtn.textContent = getWhitelist().has(resolvedId) ? t('protected') : t('protect');
      protectBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleWhitelist(resolvedId);
        const isNow = getWhitelist().has(resolvedId);
        protectBtn.textContent = isNow ? t('protected') : t('protect');
        showToast(isNow ? t('protectedUser', username) : t('unprotectedUser', username));
        if (tabWhitelistCount) tabWhitelistCount.textContent = getWhitelist().size;
      });
      popup.appendChild(protectBtn);
    }

    // Follow button (for lost followers, requires resolvedId)
    if (isLost && resolvedId) {
      const followBtn = document.createElement('button');
      followBtn.className = 'change-popup-btn change-popup-btn-accent';
      followBtn.textContent = t('refollow');
      followBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
          const res = await chrome.runtime.sendMessage({ action: 'FOLLOW_USER', data: { userId: resolvedId } });
          if (res.success) { followBtn.textContent = t('done'); followBtn.disabled = true; showToast(t('toastRefollowed', username), 'success'); }
          else { showToast(t('FOLLOW_FAILED'), 'error'); }
        } catch { showToast(t('FOLLOW_FAILED'), 'error'); }
      });
      popup.appendChild(followBtn);
    }

    // Profile button (always available, as fallback)
    const profileBtn = document.createElement('a');
    profileBtn.className = 'change-popup-btn';
    profileBtn.href = `https://www.instagram.com/${encodeURIComponent(username)}/`;
    profileBtn.target = '_blank'; profileBtn.rel = 'noopener';
    profileBtn.textContent = t('viewProfile');
    popup.appendChild(profileBtn);

    entry.appendChild(popup);
  });

  return entry;
}

/**
 * Build a changes section (gained / lost / renamed) as DOM
 */
export function buildChangesDOM({ gained = [], lost = [], renamed = [], tabWhitelistCount = null, resolveUserId = null }) {
  if (gained.length === 0 && lost.length === 0 && renamed.length === 0) return null;

  const details = document.createElement('details');
  details.className = 'snapshot-changes';
  const summary = document.createElement('summary');
  summary.textContent = t('followerChanges');
  details.appendChild(summary);

  if (lost.length > 0) {
    const label = document.createElement('div');
    label.className = 'change-lost';
    label.textContent = t('lostFollowers', lost.length);
    details.appendChild(label);
    const list = document.createElement('div');
    list.className = 'changes-list';
    lost.forEach(u => list.appendChild(createUserEntry(u.username, u.userId, { isLost: true, tabWhitelistCount, resolveUserId })));
    details.appendChild(list);
  }

  if (gained.length > 0) {
    const label = document.createElement('div');
    label.className = 'change-gained';
    label.textContent = t('newFollowers', gained.length);
    details.appendChild(label);
    const list = document.createElement('div');
    list.className = 'changes-list';
    gained.forEach(u => list.appendChild(createUserEntry(u.username, u.userId, { tabWhitelistCount, resolveUserId })));
    details.appendChild(list);
  }

  if (renamed.length > 0) {
    const label = document.createElement('div');
    label.className = 'change-renamed';
    label.textContent = t('renamedFollowers', renamed.length);
    details.appendChild(label);
    const list = document.createElement('div');
    list.className = 'changes-list';
    renamed.forEach(u => {
      const entry = document.createElement('span');
      entry.className = 'change-entry';
      const oldSpan = document.createElement('span');
      oldSpan.className = 'renamed-old';
      oldSpan.textContent = `@${u.oldUsername}`;
      const arrow = document.createTextNode(' \u2192 ');
      const a = document.createElement('a');
      a.href = `https://www.instagram.com/${encodeURIComponent(u.newUsername)}/`;
      a.target = '_blank'; a.rel = 'noopener'; a.textContent = `@${u.newUsername}`;
      entry.appendChild(oldSpan); entry.appendChild(arrow); entry.appendChild(a);
      list.appendChild(entry);
    });
    details.appendChild(list);
  }

  return details;
}
