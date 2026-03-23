// ── Tab Entry Point (ES Module) ──
// v5.0: Slim entry (~200 lines). Logic extracted to sections/

import { t, applyI18n, getLang, setLang } from './modules/i18n.js';
import { getSortPreference, saveSortPreference, isOnboardingDone, setOnboardingDone, getScheduledInterval, saveScheduledInterval, getScheduledDailyLimit, saveScheduledDailyLimit, getSmartSchedule, saveSmartSchedule } from './storage/preferences.js';
import { getAutoWhitelist, saveAutoWhitelist, getWhitelist } from './storage/whitelist.js';
import { getMemos, getUserMemo } from './storage/memo.js';
import { getFirstSeen } from './storage/preferences.js';
import { getCachedAnalysis, CACHE_KEY } from './storage/cache.js';
import { show, hide, initDarkMode, toggleDarkMode } from './modules/ui.js';
import { drawStatsChart } from './modules/chart.js';
import { getFilteredUsers } from './modules/filter.js';
import { renderUserList, cleanupBlobCache } from './modules/renderer.js';
import { initSnapshotUI, buildSnapshotAnalysis } from './modules/snapshot-ui.js';
import { exportBackup, importBackup } from './modules/backup.js';
import { initProfilePreview } from './modules/preview.js';
import { setupAnalysis } from './sections/analysis.js';
import { setupUserActions } from './sections/user-actions.js';

// ── DOM References ──

const $ = (id) => document.getElementById(id);
const els = {
  startSection: $('start-section'), startBtn: $('start-btn'),
  progressSection: $('progress-section'), progressMessage: $('progress-message'),
  progressBar: $('progress-bar'), progressCount: $('progress-count'),
  progressStep: $('progress-step'), progressPercent: $('progress-percent'),
  progressEtaEl: $('progress-eta'),
  resultSection: $('result-section'), errorSection: $('error-section'),
  errorMessage: $('error-message'), retryBtn: $('retry-btn'),
  backToStartBtn: $('back-to-start-btn'),
  followingCountEl: $('following-count'), followerCountEl: $('follower-count'),
  mutualCountEl: $('mutual-count'), notFollowingCountEl: $('not-following-count'),
  followerOnlyCountEl: $('follower-only-count'), ratioValueEl: $('ratio-value'),
  followerChangesEl: $('follower-changes'),
  tabFollowingCount: $('tab-following-count'), tabFollowerCount: $('tab-follower-count'),
  tabMutualCount: $('tab-mutual-count'), tabNotFollowingCount: $('tab-not-following-count'),
  tabFollowerOnlyCount: $('tab-follower-only-count'), tabWhitelistCount: $('tab-whitelist-count'),
  deltaFollowing: $('delta-following'), deltaFollower: $('delta-follower'),
  deltaMutual: $('delta-mutual'), deltaNotFollowing: $('delta-not-following'),
  deltaFollowerOnly: $('delta-follower-only'),
  growthValueEl: $('growth-value'), retentionValueEl: $('retention-value'),
  safetyGaugeContainer: $('safety-gauge-container'),
  freeLimitBanner: $('free-limit-banner'), userTierBadge: $('user-tier-badge'),
  userListEl: $('user-list'), selectAllCheckbox: $('select-all'),
  unfollowSelectedBtn: $('unfollow-selected-btn'), scheduledUnfollowBtn: $('scheduled-unfollow-btn'),
  selectedCountEl: $('selected-count'),
  unfollowProgress: $('unfollow-progress'), unfollowMessage: $('unfollow-message'),
  unfollowTarget: $('unfollow-target'), unfollowBar: $('unfollow-bar'),
  unfollowCountEl: $('unfollow-count'), unfollowStopBtn: $('unfollow-stop-btn'),
  unfollowEta: $('unfollow-eta'),
  authGate: $('auth-gate'), mainApp: $('main-app'),
  googleLoginBtn: $('google-login-btn'), authError: $('auth-error'),
  authEmailEl: $('auth-email'), headerAuth: $('header-auth'), logoutBtn: $('logout-btn'),
  darkModeBtn: $('dark-mode-btn'), langSelect: $('lang-select'),
  filterSearchInput: $('filter-search'), filterVerifiedBtn: $('filter-verified-btn'),
  filterSortSelect: $('filter-sort'), filterExportBtn: $('filter-export-btn'),
  filterGhostBtn: $('filter-ghost-btn'), filterTagSelect: $('filter-tag'),
  tabNav: document.querySelector('.tab-nav'), toolbar: document.querySelector('.toolbar'),
  autoAnalysisToggle: $('auto-analysis-toggle'), autoWhitelistToggle: $('auto-whitelist-toggle'),
  smartScheduleToggle: $('smart-schedule-toggle'),
  scheduledIntervalSlider: $('scheduled-interval-slider'),
  scheduledIntervalValue: $('scheduled-interval-value'),
  scheduledDailyLimitInput: $('scheduled-daily-limit-input'),
};

// ── Shared State ──

const state = {
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

state.switchTab = (tabName) => {
  state.currentTab = tabName;
  els.tabNav.querySelectorAll('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabName));
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
els.darkModeBtn.addEventListener('click', () => { toggleDarkMode(els.darkModeBtn); drawStatsChart(); });
els.langSelect.value = getLang();
els.langSelect.addEventListener('change', () => {
  setLang(els.langSelect.value); applyI18n(els.filterSortSelect);
  if (state.analysisData) state.refreshList();
  state.showSnapshots?.(); userActions.showHistory(); userActions.showScheduledStatus();
});

// ── Tab Nav ──

els.tabNav.addEventListener('click', (e) => { const btn = e.target.closest('.tab-btn'); if (btn) state.switchTab(btn.dataset.tab); });

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
  compareSelected: state.compareSelected
});
state.showSnapshots = showSnapshots;

$('snapshot-list').addEventListener('click', (e) => {
  const viewBtn = e.target.closest('.snapshot-view');
  if (viewBtn) analysis.loadSnapshotView(parseInt(viewBtn.dataset.index, 10));
});

// ── Settings ──

if (els.scheduledIntervalSlider) {
  els.scheduledIntervalSlider.value = getScheduledInterval();
  els.scheduledIntervalValue.textContent = `${getScheduledInterval()}`;
  els.scheduledIntervalSlider.addEventListener('input', () => { const v = parseInt(els.scheduledIntervalSlider.value, 10); els.scheduledIntervalValue.textContent = `${v}`; saveScheduledInterval(v); });
}
if (els.scheduledDailyLimitInput) {
  els.scheduledDailyLimitInput.value = getScheduledDailyLimit();
  els.scheduledDailyLimitInput.addEventListener('change', () => saveScheduledDailyLimit(parseInt(els.scheduledDailyLimitInput.value, 10) || 50));
}
els.autoWhitelistToggle.checked = getAutoWhitelist();
els.autoWhitelistToggle.addEventListener('change', () => saveAutoWhitelist(els.autoWhitelistToggle.checked));
els.smartScheduleToggle.checked = getSmartSchedule();
els.smartScheduleToggle.addEventListener('change', () => saveSmartSchedule(els.smartScheduleToggle.checked));

// ── Backup ──

$('backup-btn').addEventListener('click', () => exportBackup());
$('restore-btn').addEventListener('click', () => $('restore-file').click());
$('restore-file').addEventListener('change', (e) => {
  const file = e.target.files[0]; if (!file) return;
  importBackup(file, () => { initDarkMode(els.darkModeBtn); els.langSelect.value = getLang(); els.filterSortSelect.value = getSortPreference(); applyI18n(els.filterSortSelect); drawStatsChart(); showSnapshots(); userActions.showHistory(); userActions.showScheduledStatus(); });
  e.target.value = '';
});

// ── Keyboard Shortcuts ──

document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !els.resultSection.classList.contains('hidden') && state.currentTab === 'not-following') {
    if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault(); els.selectAllCheckbox.checked = !els.selectAllCheckbox.checked; els.selectAllCheckbox.dispatchEvent(new Event('change'));
    }
  }
  if (e.key === 'Escape') {
    const dynOverlay = document.querySelector('.modal-overlay:not(.hidden):not(#confirm-modal):not(#memo-modal):not(#compare-modal)');
    if (dynOverlay && !dynOverlay.id) { dynOverlay.remove(); return; }
    if (!$('confirm-modal').classList.contains('hidden')) $('confirm-no').click();
    else if (!$('memo-modal').classList.contains('hidden')) $('memo-cancel').click();
    else if (!$('compare-modal').classList.contains('hidden')) $('compare-close').click();
    else if ($('onboarding-overlay') && !$('onboarding-overlay').classList.contains('hidden')) { hide($('onboarding-overlay')); setOnboardingDone(); }
  }
  if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !els.resultSection.classList.contains('hidden')) {
    if (document.activeElement !== els.filterSearchInput) { e.preventDefault(); els.filterSearchInput.focus(); els.filterSearchInput.select(); }
  }
});

// ── Auth ──

async function checkAuthState() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'GET_AUTH_STATUS' });
    if (response.success && response.data?.loggedIn) showMainApp(response.data.email, response.data.premium);
    else showAuthGate();
  } catch { showAuthGate(); }
}

function showAuthGate() {
  show(els.authGate); hide(els.mainApp); hide(els.headerAuth); hide(els.authError);
  if (!isOnboardingDone()) showOnboarding();
}

function showMainApp(email, premium) {
  hide(els.authGate); show(els.mainApp);
  state.userTier = premium ? 'premium' : 'free';
  if (email) { els.authEmailEl.textContent = email; show(els.headerAuth); }
  els.userTierBadge.textContent = premium ? t('premiumBadge') : t('freeBadge');
  els.userTierBadge.className = 'tier-badge ' + (premium ? 'premium' : 'free');
  show(els.userTierBadge);
  premium ? els.scheduledUnfollowBtn.classList.remove('hidden') : els.scheduledUnfollowBtn.classList.add('hidden');
  initMainApp();
}

function initMainApp() {
  drawStatsChart(); showSnapshots(); userActions.showHistory(); userActions.showScheduledStatus();
  (async () => { try { const r = await chrome.runtime.sendMessage({ action: 'GET_AUTO_ANALYSIS_STATUS' }); els.autoAnalysisToggle.checked = r.data?.enabled || false; } catch { els.autoAnalysisToggle.checked = false; } })();
  analysis.refreshSafetyGauge(); initProfilePreview(els.userListEl);
  chrome.runtime.sendMessage({ action: 'CLEAR_BADGE' }).catch(() => {});
  userActions.resumeScheduled();
  const cached = getCachedAnalysis();
  if (cached) { analysis.hydrateFromCache(cached); hide(els.startSection); analysis.displayResults(cached.totalFollowing, cached.totalFollowers); }
}

els.autoAnalysisToggle.addEventListener('change', async () => {
  try { await chrome.runtime.sendMessage({ action: 'SET_AUTO_ANALYSIS', data: { enabled: els.autoAnalysisToggle.checked, periodMinutes: 1440 } }); }
  catch { els.autoAnalysisToggle.checked = !els.autoAnalysisToggle.checked; }
});

function showOnboarding() {
  const overlay = $('onboarding-overlay'); if (!overlay) return;
  let step = 0; const steps = overlay.querySelectorAll('.onboarding-step'); const dots = overlay.querySelectorAll('.onboarding-dot');
  const prevBtn = $('onboarding-prev'); const nextBtn = $('onboarding-next');
  function update() { steps.forEach((s, i) => s.classList.toggle('hidden', i !== step)); dots.forEach((d, i) => d.classList.toggle('active', i === step)); prevBtn.classList.toggle('hidden', step === 0); nextBtn.textContent = step === steps.length - 1 ? t('onboardingDone') : t('onboardingNext'); }
  prevBtn.addEventListener('click', () => { if (step > 0) { step--; update(); } });
  nextBtn.addEventListener('click', () => { if (step < steps.length - 1) { step++; update(); } else { hide(overlay); setOnboardingDone(); } });
  update(); show(overlay);
}

els.googleLoginBtn.addEventListener('click', async () => {
  els.googleLoginBtn.disabled = true; els.googleLoginBtn.querySelector('span').textContent = t('loggingIn'); hide(els.authError);
  try {
    const response = await Promise.race([chrome.runtime.sendMessage({ action: 'GOOGLE_LOGIN' }), new Promise((_, rej) => setTimeout(() => rej(new Error('LOGIN_TIMEOUT')), 30000))]);
    if (!response.success) throw new Error(response.error || 'GOOGLE_API_ERROR');
    showMainApp(response.data.email, response.data.premium);
  } catch (err) {
    const msg = err.message || '';
    els.authError.textContent = (msg.includes('canceled') || msg.includes('cancelled') || msg.includes('The user did not approve')) ? t('GOOGLE_LOGIN_CANCELLED') : (t(msg) || t('GOOGLE_API_ERROR'));
    show(els.authError);
  } finally { els.googleLoginBtn.disabled = false; els.googleLoginBtn.querySelector('span').textContent = t('googleLogin'); }
});

els.logoutBtn.addEventListener('click', async () => {
  try { await chrome.runtime.sendMessage({ action: 'GOOGLE_LOGOUT' }); } catch { /* ignore */ }
  state.userTier = 'free'; showAuthGate();
});

// ── Resize + Cleanup ──

let resizeTimer;
window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (state.analysisData) state.refreshList(); }, 200); });
window.addEventListener('beforeunload', () => cleanupBlobCache());

// ── Init ──

applyI18n(els.filterSortSelect);
analysis.fetchMaliciousUsersList();
checkAuthState();
