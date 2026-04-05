// ── Tab Entry Point (ES Module) ──
// v5.0: 3-view layout (Dashboard / Users / Settings)

import { t, applyI18n, getLang, setLang } from './modules/i18n.js';
import { getSortPreference, saveSortPreference } from './storage/preferences.js';
import { getWhitelist } from './storage/whitelist.js';
import { getMemos } from './storage/memo.js';
import { getFirstSeen } from './storage/preferences.js';
import { show, hide, initDarkMode, toggleDarkMode } from './modules/ui.js';
import { drawStatsChart } from './modules/chart.js';
import { getFilteredUsers } from './modules/filter.js';
import { renderUserList, cleanupBlobCache } from './modules/renderer.js';
import { initSnapshotUI, buildSnapshotAnalysis } from './modules/snapshot-ui.js';
import { exportBackup, importBackup } from './modules/backup.js';
import { initProfilePreview } from './modules/preview.js';
import { initShortcuts } from './modules/shortcuts.js';
import { setupAnalysis } from './sections/analysis.js';
import { setupUserActions } from './sections/user-actions.js';
import { setupAuth } from './sections/auth.js';
import { setupSettings } from './sections/settings.js';
import { renderInsights, drawSparkline } from './modules/dashboard-insights.js';
import { getRecommendations, getReasonKey } from './modules/smart-unfollow.js';

// ── DOM References ──

const $ = (id) => document.getElementById(id);
const els = {
  // Views
  mainNav: $('main-nav'),
  viewDashboard: $('view-dashboard'),
  viewUsers: $('view-users'),
  viewSettings: $('view-settings'),
  navUsersBtn: $('nav-users-btn'),
  dashboardPlaceholder: $('dashboard-placeholder'),
  dashboardSummary: $('dashboard-summary'),

  // Analysis / Progress
  startBtn: $('start-btn'),
  progressSection: $('progress-section'), progressMessage: $('progress-message'),
  progressBar: $('progress-bar'), progressCount: $('progress-count'),
  progressStep: $('progress-step'), progressPercent: $('progress-percent'),
  progressEtaEl: $('progress-eta'),
  errorSection: $('error-section'),
  errorMessage: $('error-message'), retryBtn: $('retry-btn'),

  // Summary stats (dashboard)
  followingCountEl: $('following-count'), followerCountEl: $('follower-count'),
  mutualCountEl: $('mutual-count'), notFollowingCountEl: $('not-following-count'),
  followerOnlyCountEl: $('follower-only-count'), ratioValueEl: $('ratio-value'),
  followerChangesEl: $('follower-changes'),
  deltaFollowing: $('delta-following'), deltaFollower: $('delta-follower'),
  deltaMutual: $('delta-mutual'), deltaNotFollowing: $('delta-not-following'),
  deltaFollowerOnly: $('delta-follower-only'),
  growthValueEl: $('growth-value'), retentionValueEl: $('retention-value'),
  safetyGaugeContainer: $('safety-gauge-container'),

  // Sub-filter counts
  tabFollowingCount: $('tab-following-count'), tabFollowerCount: $('tab-follower-count'),
  tabMutualCount: $('tab-mutual-count'), tabNotFollowingCount: $('tab-not-following-count'),
  tabFollowerOnlyCount: $('tab-follower-only-count'), tabWhitelistCount: $('tab-whitelist-count'),

  // Users view
  subFilter: $('sub-filter'),
  freeLimitBanner: $('free-limit-banner'), userTierBadge: $('user-tier-badge'),
  userListEl: $('user-list'), selectAllCheckbox: $('select-all'),
  unfollowSelectedBtn: $('unfollow-selected-btn'), scheduledUnfollowBtn: $('scheduled-unfollow-btn'),
  selectedCountEl: $('selected-count'),
  unfollowProgress: $('unfollow-progress'), unfollowMessage: $('unfollow-message'),
  unfollowTarget: $('unfollow-target'), unfollowBar: $('unfollow-bar'),
  unfollowCountEl: $('unfollow-count'), unfollowStopBtn: $('unfollow-stop-btn'),
  unfollowEta: $('unfollow-eta'),

  // Auth
  authGate: $('auth-gate'), mainApp: $('main-app'),
  googleLoginBtn: $('google-login-btn'), authError: $('auth-error'),
  authEmailEl: $('auth-email'), headerAuth: $('header-auth'), logoutBtn: $('logout-btn'), headerLoginBtn: $('header-login-btn'), headerGuest: $('header-guest'),

  // Controls
  darkModeBtn: $('dark-mode-btn'), langSelect: $('lang-select'),
  filterSearchInput: $('filter-search'), filterVerifiedBtn: $('filter-verified-btn'),
  filterSortSelect: $('filter-sort'), filterExportBtn: $('filter-export-btn'),
  filterGhostBtn: $('filter-ghost-btn'), filterTagSelect: $('filter-tag'),
  toolbar: document.querySelector('.toolbar'),

  // Settings
  autoAnalysisToggle: $('auto-analysis-toggle'), autoWhitelistToggle: $('auto-whitelist-toggle'),
  smartScheduleToggle: $('smart-schedule-toggle'),
  scheduledIntervalSlider: $('scheduled-interval-slider'),
  scheduledIntervalValue: $('scheduled-interval-value'),
  scheduledDailyLimitInput: $('scheduled-daily-limit-input'),

  // Insights + Smart Unfollow
  insightsCard: $('insights-card'),
  insightsList: $('insights-list'),
  smartUnfollowSection: $('smart-unfollow-section'),
  smartUnfollowList: $('smart-unfollow-list'),
  smartUnfollowBtn: $('smart-unfollow-btn'),
  sparklineSection: $('sparkline-section'),
  sparklineChart: $('sparkline-chart'),

  // Settings account card
  settingsAccountEmail: $('settings-account-email'),
  settingsAccountTier: $('settings-account-tier'),
  settingsAccountInfo: $('settings-account-info'),
  settingsAccountGuest: $('settings-account-guest'),
  settingsLoginBtn: $('settings-login-btn'),
  settingsLogoutBtn: $('settings-logout-btn'),
};

// ── Shared State ──

const state = {
  currentView: 'dashboard',
  currentTab: 'not-following',
  userTier: 'free',
  analysisData: null,
  fullNotFollowingBackCount: 0,
  selectedIds: new Set(),
  filterVerified: false,
  filterGhost: false,
  filterTag: '',
  compareSelected: new Set(),
};

const isWideScreen = () => window.innerWidth >= 768;

state.getFiltered = () => getFilteredUsers({
  analysisData: state.analysisData, currentTab: state.currentTab,
  searchQuery: els.filterSearchInput.value, filterVerified: state.filterVerified,
  filterGhost: state.filterGhost, filterTag: state.filterTag,
  sortValue: els.filterSortSelect.value, whitelistSet: getWhitelist(),
  firstSeen: getFirstSeen(), memos: getMemos()
});

state.refreshList = () => {
  const showControls = state.currentTab === 'not-following';
  const users = state.getFiltered();
  renderUserList(els.userListEl, users, showControls, state.selectedIds, { isWideScreen: isWideScreen() });
  if (users.length === 0) {
    const msg = els.filterSearchInput.value.trim() || state.filterVerified ? t('noSearchResults') : showControls ? t('allMutual') : t('emptyList');
    els.userListEl.textContent = '';
    const p = document.createElement('p');
    p.className = 'empty-msg';
    p.textContent = msg;
    els.userListEl.appendChild(p);
  }
  userActions.updateSelectedCount();
};

// ── View Switching ──

state.switchView = (viewName) => {
  state.currentView = viewName;
  // Toggle view panels
  [els.viewDashboard, els.viewUsers, els.viewSettings].forEach(v => v.classList.remove('active'));
  const viewMap = { dashboard: els.viewDashboard, users: els.viewUsers, settings: els.viewSettings };
  viewMap[viewName]?.classList.add('active');
  // Toggle nav buttons + aria
  els.mainNav.querySelectorAll('.main-nav-btn').forEach(btn => {
    const isActive = btn.dataset.view === viewName;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });
  // Refresh user list when switching to users
  if (viewName === 'users' && state.analysisData) state.refreshList();
};

state.enableUsersView = () => {
  els.navUsersBtn.disabled = false;
  show(els.dashboardSummary);
  hide(els.dashboardPlaceholder);
};

// ── Tab (Sub-filter) Switching ──

state.switchTab = (tabName) => {
  state.currentTab = tabName;
  els.subFilter.querySelectorAll('.sub-filter-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
  tabName === 'not-following' ? show(els.toolbar) : hide(els.toolbar);
  els.filterSearchInput.value = '';
  state.filterVerified = false; state.filterGhost = false; state.filterTag = '';
  els.filterVerifiedBtn.classList.remove('active');
  els.filterGhostBtn.classList.remove('active');
  els.filterTagSelect.value = '';
  state.selectedIds.clear(); els.selectAllCheckbox.checked = false;
  state.refreshList();
};

state.buildSnapshotAnalysis = buildSnapshotAnalysis;

// ── Setup Sections ──

const analysis = setupAnalysis(els, state);
const userActions = setupUserActions(els, state);

state.refreshSafetyGauge = analysis.refreshSafetyGauge;
state.showSnapshots = null; // set below after initSnapshotUI
state.showHistory = userActions.showHistory;
state.showScheduledStatus = userActions.showScheduledStatus;

// ── Dark Mode + Language ──

initDarkMode(els.darkModeBtn);
els.darkModeBtn.addEventListener('click', () => { toggleDarkMode(els.darkModeBtn); drawStatsChart(); drawSparkline(els.sparklineChart, els.sparklineSection); });
els.langSelect.value = getLang();
els.langSelect.addEventListener('change', () => {
  setLang(els.langSelect.value); applyI18n(els.filterSortSelect);
  if (state.analysisData) state.refreshList();
  state.showSnapshots?.(); userActions.showHistory(); userActions.showScheduledStatus();
});

// ── Main Nav ──

els.mainNav.addEventListener('click', (e) => {
  const btn = e.target.closest('.main-nav-btn');
  if (btn && !btn.disabled) state.switchView(btn.dataset.view);
});

// ── Dashboard stat card click → navigate to users view ──

els.dashboardSummary.addEventListener('click', (e) => {
  const card = e.target.closest('.stat.clickable');
  if (!card || !state.analysisData) return;
  const filter = card.dataset.filter;
  if (filter) {
    state.switchView('users');
    state.switchTab(filter);
  }
});

// ── Sub-filter Nav ──

els.subFilter.addEventListener('click', (e) => { const btn = e.target.closest('.sub-filter-btn'); if (btn) state.switchTab(btn.dataset.tab); });

// ── Filter Bar ──

let searchTimer;
els.filterSearchInput.addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(state.refreshList, 150); });
els.filterVerifiedBtn.addEventListener('click', () => { state.filterVerified = !state.filterVerified; els.filterVerifiedBtn.classList.toggle('active', state.filterVerified); state.refreshList(); });
els.filterGhostBtn.addEventListener('click', () => { state.filterGhost = !state.filterGhost; els.filterGhostBtn.classList.toggle('active', state.filterGhost); state.refreshList(); });
els.filterTagSelect.addEventListener('change', () => { state.filterTag = els.filterTagSelect.value; state.refreshList(); });
els.filterSortSelect.value = getSortPreference();
els.filterSortSelect.addEventListener('change', () => { saveSortPreference(els.filterSortSelect.value); state.refreshList(); });

// ── CSV Export ──

els.filterExportBtn.addEventListener('click', () => {
  const users = state.getFiltered(); if (users.length === 0) return;
  const tabNames = { following: t('following'), followers: t('followers'), mutual: t('mutual'), 'not-following': t('notFollowing'), 'follower-only': t('followerOnly') };
  const bom = '\uFEFF'; const header = 'username,full_name,is_verified,memo,tags';
  const memos = getMemos();
  const rows = users.map(u => { const m = memos[u.id]; return `${u.username},"${(u.full_name || '').replace(/"/g, '""')}",${u.is_verified ? 'Y' : 'N'},"${(m?.text || '').replace(/"/g, '""')}","${(m?.tags || []).join(';')}"`; });
  const blob = new Blob([bom + header + '\n' + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob); const a = document.createElement('a');
  a.href = url; a.download = `insta-${tabNames[state.currentTab] || state.currentTab}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click(); URL.revokeObjectURL(url);
});

// ── Snapshot UI ──

const { showSnapshots } = initSnapshotUI({
  snapshotSection: $('snapshot-section'), snapshotList: $('snapshot-list'),
  compareBtn: $('snapshot-compare-btn'), compareModal: $('compare-modal'),
  compareContent: $('compare-content'), compareCloseBtn: $('compare-close'),
  compareSelected: state.compareSelected,
  getState: () => state
});
state.showSnapshots = showSnapshots;

$('snapshot-list').addEventListener('click', (e) => {
  const viewBtn = e.target.closest('.snapshot-view');
  if (viewBtn) {
    analysis.loadSnapshotView(parseInt(viewBtn.dataset.index, 10));
    // After loading snapshot, switch to users view
    state.enableUsersView();
    state.switchView('users');
  }
});

// ── Backup ──

$('backup-btn').addEventListener('click', () => exportBackup());
$('restore-btn').addEventListener('click', () => $('restore-file').click());
$('restore-file').addEventListener('change', (e) => {
  const file = e.target.files[0]; if (!file) return;
  importBackup(file, () => { initDarkMode(els.darkModeBtn); els.langSelect.value = getLang(); els.filterSortSelect.value = getSortPreference(); applyI18n(els.filterSortSelect); drawStatsChart(); showSnapshots(); userActions.showHistory(); userActions.showScheduledStatus(); });
  e.target.value = '';
});

// ── Setup: Settings, Shortcuts, Auth ──

setupSettings(els);
initShortcuts(els, state);

const { checkAuthState } = setupAuth(els, state, { analysis, userActions, showSnapshots, initProfilePreview });

// ── Dashboard Extras (Insights + Sparkline + Smart Unfollow) ──

function refreshDashboardExtras() {
  renderInsights(els.insightsList, els.insightsCard);
  drawSparkline(els.sparklineChart, els.sparklineSection);
  refreshSmartUnfollow();

  // Premium lock for sparkline and smart unfollow
  if (state.userTier === 'free') {
    applyPremiumLock(els.sparklineSection, t('premiumSparkline'));
    applyPremiumLock(els.smartUnfollowSection, t('premiumSmartUnfollow'));
  }
}

function applyPremiumLock(el, msg) {
  if (!el || el.classList.contains('hidden')) return;
  el.classList.add('premium-lock');
  // Remove existing badge if any
  const existing = el.querySelector('.premium-lock-badge');
  if (existing) existing.remove();
  const badge = document.createElement('span');
  badge.className = 'premium-lock-badge';
  badge.textContent = t('premiumFeature');
  badge.title = msg;
  el.appendChild(badge);
}

function refreshSmartUnfollow() {
  if (!state.analysisData?.notFollowingBack) {
    hide(els.smartUnfollowSection);
    return;
  }
  const recs = getRecommendations(state.analysisData.notFollowingBack, 5);
  if (recs.length === 0) { hide(els.smartUnfollowSection); return; }

  show(els.smartUnfollowSection);
  els.smartUnfollowList.textContent = '';

  recs.forEach(({ user, score, reasons }) => {
    const row = document.createElement('div');
    row.className = 'smart-user-row';

    const nameEl = document.createElement('span');
    nameEl.className = 'smart-user-name';
    const a = document.createElement('a');
    a.href = `https://www.instagram.com/${encodeURIComponent(user.username)}/`;
    a.target = '_blank'; a.rel = 'noopener';
    a.textContent = `@${user.username}`;
    nameEl.appendChild(a);

    const reasonsEl = document.createElement('span');
    reasonsEl.className = 'smart-user-reasons';
    reasons.forEach(r => {
      const badge = document.createElement('span');
      badge.className = 'smart-reason-badge';
      badge.textContent = t(getReasonKey(r));
      reasonsEl.appendChild(badge);
    });

    const scoreEl = document.createElement('span');
    scoreEl.className = 'smart-user-score';
    scoreEl.textContent = score;

    row.append(nameEl, reasonsEl, scoreEl);
    els.smartUnfollowList.appendChild(row);
  });
}

els.smartUnfollowBtn.addEventListener('click', async () => {
  if (!state.analysisData?.notFollowingBack) return;
  const recs = getRecommendations(state.analysisData.notFollowingBack, 10);
  if (recs.length === 0) return;

  // Switch to users view with recommended users selected
  state.switchView('users');
  state.switchTab('not-following');
  state.selectedIds.clear();
  recs.forEach(r => state.selectedIds.add(r.user.id));
  state.refreshList();
  // Check the select-all box proportionally
  els.selectAllCheckbox.checked = false;
});

// Hook into analysis completion
const origEnableUsersView = state.enableUsersView;
state.enableUsersView = () => {
  origEnableUsersView();
  refreshDashboardExtras();
};

// ── Resize + Cleanup ──

let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (state.analysisData) state.refreshList(); }, 200); });
window.addEventListener('beforeunload', () => cleanupBlobCache());

// ── Init ──

applyI18n(els.filterSortSelect);
analysis.fetchMaliciousUsersList();
checkAuthState();
