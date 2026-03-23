// ── Renderer Module ──

import { t } from './i18n.js';
import { isWhitelisted } from '../storage/whitelist.js';
import { wasUnfollowed } from '../storage/history.js';
import { getUserMemo } from '../storage/memo.js';
import { VALID_TAGS } from '../storage/memo.js';
import { getFirstSeenDate } from '../storage/preferences.js';
import { getMaliciousInfo, GHOST_AVATAR_PATTERN, calcGhostScore, OLD_FOLLOWING_THRESHOLD } from '../storage/tier.js';
import { isUnstableUser } from '../storage/snapshot.js';
import { FALLBACK_AVATAR, loadImageAsBlob, escapeHtml } from './ui.js';

const LONG_WAIT_DAYS = 30;

const ITEM_HEIGHT = 65;
const BUFFER_COUNT = 5;
const BLOB_CACHE_MAX = 500;

// ── Blob Cache ──
const blobCache = new Map();

export function cleanupBlobCache() {
  for (const blobUrl of blobCache.values()) {
    URL.revokeObjectURL(blobUrl);
  }
  blobCache.clear();
}

export async function loadImageAsBlobCached(url) {
  if (blobCache.has(url)) return blobCache.get(url);
  if (blobCache.size >= BLOB_CACHE_MAX) {
    const firstKey = blobCache.keys().next().value;
    URL.revokeObjectURL(blobCache.get(firstKey));
    blobCache.delete(firstKey);
  }
  const blobUrl = await loadImageAsBlob(url);
  blobCache.set(url, blobUrl);
  return blobUrl;
}

// ── Observer Cleanup ──
let activeObserver = null;

// ── Render ──

export function renderUserList(userListEl, users, showUnfollowControls, selectedIds, { isWideScreen = false } = {}) {
  if (activeObserver) {
    activeObserver.disconnect();
    activeObserver = null;
  }
  userListEl.innerHTML = '';
  userListEl.onscroll = null;

  if (users.length === 0) {
    userListEl.innerHTML = `<p style="text-align:center;color:var(--text-secondary);padding:20px;">${escapeHtml(t('emptyList'))}</p>`;
    return;
  }

  // Wide screen (2-column) disables virtual scroll
  if (users.length <= 100 || isWideScreen) {
    renderAllUsers(userListEl, users, showUnfollowControls, selectedIds);
    return;
  }

  // Virtual scroll for large lists
  const totalHeight = users.length * ITEM_HEIGHT;
  const spacer = document.createElement('div');
  spacer.style.height = `${totalHeight}px`;
  spacer.style.position = 'relative';
  userListEl.appendChild(spacer);

  const avatarObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      const picUrl = img.dataset.picUrl;
      if (picUrl) {
        loadImageAsBlobCached(picUrl).then(blobUrl => { img.src = blobUrl; });
        delete img.dataset.picUrl;
      }
      avatarObserver.unobserve(img);
    });
  }, { root: userListEl, rootMargin: '100px' });
  activeObserver = avatarObserver;

  let renderedRange = { start: -1, end: -1 };

  const renderVisible = () => {
    const scrollTop = userListEl.scrollTop;
    const viewHeight = userListEl.clientHeight;
    let start = Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_COUNT;
    let end = Math.ceil((scrollTop + viewHeight) / ITEM_HEIGHT) + BUFFER_COUNT;
    start = Math.max(0, start);
    end = Math.min(users.length, end);

    if (start === renderedRange.start && end === renderedRange.end) return;

    const existing = spacer.querySelectorAll('.user-card');
    existing.forEach(card => {
      const idx = parseInt(card.dataset.index, 10);
      if (idx < start || idx >= end) card.remove();
    });

    for (let i = start; i < end; i++) {
      if (spacer.querySelector(`[data-index="${i}"]`)) continue;
      const card = createUserCard(users[i], showUnfollowControls, i, selectedIds, users.length);
      card.style.position = 'absolute';
      card.style.top = `${i * ITEM_HEIGHT}px`;
      card.style.left = '0';
      card.style.right = '0';
      spacer.appendChild(card);
      const img = card.querySelector('.user-avatar');
      if (img) avatarObserver.observe(img);
    }

    renderedRange = { start, end };
  };

  renderVisible();
  userListEl.onscroll = renderVisible;
}

function renderAllUsers(userListEl, users, showUnfollowControls, selectedIds) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      const picUrl = img.dataset.picUrl;
      if (picUrl) {
        loadImageAsBlobCached(picUrl).then(blobUrl => { img.src = blobUrl; });
        delete img.dataset.picUrl;
      }
      observer.unobserve(img);
    });
  }, { rootMargin: '100px' });
  activeObserver = observer;

  users.forEach((user, i) => {
    const card = createUserCard(user, showUnfollowControls, i, selectedIds, users.length);
    userListEl.appendChild(card);
    const img = card.querySelector('.user-avatar');
    observer.observe(img);
  });
}

function badge(cls, text, title) {
  const span = document.createElement('span');
  span.className = cls;
  span.textContent = text;
  if (title) span.title = title;
  return span;
}

function btn(cls, userId, username, text, opts = {}) {
  const b = document.createElement('button');
  b.className = cls;
  b.dataset.userId = userId;
  if (username) b.dataset.username = username;
  b.textContent = text;
  if (opts.title) b.title = opts.title;
  if (opts.disabled) b.disabled = true;
  return b;
}

export function createUserCard(user, showUnfollowControls, index, selectedIds, totalUsers) {
  const card = document.createElement('div');
  card.className = 'user-card';
  card.dataset.userId = user.id;
  card.dataset.index = index;

  const whitelisted = isWhitelisted(user.id);

  // Checkbox
  if (showUnfollowControls) {
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'user-checkbox';
    cb.dataset.userId = user.id;
    if (whitelisted) cb.disabled = true;
    if (selectedIds.has(user.id) && !whitelisted) cb.checked = true;
    card.appendChild(cb);
  }

  // Avatar
  const img = document.createElement('img');
  img.className = user.is_verified ? 'user-avatar verified-ring' : 'user-avatar';
  img.src = FALLBACK_AVATAR;
  if (user.profile_pic_url) img.dataset.picUrl = user.profile_pic_url;
  img.alt = user.username;
  card.appendChild(img);

  // User Info
  const info = document.createElement('div');
  info.className = 'user-info';

  const usernameDiv = document.createElement('div');
  usernameDiv.className = 'user-username';

  const link = document.createElement('a');
  link.className = 'username-link';
  link.href = `https://www.instagram.com/${encodeURIComponent(user.username)}/`;
  link.target = '_blank';
  link.rel = 'noopener';
  link.textContent = user.username;
  usernameDiv.appendChild(link);

  // Badges (all using textContent — no innerHTML)
  if (user.is_verified) usernameDiv.appendChild(badge('user-verified', '\u2713'));

  const maliciousReason = getMaliciousInfo(user.username);
  if (maliciousReason !== null) usernameDiv.appendChild(badge('badge-malicious', t('malicious'), t('maliciousTooltip', maliciousReason)));
  if (user.is_private) usernameDiv.appendChild(badge('badge-private', t('privateAccount')));

  const isGhost = user.profile_pic_url && user.profile_pic_url.includes(GHOST_AVATAR_PATTERN);
  if (isGhost) usernameDiv.appendChild(badge('badge-ghost', t('ghost')));

  const ghostScore = calcGhostScore(user);
  if (ghostScore >= 60) usernameDiv.appendChild(badge('badge-ghost-score', t('ghostScore', ghostScore), t('ghostScoreTooltip', ghostScore)));
  if (isUnstableUser(user.username)) usernameDiv.appendChild(badge('badge-unstable', t('unstableFollower'), t('unstableTooltip')));

  const firstSeenDate = getFirstSeenDate(user.id);
  if (firstSeenDate && (Date.now() - new Date(firstSeenDate).getTime()) > LONG_WAIT_DAYS * 86400000) {
    usernameDiv.appendChild(badge('badge-long-wait', t('longWait')));
  }
  if (whitelisted) usernameDiv.appendChild(badge('badge-whitelist', t('protected')));

  const memo = getUserMemo(user.id);
  (memo?.tags || []).filter(tag => VALID_TAGS.includes(tag)).forEach(tag => {
    usernameDiv.appendChild(badge(`badge-tag badge-tag-${tag}`, t('tag' + tag.charAt(0).toUpperCase() + tag.slice(1))));
  });

  const isOldFollowing = showUnfollowControls && totalUsers > 0 && index >= totalUsers * (1 - OLD_FOLLOWING_THRESHOLD);
  if (isOldFollowing) usernameDiv.appendChild(badge('badge-old', t('oldFollowing')));
  if (wasUnfollowed(user.id)) usernameDiv.appendChild(badge('badge-unfollowed', t('prevUnfollowed')));

  info.appendChild(usernameDiv);

  const fullnameDiv = document.createElement('div');
  fullnameDiv.className = 'user-fullname';
  fullnameDiv.textContent = user.full_name || '';
  info.appendChild(fullnameDiv);

  if (memo?.text) {
    const preview = document.createElement('div');
    preview.className = 'user-memo-preview';
    const bubble = document.createElement('span');
    bubble.className = 'memo-bubble';
    bubble.textContent = memo.text.length > 40 ? memo.text.slice(0, 40) + '...' : memo.text;
    preview.appendChild(bubble);
    info.appendChild(preview);
  }

  card.appendChild(info);

  // Actions
  const actions = document.createElement('div');
  actions.className = 'user-actions';
  actions.appendChild(btn('btn-report', user.id, user.username, '\u26A0', { title: t('reportUser') }));
  actions.appendChild(btn('btn-memo' + (memo ? ' has-memo' : ''), user.id, user.username, '\uD83D\uDCDD', { title: '\uBA54\uBAA8' }));

  if (showUnfollowControls) {
    actions.appendChild(btn('btn-whitelist' + (whitelisted ? ' active' : ''), user.id, null, '\uD83D\uDEE1\uFE0F', { title: '\uD654\uC774\uD2B8\uB9AC\uC2A4\uD2B8' }));
    const ufBtn = btn('btn-unfollow', user.id, user.username, t('unfollow'));
    if (whitelisted) ufBtn.disabled = true;
    if (user.is_private) ufBtn.title = t('privateWarning');
    actions.appendChild(ufBtn);
  }

  card.appendChild(actions);
  return card;
}
