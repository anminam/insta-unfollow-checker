// ── Renderer Module ──

import { t } from './i18n.js';
import { isWhitelisted, wasUnfollowed, getUserMemo, OLD_FOLLOWING_THRESHOLD, getFirstSeenDate } from './storage.js';
import { FALLBACK_AVATAR, loadImageAsBlob } from './ui.js';

const GHOST_AVATAR_PATTERN = '44884218_345707102882519_';
const LONG_WAIT_DAYS = 30;

const ITEM_HEIGHT = 65;
const BUFFER_COUNT = 5;

// ── Blob Cache ──
const blobCache = new Map();

export async function loadImageAsBlobCached(url) {
  if (blobCache.has(url)) return blobCache.get(url);
  const blobUrl = await loadImageAsBlob(url);
  blobCache.set(url, blobUrl);
  return blobUrl;
}

// ── Render ──

export function renderUserList(userListEl, users, showUnfollowControls, selectedIds, { isWideScreen = false } = {}) {
  userListEl.innerHTML = '';
  userListEl.onscroll = null;

  if (users.length === 0) {
    const emptyMsg = t('emptyList');
    userListEl.innerHTML = `<p style="text-align:center;color:var(--text-secondary);padding:20px;">${emptyMsg}</p>`;
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

  users.forEach((user, i) => {
    const card = createUserCard(user, showUnfollowControls, i, selectedIds, users.length);
    userListEl.appendChild(card);
    const img = card.querySelector('.user-avatar');
    observer.observe(img);
  });
}

export function createUserCard(user, showUnfollowControls, index, selectedIds, totalUsers) {
  const card = document.createElement('div');
  card.className = 'user-card';
  card.dataset.userId = user.id;
  card.dataset.index = index;

  const verified = user.is_verified ? '<span class="user-verified">&#10003;</span>' : '';
  const unfollowedBadge = wasUnfollowed(user.id) ? `<span class="badge-unfollowed">${t('prevUnfollowed')}</span>` : '';
  const whitelisted = isWhitelisted(user.id);
  const whitelistBadge = whitelisted ? `<span class="badge-whitelist">${t('protected')}</span>` : '';

  const isOldFollowing = showUnfollowControls && totalUsers > 0 &&
    index >= totalUsers * (1 - OLD_FOLLOWING_THRESHOLD);
  const oldBadge = isOldFollowing ? `<span class="badge-old">${t('oldFollowing')}</span>` : '';

  const privateBadge = user.is_private ? `<span class="badge-private">${t('privateAccount')}</span>` : '';
  const isGhost = user.profile_pic_url && user.profile_pic_url.includes(GHOST_AVATAR_PATTERN);
  const ghostBadge = isGhost ? `<span class="badge-ghost">${t('ghost')}</span>` : '';

  const firstSeenDate = getFirstSeenDate(user.id);
  const isLongWait = firstSeenDate && (Date.now() - new Date(firstSeenDate).getTime()) > LONG_WAIT_DAYS * 86400000;
  const longWaitBadge = isLongWait ? `<span class="badge-long-wait">${t('longWait')}</span>` : '';

  // Tags from memo
  const memo = getUserMemo(user.id);
  const tagBadges = (memo?.tags || []).map(tag =>
    `<span class="badge-tag badge-tag-${tag}">${t('tag' + tag.charAt(0).toUpperCase() + tag.slice(1))}</span>`
  ).join('');

  const memoPreview = memo?.text
    ? `<div class="user-memo-preview"><span class="memo-bubble">${memo.text.slice(0, 40)}${memo.text.length > 40 ? '...' : ''}</span></div>`
    : '';

  const isChecked = selectedIds.has(user.id);
  const checkboxHtml = showUnfollowControls
    ? `<input type="checkbox" class="user-checkbox" data-user-id="${user.id}"${whitelisted ? ' disabled' : ''}${isChecked && !whitelisted ? ' checked' : ''}>`
    : '';

  // Verified ring class
  const avatarClass = user.is_verified ? 'user-avatar verified-ring' : 'user-avatar';

  let actionsHtml = '';
  if (showUnfollowControls) {
    const wlClass = whitelisted ? ' active' : '';
    const memoClass = memo ? ' has-memo' : '';
    actionsHtml = `<div class="user-actions">
      <button class="btn-memo${memoClass}" data-user-id="${user.id}" data-username="${user.username}" title="메모">\uD83D\uDCDD</button>
      <button class="btn-whitelist${wlClass}" data-user-id="${user.id}" title="화이트리스트">\uD83D\uDEE1\uFE0F</button>
      <button class="btn-unfollow" data-user-id="${user.id}" data-username="${user.username}"${whitelisted ? ' disabled' : ''}${user.is_private ? ` title="${t('privateWarning')}"` : ''}>${t('unfollow')}</button>
    </div>`;
  } else {
    const memoClass = memo ? ' has-memo' : '';
    actionsHtml = `<div class="user-actions">
      <button class="btn-memo${memoClass}" data-user-id="${user.id}" data-username="${user.username}" title="메모">\uD83D\uDCDD</button>
    </div>`;
  }

  card.innerHTML = `
    ${checkboxHtml}
    <img class="${avatarClass}" src="${FALLBACK_AVATAR}" data-pic-url="${user.profile_pic_url}" alt="${user.username}">
    <div class="user-info">
      <div class="user-username">
        <a class="username-link" href="https://www.instagram.com/${user.username}/" target="_blank" rel="noopener">${user.username}</a>${verified}${privateBadge}${ghostBadge}${longWaitBadge}${whitelistBadge}${tagBadges}${oldBadge}${unfollowedBadge}
      </div>
      <div class="user-fullname">${user.full_name}</div>
      ${memoPreview}
    </div>
    ${actionsHtml}
  `;

  return card;
}
