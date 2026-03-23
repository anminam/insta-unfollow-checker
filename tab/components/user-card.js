// ── User Card Factory ──
// NOTE: Uses innerHTML for complex card structure. All user input is sanitized
// through escapeHtml() before interpolation, matching the existing renderer.js pattern.

import { isWhitelisted } from '../storage/whitelist.js';
import { getUserMemo, VALID_TAGS } from '../storage/memo.js';
import { wasUnfollowed } from '../storage/history.js';
import { getFirstSeenDate } from '../storage/preferences.js';
import { calcGhostScore, GHOST_AVATAR_PATTERN, getMaliciousInfo, OLD_FOLLOWING_THRESHOLD } from '../storage/tier.js';
import { isUnstableUser } from '../storage/snapshot.js';
import { escapeHtml, FALLBACK_AVATAR } from '../modules/ui.js';
import { t } from '../modules/i18n.js';

const LONG_WAIT_DAYS = 30;

/**
 * Create a user card DOM element.
 * All dynamic content is escaped via escapeHtml() to prevent XSS.
 * @param {Object} user
 * @param {boolean} showUnfollowControls
 * @param {number} index
 * @param {Set} selectedIds
 * @param {number} totalUsers
 * @returns {HTMLElement}
 */
export function createUserCard(user, showUnfollowControls, index, selectedIds, totalUsers) {
  const card = document.createElement('div');
  card.className = 'user-card';
  card.dataset.userId = user.id;
  card.dataset.index = index;

  const safeUsername = escapeHtml(user.username);
  const safeFullName = escapeHtml(user.full_name);

  const verified = user.is_verified ? '<span class="user-verified">&#10003;</span>' : '';
  const unfollowedBadge = wasUnfollowed(user.id) ? `<span class="badge-unfollowed">${escapeHtml(t('prevUnfollowed'))}</span>` : '';
  const whitelisted = isWhitelisted(user.id);
  const whitelistBadge = whitelisted ? `<span class="badge-whitelist">${escapeHtml(t('protected'))}</span>` : '';

  const isOldFollowing = showUnfollowControls && totalUsers > 0 &&
    index >= totalUsers * (1 - OLD_FOLLOWING_THRESHOLD);
  const oldBadge = isOldFollowing ? `<span class="badge-old">${escapeHtml(t('oldFollowing'))}</span>` : '';

  const privateBadge = user.is_private ? `<span class="badge-private">${escapeHtml(t('privateAccount'))}</span>` : '';
  const isGhost = user.profile_pic_url && user.profile_pic_url.includes(GHOST_AVATAR_PATTERN);
  const ghostBadge = isGhost ? `<span class="badge-ghost">${escapeHtml(t('ghost'))}</span>` : '';

  const ghostScore = calcGhostScore(user);
  const ghostScoreBadge = ghostScore >= 60
    ? `<span class="badge-ghost-score" title="${escapeHtml(t('ghostScoreTooltip', ghostScore))}">${escapeHtml(t('ghostScore', ghostScore))}</span>`
    : '';

  const unstableBadge = isUnstableUser(user.username)
    ? `<span class="badge-unstable" title="${escapeHtml(t('unstableTooltip'))}">${escapeHtml(t('unstableFollower'))}</span>`
    : '';

  const firstSeenDate = getFirstSeenDate(user.id);
  const isLongWait = firstSeenDate && (Date.now() - new Date(firstSeenDate).getTime()) > LONG_WAIT_DAYS * 86400000;
  const longWaitBadge = isLongWait ? `<span class="badge-long-wait">${escapeHtml(t('longWait'))}</span>` : '';

  const maliciousReason = getMaliciousInfo(user.username);
  const maliciousBadge = maliciousReason !== null
    ? `<span class="badge-malicious" title="${escapeHtml(t('maliciousTooltip', maliciousReason))}">${escapeHtml(t('malicious'))}</span>`
    : '';

  const memo = getUserMemo(user.id);
  const tagBadges = (memo?.tags || []).filter(tag => VALID_TAGS.includes(tag)).map(tag =>
    `<span class="badge-tag badge-tag-${escapeHtml(tag)}">${escapeHtml(t('tag' + tag.charAt(0).toUpperCase() + tag.slice(1)))}</span>`
  ).join('');

  const memoPreview = memo?.text
    ? `<div class="user-memo-preview"><span class="memo-bubble">${escapeHtml(memo.text.slice(0, 40))}${memo.text.length > 40 ? '...' : ''}</span></div>`
    : '';

  const isChecked = selectedIds.has(user.id);
  const avatarClass = user.is_verified ? 'user-avatar verified-ring' : 'user-avatar';

  // Build card using DOM methods for structure, innerHTML only for escaped badge strings
  const checkbox = showUnfollowControls ? _createCheckbox(user.id, whitelisted, isChecked) : null;

  const img = document.createElement('img');
  img.className = avatarClass;
  img.src = FALLBACK_AVATAR;
  img.dataset.picUrl = user.profile_pic_url || '';
  img.alt = safeUsername;

  const info = document.createElement('div');
  info.className = 'user-info';

  const usernameRow = document.createElement('div');
  usernameRow.className = 'user-username';
  const link = document.createElement('a');
  link.className = 'username-link';
  link.href = `https://www.instagram.com/${encodeURIComponent(user.username)}/`;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = user.username;
  usernameRow.appendChild(link);

  // Badges are static i18n strings (all escaped) - safe for innerHTML append
  const badgeHtml = [verified, maliciousBadge, privateBadge, ghostBadge, ghostScoreBadge,
    unstableBadge, longWaitBadge, whitelistBadge, tagBadges, oldBadge, unfollowedBadge]
    .filter(Boolean).join('');
  if (badgeHtml) {
    const badgeSpan = document.createElement('span');
    badgeSpan.innerHTML = badgeHtml; // All content is escapeHtml'd above
    while (badgeSpan.firstChild) usernameRow.appendChild(badgeSpan.firstChild);
  }

  const fullnameEl = document.createElement('div');
  fullnameEl.className = 'user-fullname';
  fullnameEl.textContent = user.full_name || '';

  info.appendChild(usernameRow);
  info.appendChild(fullnameEl);

  if (memoPreview) {
    const memoDiv = document.createElement('div');
    memoDiv.innerHTML = memoPreview; // memo.text is escapeHtml'd
    if (memoDiv.firstChild) info.appendChild(memoDiv.firstChild);
  }

  const actions = _createActions(user, showUnfollowControls, whitelisted, memo, safeUsername);

  if (checkbox) card.appendChild(checkbox);
  card.appendChild(img);
  card.appendChild(info);
  card.appendChild(actions);

  return card;
}

/** @private */
function _createCheckbox(userId, whitelisted, isChecked) {
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = 'user-checkbox';
  cb.dataset.userId = userId;
  if (whitelisted) cb.disabled = true;
  if (isChecked && !whitelisted) cb.checked = true;
  return cb;
}

/** @private */
function _createActions(user, showUnfollowControls, whitelisted, memo, safeUsername) {
  const div = document.createElement('div');
  div.className = 'user-actions';

  const reportBtn = document.createElement('button');
  reportBtn.className = 'btn-report';
  reportBtn.dataset.userId = user.id;
  reportBtn.dataset.username = user.username;
  reportBtn.title = t('reportUser');
  reportBtn.innerHTML = '&#9888;';
  div.appendChild(reportBtn);

  const memoBtn = document.createElement('button');
  memoBtn.className = `btn-memo${memo ? ' has-memo' : ''}`;
  memoBtn.dataset.userId = user.id;
  memoBtn.dataset.username = user.username;
  memoBtn.title = '\uBA54\uBAA8';
  memoBtn.textContent = '\uD83D\uDCDD';
  div.appendChild(memoBtn);

  if (showUnfollowControls) {
    const wlBtn = document.createElement('button');
    wlBtn.className = `btn-whitelist${whitelisted ? ' active' : ''}`;
    wlBtn.dataset.userId = user.id;
    wlBtn.title = '\uD654\uC774\uD2B8\uB9AC\uC2A4\uD2B8';
    wlBtn.textContent = '\uD83D\uDEE1\uFE0F';
    div.appendChild(wlBtn);

    const unfBtn = document.createElement('button');
    unfBtn.className = 'btn-unfollow';
    unfBtn.dataset.userId = user.id;
    unfBtn.dataset.username = user.username;
    if (whitelisted) unfBtn.disabled = true;
    if (user.is_private) unfBtn.title = t('privateWarning');
    unfBtn.textContent = t('unfollow');
    div.appendChild(unfBtn);
  }

  return div;
}
