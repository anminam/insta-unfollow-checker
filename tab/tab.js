// ── Tab Entry Point (ES Module) ──

import { t, applyI18n, getLang, setLang } from './modules/i18n.js';
import {
  CACHE_KEY,
  getWhitelist, toggleWhitelist,
  getMemos, getUserMemo, setUserMemo,
  getUnfollowHistory, recordUnfollow, removeUnfollowRecord,
  getCachedAnalysis, setCachedAnalysis,
  getSnapshots, saveSnapshot,
  getScheduledQueue, saveScheduledQueue,
  getSortPreference, saveSortPreference,
  isOnboardingDone, setOnboardingDone,
  getScheduledInterval, saveScheduledInterval,
  getScheduledDailyLimit, saveScheduledDailyLimit,
  getFirstSeen, recordFirstSeen,
  setMaliciousUsers
} from './modules/storage.js';
import { show, hide, showConfirm, showToast, formatDate, getErrorText, initDarkMode, toggleDarkMode, escapeHtml, usernameLink } from './modules/ui.js';
import { drawStatsChart } from './modules/chart.js';
import { getFilteredUsers } from './modules/filter.js';
import { renderUserList } from './modules/renderer.js';
import { batchUnfollow } from './modules/unfollow.js';
import { initSnapshotUI, buildSnapshotAnalysis } from './modules/snapshot-ui.js';
import { exportBackup, importBackup } from './modules/backup.js';

// ── DOM Elements ──

const startSection = document.getElementById('start-section');
const startBtn = document.getElementById('start-btn');
const progressSection = document.getElementById('progress-section');
const progressMessage = document.getElementById('progress-message');
const progressBar = document.getElementById('progress-bar');
const progressCount = document.getElementById('progress-count');
const resultSection = document.getElementById('result-section');
const followingCountEl = document.getElementById('following-count');
const followerCountEl = document.getElementById('follower-count');
const mutualCountEl = document.getElementById('mutual-count');
const notFollowingCountEl = document.getElementById('not-following-count');
const followerOnlyCountEl = document.getElementById('follower-only-count');
const ratioValueEl = document.getElementById('ratio-value');
const selectAllCheckbox = document.getElementById('select-all');
const unfollowSelectedBtn = document.getElementById('unfollow-selected-btn');
const scheduledUnfollowBtn = document.getElementById('scheduled-unfollow-btn');
const selectedCountEl = document.getElementById('selected-count');
const userListEl = document.getElementById('user-list');
const errorSection = document.getElementById('error-section');
const errorMessage = document.getElementById('error-message');
const retryBtn = document.getElementById('retry-btn');
const unfollowProgress = document.getElementById('unfollow-progress');
const unfollowMessage = document.getElementById('unfollow-message');
const unfollowTarget = document.getElementById('unfollow-target');
const unfollowBar = document.getElementById('unfollow-bar');
const unfollowCountEl = document.getElementById('unfollow-count');
const unfollowStopBtn = document.getElementById('unfollow-stop-btn');
const unfollowEta = document.getElementById('unfollow-eta');
const tabNav = document.querySelector('.tab-nav');
const toolbar = document.querySelector('.toolbar');
const tabFollowingCount = document.getElementById('tab-following-count');
const tabFollowerCount = document.getElementById('tab-follower-count');
const tabMutualCount = document.getElementById('tab-mutual-count');
const tabNotFollowingCount = document.getElementById('tab-not-following-count');
const tabFollowerOnlyCount = document.getElementById('tab-follower-only-count');
const darkModeBtn = document.getElementById('dark-mode-btn');
const langSelect = document.getElementById('lang-select');
const filterSearchInput = document.getElementById('filter-search');
const filterVerifiedBtn = document.getElementById('filter-verified-btn');
const filterSortSelect = document.getElementById('filter-sort');
const filterExportBtn = document.getElementById('filter-export-btn');
const filterGhostBtn = document.getElementById('filter-ghost-btn');
const followerChangesEl = document.getElementById('follower-changes');
const tabWhitelistCount = document.getElementById('tab-whitelist-count');
const autoAnalysisToggle = document.getElementById('auto-analysis-toggle');
const authGate = document.getElementById('auth-gate');
const mainApp = document.getElementById('main-app');
const googleLoginBtn = document.getElementById('google-login-btn');
const authError = document.getElementById('auth-error');
const authEmailEl = document.getElementById('auth-email');
const logoutBtn = document.getElementById('logout-btn');
const headerAuth = document.getElementById('header-auth');
const progressStep = document.getElementById('progress-step');
const progressPercent = document.getElementById('progress-percent');
const progressEtaEl = document.getElementById('progress-eta');
const backToStartBtn = document.getElementById('back-to-start-btn');

// ── Stat delta elements ──
const deltaFollowing = document.getElementById('delta-following');
const deltaFollower = document.getElementById('delta-follower');
const deltaMutual = document.getElementById('delta-mutual');
const deltaNotFollowing = document.getElementById('delta-not-following');
const deltaFollowerOnly = document.getElementById('delta-follower-only');

// ── Scheduled settings ──
const scheduledIntervalSlider = document.getElementById('scheduled-interval-slider');
const scheduledIntervalValue = document.getElementById('scheduled-interval-value');
const scheduledDailyLimitInput = document.getElementById('scheduled-daily-limit-input');

// ── State ──

let currentTab = 'not-following';
let analysisData = null;
let filterVerified = false;
let filterGhost = false;
let scheduledTimer = null;
let scheduledDailyCount = 0;
let scheduledDailyDate = new Date().toDateString();
const selectedIds = new Set();
let lastClickedIndex = -1;
const compareSelected = new Set();
let progressStartTime = 0;
let currentPhase = '';

// ── Helper: check wide screen ──

function isWideScreen() {
  return window.innerWidth >= 768;
}

// ── Filtered users wrapper ──

function getFiltered() {
  return getFilteredUsers({
    analysisData,
    currentTab,
    searchQuery: filterSearchInput.value,
    filterVerified,
    filterGhost,
    sortValue: filterSortSelect.value,
    whitelistSet: getWhitelist(),
    firstSeen: getFirstSeen()
  });
}

function refreshList() {
  const showControls = currentTab === 'not-following';
  const users = getFiltered();
  const emptyMsg = filterSearchInput.value.trim() || filterVerified
    ? t('noSearchResults')
    : showControls
      ? t('allMutual')
      : t('emptyList');

  renderUserList(userListEl, users, showControls, selectedIds, { isWideScreen: isWideScreen() });

  if (users.length === 0) {
    userListEl.innerHTML = `<p style="text-align:center;color:var(--text-secondary);padding:20px;">${emptyMsg}</p>`;
  }
  updateSelectedCount();
}

// ── Dark Mode ──

initDarkMode(darkModeBtn);
darkModeBtn.addEventListener('click', () => toggleDarkMode(darkModeBtn));

// ── Language ──

langSelect.value = getLang();
langSelect.addEventListener('change', () => {
  setLang(langSelect.value);
  applyI18n(filterSortSelect);
  if (analysisData) refreshList();
  showSnapshots();
  showHistory();
  showScheduledStatus();
});

// ── Progress Listener ──

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'PROGRESS') {
    const { phase, current, total } = message.data;
    const phaseText = phase === 'following' ? t('collectingFollowing') : t('collectingFollowers');
    const percent = total > 0 ? Math.round((current / total) * 100) : 0;

    if (phase !== currentPhase) {
      currentPhase = phase;
      progressStartTime = Date.now();
    }

    const stepNum = phase === 'following' ? 1 : 2;
    progressStep.textContent = `${stepNum} / 2`;
    progressMessage.textContent = `${phaseText}...`;
    progressBar.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
    progressCount.textContent = `${current} / ${total}`;

    if (current > 0 && total > 0 && current < total) {
      const elapsed = (Date.now() - progressStartTime) / 1000;
      const rate = current / elapsed;
      const remaining = Math.round((total - current) / rate);
      progressEtaEl.textContent = remaining >= 60
        ? t('etaRemaining', Math.floor(remaining / 60), remaining % 60)
        : t('etaRemainingSeconds', remaining);
    } else {
      progressEtaEl.textContent = '';
    }
  }
});

// ── Tab Switching ──

function switchTab(tabName) {
  currentTab = tabName;

  tabNav.querySelectorAll('.tab-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  if (tabName === 'not-following') {
    show(toolbar);
  } else {
    hide(toolbar);
  }

  filterSearchInput.value = '';
  filterVerified = false;
  filterGhost = false;
  filterVerifiedBtn.classList.remove('active');
  filterGhostBtn.classList.remove('active');
  selectedIds.clear();
  selectAllCheckbox.checked = false;
  lastClickedIndex = -1;

  refreshList();
}

tabNav.addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;
  switchTab(btn.dataset.tab);
});

// ── Filter Bar Events ──

let searchDebounceTimer;
filterSearchInput.addEventListener('input', () => {
  clearTimeout(searchDebounceTimer);
  searchDebounceTimer = setTimeout(refreshList, 150);
});

filterVerifiedBtn.addEventListener('click', () => {
  filterVerified = !filterVerified;
  filterVerifiedBtn.classList.toggle('active', filterVerified);
  refreshList();
});

filterGhostBtn.addEventListener('click', () => {
  filterGhost = !filterGhost;
  filterGhostBtn.classList.toggle('active', filterGhost);
  refreshList();
});

filterSortSelect.value = getSortPreference();
filterSortSelect.addEventListener('change', () => {
  saveSortPreference(filterSortSelect.value);
  refreshList();
});

// ── CSV Export ──

filterExportBtn.addEventListener('click', () => {
  const users = getFiltered();
  if (users.length === 0) return;

  const tabNames = {
    'following': t('following'), 'followers': t('followers'),
    'mutual': t('mutual'), 'not-following': t('notFollowing'),
    'follower-only': t('followerOnly')
  };
  const bom = '\uFEFF';
  const header = 'username,full_name,is_verified,memo,tags';
  const memos = getMemos();
  const rows = users.map(u => {
    const memo = memos[u.id];
    const memoText = (memo?.text || '').replace(/"/g, '""');
    const tags = (memo?.tags || []).join(';');
    return `${u.username},"${(u.full_name || '').replace(/"/g, '""')}",${u.is_verified ? 'Y' : 'N'},"${memoText}","${tags}"`;
  });
  const csv = bom + header + '\n' + rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `insta-${tabNames[currentTab] || currentTab}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
});

// ── Follower Ratio ──

function updateRatio(totalFollowing, totalFollowers) {
  if (totalFollowing === 0) {
    ratioValueEl.textContent = '-';
    ratioValueEl.className = 'stat-value';
    return;
  }
  const ratio = totalFollowers / totalFollowing;
  ratioValueEl.textContent = ratio.toFixed(2);

  let cls = 'ratio-good';
  if (ratio < 0.5) cls = 'ratio-bad';
  else if (ratio < 1) cls = 'ratio-warning';
  ratioValueEl.className = `stat-value ${cls}`;
}

// ── Stat Delta Badges ──

function updateStatDeltas(totalFollowing, totalFollowers, mutualCount, notFollowingCount, followerOnlyCount) {
  const snapshots = getSnapshots();
  if (snapshots.length < 1) {
    // No previous snapshot to compare
    clearDeltas();
    return;
  }

  // Compare with the most recent snapshot (before current one is saved)
  const prev = snapshots[0];
  setDelta(deltaFollowing, totalFollowing - prev.following);
  setDelta(deltaFollower, totalFollowers - prev.followers);
  setDelta(deltaMutual, mutualCount - (prev.following - prev.notFollowingBack));
  setDelta(deltaNotFollowing, notFollowingCount - prev.notFollowingBack, true);
  if (deltaFollowerOnly) {
    const prevFollowerOnly = prev.followers - (prev.following - prev.notFollowingBack);
    setDelta(deltaFollowerOnly, followerOnlyCount - prevFollowerOnly);
  }
}

function setDelta(el, diff, invertColor = false) {
  if (!el) return;
  if (diff === 0 || isNaN(diff)) {
    el.textContent = '';
    return;
  }
  const sign = diff > 0 ? '+' : '';
  el.textContent = `${sign}${diff}`;
  if (invertColor) {
    el.className = `stat-delta ${diff > 0 ? 'down' : 'up'}`;
  } else {
    el.className = `stat-delta ${diff > 0 ? 'up' : 'down'}`;
  }
}

function clearDeltas() {
  [deltaFollowing, deltaFollower, deltaMutual, deltaNotFollowing, deltaFollowerOnly].forEach(el => {
    if (el) el.textContent = '';
  });
}

// ── Follower Changes (Feature 4) ──

function showFollowerChanges(currentFollowers) {
  const snapshots = getSnapshots();
  if (snapshots.length === 0 || !currentFollowers) {
    hide(followerChangesEl);
    return;
  }

  const prev = snapshots[0];
  if (!prev.followerUsernames) {
    hide(followerChangesEl);
    return;
  }

  const prevSet = new Set(prev.followerUsernames);
  const currUsernames = currentFollowers.map(u => u.username);
  const currSet = new Set(currUsernames);
  const lost = prev.followerUsernames.filter(u => !currSet.has(u));
  const gained = currUsernames.filter(u => !prevSet.has(u));

  if (lost.length === 0 && gained.length === 0) {
    followerChangesEl.innerHTML = `<span class="no-changes">${t('noChanges')}</span>`;
    show(followerChangesEl);
    return;
  }

  let html = '<details open>';
  html += `<summary>${t('followerChanges')}</summary>`;
  if (gained.length > 0) {
    html += `<div class="change-gained">${t('newFollowers', gained.length)}</div>`;
    html += `<div class="changes-list">${gained.map(u => `${usernameLink(u)}`).join(', ')}</div>`;
  }
  if (lost.length > 0) {
    html += `<div class="change-lost">${t('lostFollowers', lost.length)}</div>`;
    html += `<div class="changes-list">${lost.map(u => `${usernameLink(u)}`).join(', ')}</div>`;
  }
  html += '</details>';

  followerChangesEl.innerHTML = html;
  show(followerChangesEl);
}

// ── Analysis ──

async function startAnalysis() {
  const cached = getCachedAnalysis();
  if (cached) {
    analysisData = {
      following: cached.following,
      followers: cached.followers,
      notFollowingBack: cached.notFollowingBack,
      mutual: cached.mutual,
      followerOnly: cached.followerOnly || []
    };
    hide(startSection);
    hide(errorSection);
    showResultsFromCache(cached);
    return;
  }

  hide(startSection);
  hide(errorSection);
  hide(resultSection);
  show(progressSection);

  progressMessage.textContent = t('startingAnalysis');
  progressBar.style.width = '0%';
  progressPercent.textContent = '0%';
  progressCount.textContent = '';
  progressStep.textContent = '1 / 2';
  progressEtaEl.textContent = '';
  progressStartTime = Date.now();
  currentPhase = '';

  try {
    const response = await chrome.runtime.sendMessage({ action: 'ANALYZE' });

    if (!response.success) {
      throw new Error(response.error);
    }

    const { following, followers, notFollowingBack, totalFollowing, totalFollowers } = response.data;

    const followerIds = new Set(followers.map(u => u.id));
    const followingIds = new Set(following.map(u => u.id));
    const mutual = following.filter(u => followerIds.has(u.id));
    const followerOnly = followers.filter(u => !followingIds.has(u.id));

    analysisData = { following, followers, notFollowingBack, mutual, followerOnly };

    const followerUsernames = followers.map(u => u.username);
    const followingUsernames = following.map(u => u.username);

    // Record first seen dates
    recordFirstSeen([...following, ...followers]);

    // Show follower changes before saving new snapshot
    showFollowerChanges(followers);

    // Calculate deltas before saving new snapshot
    updateStatDeltas(totalFollowing, totalFollowers, mutual.length, notFollowingBack.length, followerOnly.length);

    setCachedAnalysis(following, followers, notFollowingBack, mutual, followerOnly, totalFollowing, totalFollowers);

    hide(progressSection);
    showResults(totalFollowing, totalFollowers, followerUsernames, followingUsernames);

    chrome.runtime.sendMessage({ action: 'CLEAR_BADGE' }).catch(() => {});
  } catch (error) {
    hide(progressSection);
    showError(error.message);
  }
}

// ── Results ──

function displayResults(totalFollowing, totalFollowers) {
  followingCountEl.textContent = totalFollowing;
  followerCountEl.textContent = totalFollowers;
  mutualCountEl.textContent = analysisData.mutual.length;
  notFollowingCountEl.textContent = analysisData.notFollowingBack.length;
  if (followerOnlyCountEl) followerOnlyCountEl.textContent = analysisData.followerOnly.length;
  updateRatio(totalFollowing, totalFollowers);

  tabFollowingCount.textContent = totalFollowing;
  tabFollowerCount.textContent = totalFollowers;
  tabMutualCount.textContent = analysisData.mutual.length;
  tabNotFollowingCount.textContent = analysisData.notFollowingBack.length;
  if (tabFollowerOnlyCount) tabFollowerOnlyCount.textContent = analysisData.followerOnly.length;
  if (tabWhitelistCount) tabWhitelistCount.textContent = getWhitelist().size;

  show(resultSection);
  switchTab('not-following');
}

async function showResults(totalFollowing, totalFollowers, followerUsernames, followingUsernames) {
  fetchMaliciousUsersList();
  saveSnapshot(
    totalFollowing,
    totalFollowers,
    analysisData.notFollowingBack.length,
    followerUsernames,
    followingUsernames
  );
  displayResults(totalFollowing, totalFollowers);
}

function showResultsFromCache(cached) {
  displayResults(cached.totalFollowing, cached.totalFollowers);
}

// ── Selection ──

function updateSelectedCount() {
  selectedCountEl.textContent = selectedIds.size;
  unfollowSelectedBtn.disabled = selectedIds.size === 0;
  scheduledUnfollowBtn.disabled = selectedIds.size === 0;
}

function syncCheckboxesToSet() {
  userListEl.querySelectorAll('.user-checkbox').forEach(cb => {
    cb.checked = selectedIds.has(cb.dataset.userId);
  });
}

selectAllCheckbox.addEventListener('change', () => {
  const whitelist = getWhitelist();
  if (selectAllCheckbox.checked) {
    const users = getFiltered();
    users.forEach(u => {
      if (!whitelist.has(u.id)) selectedIds.add(u.id);
    });
  } else {
    selectedIds.clear();
  }
  syncCheckboxesToSet();
  updateSelectedCount();
});

// ── Shift+Click ──

userListEl.addEventListener('click', (e) => {
  const cb = e.target.closest('.user-checkbox');
  if (!cb) return;

  const currentIndex = parseInt(cb.closest('.user-card').dataset.index, 10);

  if (e.shiftKey && lastClickedIndex >= 0) {
    const users = getFiltered();
    const whitelist = getWhitelist();
    const start = Math.min(lastClickedIndex, currentIndex);
    const end = Math.max(lastClickedIndex, currentIndex);
    const shouldCheck = cb.checked;

    for (let i = start; i <= end; i++) {
      if (i < users.length && !whitelist.has(users[i].id)) {
        if (shouldCheck) selectedIds.add(users[i].id);
        else selectedIds.delete(users[i].id);
      }
    }
    syncCheckboxesToSet();
    updateSelectedCount();

    const selectableCount = users.filter(u => !whitelist.has(u.id)).length;
    selectAllCheckbox.checked = selectableCount > 0 && selectedIds.size >= selectableCount;
  }

  lastClickedIndex = currentIndex;
});

userListEl.addEventListener('change', (e) => {
  if (e.target.classList.contains('user-checkbox')) {
    const uid = e.target.dataset.userId;
    if (e.target.checked) selectedIds.add(uid);
    else selectedIds.delete(uid);
    updateSelectedCount();
    const whitelist = getWhitelist();
    const users = getFiltered();
    const selectableCount = users.filter(u => !whitelist.has(u.id)).length;
    selectAllCheckbox.checked = selectableCount > 0 && selectedIds.size >= selectableCount;
  }
});

// ── Whitelist Toggle ──

userListEl.addEventListener('click', (e) => {
  const wlBtn = e.target.closest('.btn-whitelist');
  if (!wlBtn) return;

  const userId = wlBtn.dataset.userId;
  const nowWhitelisted = toggleWhitelist(userId);
  wlBtn.classList.toggle('active', nowWhitelisted);

  const card = wlBtn.closest('.user-card');
  const checkbox = card.querySelector('.user-checkbox');
  const unfollowBtn = card.querySelector('.btn-unfollow');
  const usernameDiv = card.querySelector('.user-username');

  if (nowWhitelisted) {
    if (checkbox) { checkbox.checked = false; checkbox.disabled = true; }
    if (unfollowBtn) unfollowBtn.disabled = true;
    selectedIds.delete(userId);
    if (!usernameDiv.querySelector('.badge-whitelist')) {
      const verifiedEl = usernameDiv.querySelector('.user-verified');
      const badge = document.createElement('span');
      badge.className = 'badge-whitelist';
      badge.textContent = t('protected');
      if (verifiedEl) verifiedEl.insertAdjacentElement('afterend', badge);
      else usernameDiv.querySelector('.username-link').insertAdjacentElement('afterend', badge);
    }
  } else {
    if (checkbox) checkbox.disabled = false;
    if (unfollowBtn) unfollowBtn.disabled = false;
    const badge = usernameDiv.querySelector('.badge-whitelist');
    if (badge) badge.remove();
  }

  if (tabWhitelistCount) tabWhitelistCount.textContent = getWhitelist().size;
  updateSelectedCount();
});

// ── Memo Modal ──

let memoTargetUserId = null;
let memoTargetTags = [];

userListEl.addEventListener('click', (e) => {
  const memoBtn = e.target.closest('.btn-memo');
  if (!memoBtn) return;

  memoTargetUserId = memoBtn.dataset.userId;
  const username = memoBtn.dataset.username;
  const modal = document.getElementById('memo-modal');
  const usernameEl = document.getElementById('memo-username');
  const input = document.getElementById('memo-input');

  usernameEl.textContent = `@${username}`;
  const existing = getUserMemo(memoTargetUserId);
  input.value = existing?.text || '';
  memoTargetTags = existing?.tags ? [...existing.tags] : [];

  modal.querySelectorAll('.tag-btn').forEach(btn => {
    btn.classList.toggle('active', memoTargetTags.includes(btn.dataset.tag));
  });

  show(modal);
  input.focus();
});

// ── Report Malicious User ──

userListEl.addEventListener('click', (e) => {
  const reportBtn = e.target.closest('.btn-report');
  if (!reportBtn) return;

  const username = reportBtn.dataset.username;
  const userId = reportBtn.dataset.userId;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box">
      <div class="modal-title">${t('reportTitle')}</div>
      <div class="memo-username">@${escapeHtml(username)}</div>
      <textarea class="memo-input" rows="3" placeholder="${escapeHtml(t('reportPlaceholder'))}"></textarea>
      <div class="modal-buttons">
        <button class="btn btn-secondary report-cancel">${t('no')}</button>
        <button class="btn btn-danger report-submit">${t('reportSubmit')}</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const textarea = overlay.querySelector('.memo-input');
  textarea.focus();

  overlay.querySelector('.report-cancel').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (ev) => { if (ev.target === overlay) overlay.remove(); });

  overlay.querySelector('.report-submit').addEventListener('click', async () => {
    const reason = textarea.value.trim();
    if (!reason) return;
    try {
      const res = await chrome.runtime.sendMessage({
        action: 'REPORT_MALICIOUS_USER',
        data: { username, reason }
      });
      if (res.success) {
        showToast(t('reportSuccess'), 'success');
      } else {
        showToast(t('reportFail'), 'error');
      }
    } catch {
      showToast(t('reportFail'), 'error');
    }
    overlay.remove();
  });
});

async function fetchMaliciousUsersList() {
  try {
    const res = await chrome.runtime.sendMessage({ action: 'FETCH_MALICIOUS_USERS' });
    if (res.success && res.data) {
      setMaliciousUsers(res.data);
      if (analysisData) refreshList();
      showSnapshots();
    }
  } catch { /* ignore */ }
}

document.getElementById('memo-modal').addEventListener('click', (e) => {
  const tagBtn = e.target.closest('.tag-btn');
  if (tagBtn) {
    const tag = tagBtn.dataset.tag;
    if (memoTargetTags.includes(tag)) {
      memoTargetTags = memoTargetTags.filter(tg => tg !== tag);
      tagBtn.classList.remove('active');
    } else {
      memoTargetTags.push(tag);
      tagBtn.classList.add('active');
    }
  }
});

document.getElementById('memo-save').addEventListener('click', () => {
  if (!memoTargetUserId) return;
  const input = document.getElementById('memo-input');
  setUserMemo(memoTargetUserId, input.value.trim(), memoTargetTags);
  hide(document.getElementById('memo-modal'));
  showToast(t('memoSaved'), 'success');
  if (analysisData) refreshList();
  memoTargetUserId = null;
  memoTargetTags = [];
});

document.getElementById('memo-cancel').addEventListener('click', () => {
  hide(document.getElementById('memo-modal'));
  memoTargetUserId = null;
  memoTargetTags = [];
});

// ── Individual Unfollow ──

userListEl.addEventListener('click', async (e) => {
  const btn = e.target.closest('.btn-unfollow');
  if (!btn || btn.classList.contains('done') || btn.disabled) return;

  const userId = btn.dataset.userId;
  const username = btn.dataset.username;
  btn.textContent = '...';
  btn.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'UNFOLLOW_USER',
      data: { userId }
    });

    if (response.success) {
      recordUnfollow(userId, username);
      btn.textContent = t('done');
      btn.classList.add('done');
      const card = btn.closest('.user-card');
      const checkbox = card.querySelector('.user-checkbox');
      if (checkbox) checkbox.checked = false;
      selectedIds.delete(userId);
      updateSelectedCount();
      showToast(t('toastUnfollowed', username), 'success', {
        label: t('undoUnfollow'),
        callback: async () => {
          try {
            const refollowResp = await chrome.runtime.sendMessage({
              action: 'FOLLOW_USER',
              data: { userId }
            });
            if (refollowResp.success) {
              removeUnfollowRecord(userId);
              btn.textContent = t('unfollow');
              btn.classList.remove('done');
              btn.disabled = false;
              showToast(t('toastRefollowed', username), 'success');
            }
          } catch { /* ignore */ }
        }
      });
    } else {
      btn.textContent = t('fail');
      setTimeout(() => { btn.textContent = t('unfollow'); btn.disabled = false; }, 2000);
    }
  } catch {
    btn.textContent = t('error');
    setTimeout(() => { btn.textContent = t('unfollow'); btn.disabled = false; }, 2000);
  }
});

// ── Batch Unfollow ──

unfollowSelectedBtn.addEventListener('click', async () => {
  if (selectedIds.size === 0) return;

  const whitelist = getWhitelist();
  const users = getFiltered();
  const targets = users
    .filter(u => selectedIds.has(u.id) && !whitelist.has(u.id))
    .map(u => ({ userId: u.id, username: u.username }));

  if (targets.length === 0) return;
  if (!await showConfirm(t('confirmUnfollow', targets.length))) return;

  await batchUnfollow({
    targets,
    els: {
      resultSection, unfollowProgress, unfollowMessage, unfollowTarget,
      unfollowBar, unfollowCount: unfollowCountEl, unfollowStopBtn, unfollowEta, userListEl
    },
    selectedIds,
    onComplete: (completed) => {
      updateSelectedCount();
      const remaining = userListEl.querySelectorAll('.btn-unfollow:not(.done)').length;
      notFollowingCountEl.textContent = remaining;
      tabNotFollowingCount.textContent = remaining;
    }
  });
});

// ── Scheduled Unfollow ──

function showScheduledStatus() {
  const queue = getScheduledQueue();
  const section = document.getElementById('scheduled-section');
  const statusEl = document.getElementById('scheduled-status');
  const listEl = document.getElementById('scheduled-list');

  if (queue.length === 0) {
    hide(section);
    return;
  }

  statusEl.textContent = t('scheduledRemaining', queue.length);
  listEl.innerHTML = '';
  queue.slice(0, 10).forEach(item => {
    const div = document.createElement('div');
    div.className = 'scheduled-item';
    div.textContent = `@${item.username}`;
    listEl.appendChild(div);
  });
  if (queue.length > 10) {
    const more = document.createElement('div');
    more.className = 'scheduled-item';
    more.textContent = `...+${queue.length - 10}`;
    listEl.appendChild(more);
  }
  show(section);
}

async function processScheduledQueueLoop() {
  const queue = getScheduledQueue();
  if (queue.length === 0) return;

  // Reset daily count if date changed
  const today = new Date().toDateString();
  if (scheduledDailyDate !== today) {
    scheduledDailyDate = today;
    scheduledDailyCount = 0;
  }

  // Check daily limit
  const dailyLimit = getScheduledDailyLimit();
  if (scheduledDailyCount >= dailyLimit) {
    showToast(t('dailyLimitReached', dailyLimit), 'warning');
    return;
  }

  const item = queue.shift();
  saveScheduledQueue(queue);

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'UNFOLLOW_USER',
      data: { userId: item.userId }
    });
    if (response.success) {
      recordUnfollow(item.userId, item.username);
      scheduledDailyCount++;
      showToast(t('toastUnfollowed', item.username), 'success');
    }
  } catch {
    // Skip failed
  }

  showScheduledStatus();

  if (getScheduledQueue().length > 0) {
    const intervalMin = getScheduledInterval();
    const delay = intervalMin * 60000 + Math.random() * 60000;
    scheduledTimer = setTimeout(processScheduledQueueLoop, delay);
  }
}

document.getElementById('scheduled-cancel-btn').addEventListener('click', () => {
  saveScheduledQueue([]);
  if (scheduledTimer) clearTimeout(scheduledTimer);
  scheduledTimer = null;
  showScheduledStatus();
});

scheduledUnfollowBtn.addEventListener('click', async () => {
  if (selectedIds.size === 0) return;

  const whitelist = getWhitelist();
  const users = getFiltered();
  const targets = users
    .filter(u => selectedIds.has(u.id) && !whitelist.has(u.id))
    .map(u => ({ userId: u.id, username: u.username }));

  if (targets.length === 0) return;
  if (!await showConfirm(t('confirmSchedule', targets.length))) return;

  const queue = getScheduledQueue();
  queue.push(...targets);
  saveScheduledQueue(queue);

  selectedIds.clear();
  selectAllCheckbox.checked = false;
  syncCheckboxesToSet();
  updateSelectedCount();

  showScheduledStatus();

  if (!scheduledTimer) {
    scheduledTimer = setTimeout(processScheduledQueueLoop, 5000);
  }
});

// ── Scheduled Unfollow Settings ──

if (scheduledIntervalSlider) {
  scheduledIntervalSlider.value = getScheduledInterval();
  scheduledIntervalValue.textContent = `${getScheduledInterval()}`;
  scheduledIntervalSlider.addEventListener('input', () => {
    const val = parseInt(scheduledIntervalSlider.value, 10);
    scheduledIntervalValue.textContent = `${val}`;
    saveScheduledInterval(val);
  });
}

if (scheduledDailyLimitInput) {
  scheduledDailyLimitInput.value = getScheduledDailyLimit();
  scheduledDailyLimitInput.addEventListener('change', () => {
    const val = parseInt(scheduledDailyLimitInput.value, 10) || 50;
    saveScheduledDailyLimit(val);
  });
}

// ── Error ──

function showError(errorCode) {
  errorMessage.textContent = getErrorText(errorCode);
  show(errorSection);
  show(startSection);
}

// ── Start / Retry ──

startBtn.addEventListener('click', () => {
  sessionStorage.removeItem(CACHE_KEY);
  startAnalysis();
});

retryBtn.addEventListener('click', () => {
  hide(errorSection);
  sessionStorage.removeItem(CACHE_KEY);
  startAnalysis();
});

backToStartBtn.addEventListener('click', () => {
  hide(resultSection);
  hide(followerChangesEl);
  analysisData = null;
  show(startSection);
  drawStatsChart();
  showSnapshots();
  showHistory();
  showScheduledStatus();
});

// ── Keyboard Shortcuts ──

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !resultSection.classList.contains('hidden') && currentTab === 'not-following') {
    if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      selectAllCheckbox.checked = !selectAllCheckbox.checked;
      selectAllCheckbox.dispatchEvent(new Event('change'));
    }
  }

  if (e.key === 'Escape') {
    const reportOverlay = document.querySelector('.modal-overlay:not(.hidden):not(#confirm-modal):not(#memo-modal):not(#compare-modal)');
    if (reportOverlay && !reportOverlay.id) {
      reportOverlay.remove();
      return;
    }
    const confirmModal = document.getElementById('confirm-modal');
    const memoModal = document.getElementById('memo-modal');
    const compareModal = document.getElementById('compare-modal');
    const onboardingOverlay = document.getElementById('onboarding-overlay');
    if (!confirmModal.classList.contains('hidden')) {
      document.getElementById('confirm-no').click();
    } else if (!memoModal.classList.contains('hidden')) {
      document.getElementById('memo-cancel').click();
    } else if (!compareModal.classList.contains('hidden')) {
      document.getElementById('compare-close').click();
    } else if (onboardingOverlay && !onboardingOverlay.classList.contains('hidden')) {
      hide(onboardingOverlay);
      setOnboardingDone();
    }
  }

  if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !resultSection.classList.contains('hidden')) {
    if (document.activeElement !== filterSearchInput) {
      e.preventDefault();
      filterSearchInput.focus();
      filterSearchInput.select();
    }
  }
});

// ── Snapshot UI (module) ──

const snapshotList = document.getElementById('snapshot-list');
const { showSnapshots } = initSnapshotUI({
  snapshotSection: document.getElementById('snapshot-section'),
  snapshotList,
  compareBtn: document.getElementById('snapshot-compare-btn'),
  compareModal: document.getElementById('compare-modal'),
  compareContent: document.getElementById('compare-content'),
  compareCloseBtn: document.getElementById('compare-close'),
  compareSelected
});

snapshotList.addEventListener('click', (e) => {
  const viewBtn = e.target.closest('.snapshot-view');
  if (viewBtn) {
    const index = parseInt(viewBtn.dataset.index, 10);
    loadSnapshotView(index);
  }
});

function loadSnapshotView(index) {
  const result = buildSnapshotAnalysis(index);
  if (!result) return;

  analysisData = result.analysisData;
  const s = result.stats;

  followingCountEl.textContent = s.following;
  followerCountEl.textContent = s.followers;
  mutualCountEl.textContent = s.mutual;
  notFollowingCountEl.textContent = s.notFollowingBack;
  if (followerOnlyCountEl) followerOnlyCountEl.textContent = s.followerOnly;
  if (tabWhitelistCount) tabWhitelistCount.textContent = getWhitelist().size;
  updateRatio(s.following, s.followers);
  clearDeltas();

  tabFollowingCount.textContent = s.following;
  tabFollowerCount.textContent = s.followers;
  tabMutualCount.textContent = s.mutual;
  tabNotFollowingCount.textContent = s.notFollowingBack;
  if (tabFollowerOnlyCount) tabFollowerOnlyCount.textContent = s.followerOnly;

  hide(startSection);
  hide(errorSection);
  hide(progressSection);
  hide(followerChangesEl);
  show(resultSection);
  switchTab('not-following');
}

// ── History Display (with Refollow) ──

function showHistory() {
  const history = getUnfollowHistory();
  const entries = Object.entries(history);
  const historySection = document.getElementById('history-section');
  const historyList = document.getElementById('history-list');

  if (entries.length === 0) {
    hide(historySection);
    return;
  }

  entries.sort((a, b) => new Date(b[1].date) - new Date(a[1].date));

  historyList.innerHTML = '';
  entries.forEach(([userId, { username, date }]) => {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.innerHTML = `
      <a class="history-username" href="https://www.instagram.com/${username}/" target="_blank" rel="noopener">@${username}</a>
      <div class="history-right">
        <button class="btn-refollow" data-user-id="${userId}" data-username="${username}">${t('refollow')}</button>
        <span class="history-date">${formatDate(date)}</span>
      </div>
    `;
    historyList.appendChild(item);
  });

  show(historySection);
}

// ── Refollow Handler ──

document.getElementById('history-list').addEventListener('click', async (e) => {
  const btn = e.target.closest('.btn-refollow');
  if (!btn || btn.disabled) return;

  const userId = btn.dataset.userId;
  const username = btn.dataset.username;
  btn.textContent = '...';
  btn.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'FOLLOW_USER',
      data: { userId }
    });

    if (response.success) {
      removeUnfollowRecord(userId);
      btn.textContent = t('refollowed');
      showToast(t('toastRefollowed', username), 'success');
      setTimeout(() => showHistory(), 1500);
    } else {
      btn.textContent = t('fail');
      setTimeout(() => { btn.textContent = t('refollow'); btn.disabled = false; }, 2000);
    }
  } catch {
    btn.textContent = t('error');
    setTimeout(() => { btn.textContent = t('refollow'); btn.disabled = false; }, 2000);
  }
});

// ── Backup / Restore (module) ──

document.getElementById('backup-btn').addEventListener('click', () => exportBackup());

document.getElementById('restore-btn').addEventListener('click', () => {
  document.getElementById('restore-file').click();
});

document.getElementById('restore-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  importBackup(file, () => {
    initDarkMode(darkModeBtn);
    langSelect.value = getLang();
    filterSortSelect.value = getSortPreference();
    applyI18n(filterSortSelect);
    drawStatsChart();
    showSnapshots();
    showHistory();
    showScheduledStatus();
  });
  e.target.value = '';
});

// ── Auto Analysis ──

async function initAutoAnalysis() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'GET_AUTO_ANALYSIS_STATUS' });
    autoAnalysisToggle.checked = response.data?.enabled || false;
  } catch {
    autoAnalysisToggle.checked = false;
  }
}

autoAnalysisToggle.addEventListener('change', async () => {
  try {
    await chrome.runtime.sendMessage({
      action: 'SET_AUTO_ANALYSIS',
      data: { enabled: autoAnalysisToggle.checked, periodMinutes: 1440 }
    });
  } catch {
    autoAnalysisToggle.checked = !autoAnalysisToggle.checked;
  }
});

// ── Onboarding Guide ──

function showOnboarding() {
  if (isOnboardingDone()) return;

  const overlay = document.getElementById('onboarding-overlay');
  if (!overlay) return;

  let currentStep = 0;
  const steps = overlay.querySelectorAll('.onboarding-step');
  const dots = overlay.querySelectorAll('.onboarding-dot');
  const prevBtn = document.getElementById('onboarding-prev');
  const nextBtn = document.getElementById('onboarding-next');

  function updateStep() {
    steps.forEach((s, i) => s.classList.toggle('hidden', i !== currentStep));
    dots.forEach((d, i) => d.classList.toggle('active', i === currentStep));
    prevBtn.classList.toggle('hidden', currentStep === 0);
    nextBtn.textContent = currentStep === steps.length - 1 ? t('onboardingDone') : t('onboardingNext');
  }

  prevBtn.addEventListener('click', () => {
    if (currentStep > 0) { currentStep--; updateStep(); }
  });

  nextBtn.addEventListener('click', () => {
    if (currentStep < steps.length - 1) {
      currentStep++;
      updateStep();
    } else {
      hide(overlay);
      setOnboardingDone();
    }
  });

  updateStep();
  show(overlay);
}

// ── Auth ──

async function checkAuthState() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'GET_AUTH_STATUS' });
    if (response.success && response.data?.authorized) {
      showMainApp(response.data.email);
    } else {
      showAuthGate();
    }
  } catch {
    showAuthGate();
  }
}

function showAuthGate() {
  show(authGate);
  hide(mainApp);
  hide(headerAuth);
  hide(authError);
  showOnboarding();
}

function showMainApp(email) {
  hide(authGate);
  show(mainApp);
  if (email) {
    authEmailEl.textContent = email;
    show(headerAuth);
  }
  initMainApp();
}

function initMainApp() {
  drawStatsChart();
  showSnapshots();
  showHistory();
  showScheduledStatus();
  initAutoAnalysis();

  chrome.runtime.sendMessage({ action: 'CLEAR_BADGE' }).catch(() => {});

  if (getScheduledQueue().length > 0 && !scheduledTimer) {
    scheduledTimer = setTimeout(processScheduledQueueLoop, 10000);
  }

  const cached = getCachedAnalysis();
  if (cached) {
    analysisData = {
      following: cached.following,
      followers: cached.followers,
      notFollowingBack: cached.notFollowingBack,
      mutual: cached.mutual,
      followerOnly: cached.followerOnly || []
    };
    hide(startSection);
    showResultsFromCache(cached);
  }
}

async function handleGoogleLogin() {
  googleLoginBtn.disabled = true;
  googleLoginBtn.querySelector('span').textContent = t('loggingIn');
  hide(authError);

  try {
    const response = await chrome.runtime.sendMessage({ action: 'GOOGLE_LOGIN' });
    if (!response.success) {
      throw new Error(response.error || 'GOOGLE_API_ERROR');
    }
    if (response.data.authorized) {
      showMainApp(response.data.email);
    } else {
      authError.textContent = t('NOT_AUTHORIZED');
      show(authError);
    }
  } catch (err) {
    const msg = err.message || '';
    if (msg.includes('canceled') || msg.includes('cancelled') || msg.includes('The user did not approve')) {
      authError.textContent = t('GOOGLE_LOGIN_CANCELLED');
    } else {
      authError.textContent = t(msg) || t('GOOGLE_API_ERROR');
    }
    show(authError);
  } finally {
    googleLoginBtn.disabled = false;
    googleLoginBtn.querySelector('span').textContent = t('googleLogin');
  }
}

async function handleLogout() {
  try {
    await chrome.runtime.sendMessage({ action: 'GOOGLE_LOGOUT' });
  } catch { /* ignore */ }
  showAuthGate();
}

googleLoginBtn.addEventListener('click', handleGoogleLogin);
logoutBtn.addEventListener('click', handleLogout);

// ── Responsive: re-render on resize ──

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (analysisData) refreshList();
  }, 200);
});

// ── Init ──

applyI18n(filterSortSelect);
fetchMaliciousUsersList();
checkAuthState();
