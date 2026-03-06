// ── i18n ──

const I18N = {
  ko: {
    subtitle: '맞팔하지 않는 사람 찾기',
    retry: '다시 시도',
    statsTitle: '통계 대시보드',
    snapshotTitle: '분석 이력',
    historyTitle: '언팔로우 기록',
    scheduledTitle: '예약 언팔로우',
    scheduledRemaining: (n) => `대기 중: ${n}명`,
    scheduledCancel: '취소',
    startAnalysis: '분석 시작',
    preparing: '준비 중...',
    following: '팔로잉',
    followers: '팔로워',
    mutual: '맞팔',
    notFollowing: '맞팔안함',
    searchPlaceholder: '사용자 검색...',
    verified: '인증',
    sortDefault: '기본순',
    sortName: '이름순',
    sortVerified: '인증우선',
    sortOldest: '오래된순',
    selectAll: '전체 선택',
    scheduledUnfollow: '예약 언팔',
    unfollowSelected: '선택 언팔로우',
    stop: '중지',
    no: '아니오',
    yes: '네',
    collectingFollowing: '팔로잉 수집 중',
    collectingFollowers: '팔로워 수집 중',
    startingAnalysis: '분석 시작 중...',
    unfollowing: '언팔로우 진행 중',
    waitingSafety: '안전을 위해 대기 중',
    resumeIn: (s) => `${s}초 후 재개`,
    stopped: (n) => `중지됨! ${n}명 언팔로우 완료`,
    completed: (n) => `완료! ${n}명 언팔로우됨`,
    confirmUnfollow: (n) => `${n}명을 언팔하겠습니다.\n하시겠습니까?`,
    confirmSchedule: (n) => `${n}명을 예약 언팔합니다.\n하루에 나눠서 진행됩니다.`,
    noSearchResults: '검색 결과가 없습니다.',
    allMutual: '모든 팔로잉이 맞팔 중입니다!',
    emptyList: '목록이 비어있습니다.',
    prevUnfollowed: '이전에 팔취',
    protected: '보호',
    oldFollowing: '오래된 팔로잉',
    refollow: '다시 팔로우',
    refollowed: '완료',
    unfollow: '언팔로우',
    done: '완료',
    fail: '실패',
    error: '오류',
    stopping: '중지 중...',
    followerChanges: '팔로워 변동 상세',
    lostFollowers: (n) => `언팔한 사람 (${n})`,
    newFollowers: (n) => `새 팔로워 (${n})`,
    justNow: '방금 전',
    minutesAgo: (n) => `${n}분 전`,
    hoursAgo: (n) => `${n}시간 전`,
    daysAgo: (n) => `${n}일 전`,
    chartFollowers: '팔로워',
    chartFollowing: '팔로잉',
    chartNotFollowing: '맞팔안함',
    ratio: '비율',
    autoAnalysis: '자동 분석 (24시간마다)',
    backup: '백업',
    restore: '복원',
    backupSuccess: '백업 파일이 다운로드되었습니다.',
    restoreSuccess: '데이터가 복원되었습니다.',
    restoreFail: '복원에 실패했습니다.',
    compareSnapshots: '비교',
    close: '닫기',
    selectTwoSnapshots: '비교할 스냅샷 2개를 선택하세요.',
    comparedFollowers: '팔로워 변동',
    comparedFollowing: '팔로잉 변동',
    comparedNotFollowing: '맞팔안함 변동',
    memoTitle: '메모',
    memoPlaceholder: '메모를 입력하세요...',
    save: '저장',
    memoSaved: '메모가 저장되었습니다.',
    tagFriend: '친구',
    tagCeleb: '셀럽',
    tagBrand: '브랜드',
    tagWork: '업무',
    toastUnfollowed: (u) => `@${u} 언팔로우 완료`,
    toastRefollowed: (u) => `@${u} 다시 팔로우 완료`,
    toastCopied: '클립보드에 복사되었습니다.',
    NOT_LOGGED_IN: '인스타그램에 먼저 로그인해주세요.\ninstagram.com에 접속하여 로그인 후 다시 시도하세요.',
    RATE_LIMITED: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    API_CHANGED: 'Instagram API가 변경되었을 수 있습니다.\n익스텐션 업데이트를 확인해주세요.',
    UNFOLLOW_FAILED: '언팔로우에 실패했습니다. 잠시 후 다시 시도해주세요.',
    FOLLOW_FAILED: '팔로우에 실패했습니다. 잠시 후 다시 시도해주세요.',
    authRequired: '로그인이 필요합니다',
    googleLogin: 'Google로 로그인',
    logout: '로그아웃',
    loggingIn: '로그인 중...',
    NOT_AUTHORIZED: '승인 대기 중입니다. 관리자가 승인하면 사용할 수 있습니다.',
    GOOGLE_API_ERROR: 'Google API 오류가 발생했습니다.',
    GOOGLE_NO_EMAIL: '이메일 정보를 가져올 수 없습니다.',
    SHEET_ACCESS_ERROR: '허용 목록을 확인할 수 없습니다.',
    GOOGLE_LOGIN_CANCELLED: '로그인이 취소되었습니다.',
    etaRemaining: (m, s) => `남은 시간: ${m}분 ${s}초`,
    etaRemainingSeconds: (s) => `남은 시간: ${s}초`,
  },
  en: {
    subtitle: 'Find non-mutual followers',
    retry: 'Retry',
    statsTitle: 'Stats Dashboard',
    snapshotTitle: 'Analysis History',
    historyTitle: 'Unfollow History',
    scheduledTitle: 'Scheduled Unfollows',
    scheduledRemaining: (n) => `Pending: ${n}`,
    scheduledCancel: 'Cancel',
    startAnalysis: 'Start Analysis',
    preparing: 'Preparing...',
    following: 'Following',
    followers: 'Followers',
    mutual: 'Mutual',
    notFollowing: 'Not Following Back',
    searchPlaceholder: 'Search users...',
    verified: 'Verified',
    sortDefault: 'Default',
    sortName: 'By Name',
    sortVerified: 'Verified First',
    sortOldest: 'Oldest First',
    selectAll: 'Select All',
    scheduledUnfollow: 'Schedule',
    unfollowSelected: 'Unfollow Selected',
    stop: 'Stop',
    no: 'No',
    yes: 'Yes',
    collectingFollowing: 'Collecting following',
    collectingFollowers: 'Collecting followers',
    startingAnalysis: 'Starting analysis...',
    unfollowing: 'Unfollowing',
    waitingSafety: 'Waiting for safety',
    resumeIn: (s) => `Resume in ${s}s`,
    stopped: (n) => `Stopped! ${n} unfollowed`,
    completed: (n) => `Done! ${n} unfollowed`,
    confirmUnfollow: (n) => `Unfollow ${n} users?\nAre you sure?`,
    confirmSchedule: (n) => `Schedule ${n} unfollows.\nThey will be spread over time.`,
    noSearchResults: 'No results found.',
    allMutual: 'All your followings follow you back!',
    emptyList: 'List is empty.',
    prevUnfollowed: 'Prev unfollowed',
    protected: 'Protected',
    oldFollowing: 'Old following',
    refollow: 'Re-follow',
    refollowed: 'Done',
    unfollow: 'Unfollow',
    done: 'Done',
    fail: 'Failed',
    error: 'Error',
    stopping: 'Stopping...',
    followerChanges: 'Follower Changes',
    lostFollowers: (n) => `Lost followers (${n})`,
    newFollowers: (n) => `New followers (${n})`,
    justNow: 'Just now',
    minutesAgo: (n) => `${n}m ago`,
    hoursAgo: (n) => `${n}h ago`,
    daysAgo: (n) => `${n}d ago`,
    chartFollowers: 'Followers',
    chartFollowing: 'Following',
    chartNotFollowing: 'Not Following Back',
    ratio: 'Ratio',
    autoAnalysis: 'Auto analysis (every 24h)',
    backup: 'Backup',
    restore: 'Restore',
    backupSuccess: 'Backup downloaded.',
    restoreSuccess: 'Data restored.',
    restoreFail: 'Restore failed.',
    compareSnapshots: 'Compare',
    close: 'Close',
    selectTwoSnapshots: 'Select 2 snapshots to compare.',
    comparedFollowers: 'Follower changes',
    comparedFollowing: 'Following changes',
    comparedNotFollowing: 'Not-following changes',
    memoTitle: 'Memo',
    memoPlaceholder: 'Enter a memo...',
    save: 'Save',
    memoSaved: 'Memo saved.',
    tagFriend: 'Friend',
    tagCeleb: 'Celeb',
    tagBrand: 'Brand',
    tagWork: 'Work',
    toastUnfollowed: (u) => `@${u} unfollowed`,
    toastRefollowed: (u) => `@${u} re-followed`,
    toastCopied: 'Copied to clipboard.',
    NOT_LOGGED_IN: 'Please log in to Instagram first.\nGo to instagram.com and sign in.',
    RATE_LIMITED: 'Too many requests. Please try again later.',
    API_CHANGED: 'Instagram API may have changed.\nPlease check for extension updates.',
    UNFOLLOW_FAILED: 'Unfollow failed. Please try again later.',
    FOLLOW_FAILED: 'Follow failed. Please try again later.',
    authRequired: 'Login required',
    googleLogin: 'Sign in with Google',
    logout: 'Logout',
    loggingIn: 'Signing in...',
    NOT_AUTHORIZED: 'Pending approval. You can use the app once the admin approves.',
    GOOGLE_API_ERROR: 'Google API error occurred.',
    GOOGLE_NO_EMAIL: 'Could not retrieve email information.',
    SHEET_ACCESS_ERROR: 'Could not verify the allowlist.',
    GOOGLE_LOGIN_CANCELLED: 'Login was cancelled.',
    etaRemaining: (m, s) => `Time left: ${m}m ${s}s`,
    etaRemainingSeconds: (s) => `Time left: ${s}s`,
  }
};

const LANG_KEY = 'insta-lang';
let currentLang = localStorage.getItem(LANG_KEY) || 'ko';

function t(key, ...args) {
  const val = I18N[currentLang]?.[key] || I18N.ko[key] || key;
  return typeof val === 'function' ? val(...args) : val;
}

function applyI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  filterSortSelect.querySelectorAll('option').forEach(opt => {
    if (opt.dataset.i18n) opt.textContent = t(opt.dataset.i18n);
  });
}

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
const unfollowCount = document.getElementById('unfollow-count');
const unfollowStopBtn = document.getElementById('unfollow-stop-btn');
const unfollowEta = document.getElementById('unfollow-eta');
const tabNav = document.querySelector('.tab-nav');
const toolbar = document.querySelector('.toolbar');
const tabFollowingCount = document.getElementById('tab-following-count');
const tabFollowerCount = document.getElementById('tab-follower-count');
const tabMutualCount = document.getElementById('tab-mutual-count');
const tabNotFollowingCount = document.getElementById('tab-not-following-count');
const darkModeBtn = document.getElementById('dark-mode-btn');
const langSelect = document.getElementById('lang-select');
const filterSearchInput = document.getElementById('filter-search');
const filterVerifiedBtn = document.getElementById('filter-verified-btn');
const filterSortSelect = document.getElementById('filter-sort');
const filterExportBtn = document.getElementById('filter-export-btn');
const autoAnalysisToggle = document.getElementById('auto-analysis-toggle');
const toastContainer = document.getElementById('toast-container');
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

const UNFOLLOW_DELAY_MIN = 3000;
const UNFOLLOW_DELAY_MAX = 5000;
const UNFOLLOW_BATCH_SIZE = 10;
const UNFOLLOW_BATCH_PAUSE = 30000;
const STORAGE_KEY = 'insta-unfollow-history';
const SNAPSHOT_KEY = 'insta-analysis-snapshots';
const MAX_SNAPSHOTS = 20;
const WHITELIST_KEY = 'insta-whitelist';
const DARK_MODE_KEY = 'insta-dark-mode';
const SORT_KEY = 'insta-sort-preference';
const CACHE_KEY = 'insta-analysis-cache';
const SCHEDULED_KEY = 'insta-scheduled-unfollow';
const MEMO_KEY = 'insta-user-memos';
const OLD_FOLLOWING_THRESHOLD = 0.7;

// ── State ──

let currentTab = 'not-following';
let analysisData = null;
let unfollowStopped = false;
let filterVerified = false;
let scheduledTimer = null;
const selectedIds = new Set();
let lastClickedIndex = -1; // for shift+click
const compareSelected = new Set(); // snapshot compare indices
let progressStartTime = 0;
let currentPhase = '';

// ── Helpers ──

function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }

function showConfirm(message) {
  return new Promise(resolve => {
    const modal = document.getElementById('confirm-modal');
    const msg = document.getElementById('confirm-message');
    const yesBtn = document.getElementById('confirm-yes');
    const noBtn = document.getElementById('confirm-no');
    msg.textContent = message;
    show(modal);
    const cleanup = (result) => {
      hide(modal);
      yesBtn.removeEventListener('click', onYes);
      noBtn.removeEventListener('click', onNo);
      resolve(result);
    };
    const onYes = () => cleanup(true);
    const onNo = () => cleanup(false);
    yesBtn.addEventListener('click', onYes);
    noBtn.addEventListener('click', onNo);
  });
}

function randomDelay(min, max) {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, ms));
}

function formatEta(totalSeconds) {
  const sec = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return m > 0 ? t('etaRemaining', m, s) : t('etaRemainingSeconds', s);
}

function estimateEta(completed, total) {
  const remaining = total - completed;
  if (remaining <= 0) return 0;

  // Average delay per user: ~4s (midpoint of 3-5s)
  const avgDelay = (UNFOLLOW_DELAY_MIN + UNFOLLOW_DELAY_MAX) / 2 / 1000;
  // Batch pauses: every UNFOLLOW_BATCH_SIZE users, ~32.5s pause
  const avgBatchPause = (UNFOLLOW_BATCH_PAUSE + 2500) / 1000;

  let eta = remaining * avgDelay;
  const batchesLeft = Math.floor((remaining - 1) / UNFOLLOW_BATCH_SIZE);
  // Subtract already-elapsed within current batch
  const posInBatch = completed % UNFOLLOW_BATCH_SIZE;
  const currentBatchRemaining = UNFOLLOW_BATCH_SIZE - posInBatch;
  const firstBatchPause = (remaining > currentBatchRemaining && currentBatchRemaining < UNFOLLOW_BATCH_SIZE) ? 1 : 0;
  const totalPauses = firstBatchPause + Math.max(0, batchesLeft - (firstBatchPause ? 0 : 0));
  const pauseCount = Math.floor(remaining / UNFOLLOW_BATCH_SIZE) + (posInBatch > 0 && remaining > currentBatchRemaining ? 0 : 0);

  // Simpler calculation: count how many batch boundaries remain
  let pauses = 0;
  for (let i = 1; i <= remaining; i++) {
    if ((completed + i) % UNFOLLOW_BATCH_SIZE === 0 && (completed + i) < total) {
      pauses++;
    }
  }
  eta += pauses * avgBatchPause;

  return eta;
}

function countdownDelay(seconds, onTick) {
  return new Promise(resolve => {
    let remaining = seconds;
    onTick(remaining);
    const timer = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        clearInterval(timer);
        resolve();
      } else {
        onTick(remaining);
      }
    }, 1000);
  });
}

const FALLBACK_AVATAR = 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 44 44%22><rect fill=%22%23efefef%22 width=%2244%22 height=%2244%22 rx=%2222%22/><text x=%2222%22 y=%2228%22 text-anchor=%22middle%22 fill=%22%23bbb%22 font-size=%2218%22>?</text></svg>';

async function loadImageAsBlob(url) {
  try {
    const response = await fetch(url);
    if (!response.ok) return FALLBACK_AVATAR;
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch {
    return FALLBACK_AVATAR;
  }
}

function getErrorText(errorCode) {
  return t(errorCode) || `${t('error')}: ${errorCode}`;
}

// ── Toast Notifications ──

function showToast(message, type = '') {
  const toast = document.createElement('div');
  toast.className = `toast${type ? ` toast-${type}` : ''}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ── Dark Mode ──

function initDarkMode() {
  const saved = localStorage.getItem(DARK_MODE_KEY);
  let isDark;
  if (saved !== null) {
    isDark = saved === 'true';
  } else {
    isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  applyDarkMode(isDark);
}

function applyDarkMode(isDark) {
  document.documentElement.classList.toggle('dark', isDark);
  darkModeBtn.textContent = isDark ? '☀️' : '🌙';
}

darkModeBtn.addEventListener('click', () => {
  const isDark = !document.documentElement.classList.contains('dark');
  applyDarkMode(isDark);
  localStorage.setItem(DARK_MODE_KEY, String(isDark));
});

// ── Language ──

langSelect.value = currentLang;
langSelect.addEventListener('change', () => {
  currentLang = langSelect.value;
  localStorage.setItem(LANG_KEY, currentLang);
  applyI18n();
  if (analysisData) refreshList();
  showSnapshots();
  showHistory();
  showScheduledStatus();
});

// ── Whitelist (localStorage) ──

function getWhitelist() {
  try {
    return new Set(JSON.parse(localStorage.getItem(WHITELIST_KEY)) || []);
  } catch {
    return new Set();
  }
}

function saveWhitelist(set) {
  localStorage.setItem(WHITELIST_KEY, JSON.stringify([...set]));
}

function isWhitelisted(userId) {
  return getWhitelist().has(userId);
}

function toggleWhitelist(userId) {
  const wl = getWhitelist();
  if (wl.has(userId)) {
    wl.delete(userId);
  } else {
    wl.add(userId);
  }
  saveWhitelist(wl);
  return wl.has(userId);
}

// ── User Memos (localStorage) ──

function getMemos() {
  try {
    return JSON.parse(localStorage.getItem(MEMO_KEY)) || {};
  } catch {
    return {};
  }
}

function saveMemos(memos) {
  localStorage.setItem(MEMO_KEY, JSON.stringify(memos));
}

function getUserMemo(userId) {
  const memos = getMemos();
  return memos[userId] || null;
}

function setUserMemo(userId, text, tags) {
  const memos = getMemos();
  if (!text && (!tags || tags.length === 0)) {
    delete memos[userId];
  } else {
    memos[userId] = { text: text || '', tags: tags || [] };
  }
  saveMemos(memos);
}

// ── Unfollow History (localStorage) ──

function getUnfollowHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    return {};
  }
}

function saveUnfollowHistory(history) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function recordUnfollow(userId, username) {
  const history = getUnfollowHistory();
  history[userId] = { username, date: new Date().toISOString() };
  saveUnfollowHistory(history);
}

function removeUnfollowRecord(userId) {
  const history = getUnfollowHistory();
  delete history[userId];
  saveUnfollowHistory(history);
}

function wasUnfollowed(userId) {
  const history = getUnfollowHistory();
  return !!history[userId];
}

// ── Analysis Cache (sessionStorage) ──

function getCachedAnalysis() {
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.timestamp > 600000) {
      sessionStorage.removeItem(CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setCachedAnalysis(following, followers, notFollowingBack, mutual, totalFollowing, totalFollowers) {
  sessionStorage.setItem(CACHE_KEY, JSON.stringify({
    following, followers, notFollowingBack, mutual,
    totalFollowing, totalFollowers,
    timestamp: Date.now()
  }));
}

// ── Analysis Snapshots (localStorage) ──

function getSnapshots() {
  try {
    return JSON.parse(localStorage.getItem(SNAPSHOT_KEY)) || [];
  } catch {
    return [];
  }
}

function saveSnapshot(following, followers, notFollowingBack, followerUsernames, followingUsernames) {
  const snapshots = getSnapshots();
  snapshots.unshift({
    date: new Date().toISOString(),
    following,
    followers,
    notFollowingBack,
    followerUsernames: followerUsernames || [],
    followingUsernames: followingUsernames || []
  });
  if (snapshots.length > MAX_SNAPSHOTS) snapshots.length = MAX_SNAPSHOTS;
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshots));
}

// ── Scheduled Unfollow ──

function getScheduledQueue() {
  try {
    return JSON.parse(localStorage.getItem(SCHEDULED_KEY)) || [];
  } catch {
    return [];
  }
}

function saveScheduledQueue(queue) {
  localStorage.setItem(SCHEDULED_KEY, JSON.stringify(queue));
}

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

async function processScheduledQueue() {
  const queue = getScheduledQueue();
  if (queue.length === 0) return;

  const item = queue.shift();
  saveScheduledQueue(queue);

  try {
    const response = await chrome.runtime.sendMessage({
      action: 'UNFOLLOW_USER',
      data: { userId: item.userId }
    });
    if (response.success) {
      recordUnfollow(item.userId, item.username);
      showToast(t('toastUnfollowed', item.username), 'success');
    }
  } catch {
    // Skip failed
  }

  showScheduledStatus();

  if (queue.length > 0) {
    const delay = 180000 + Math.random() * 120000;
    scheduledTimer = setTimeout(processScheduledQueue, delay);
  }
}

document.getElementById('scheduled-cancel-btn').addEventListener('click', () => {
  saveScheduledQueue([]);
  if (scheduledTimer) clearTimeout(scheduledTimer);
  scheduledTimer = null;
  showScheduledStatus();
});

// ── Filter / Sort ──

function getSortPreference() {
  return localStorage.getItem(SORT_KEY) || 'default';
}

function saveSortPreference(value) {
  localStorage.setItem(SORT_KEY, value);
}

function getFilteredUsers() {
  if (!analysisData) return [];

  let users;
  switch (currentTab) {
    case 'following': users = [...analysisData.following]; break;
    case 'followers': users = [...analysisData.followers]; break;
    case 'mutual': users = [...analysisData.mutual]; break;
    case 'not-following': users = [...analysisData.notFollowingBack]; break;
    default: users = [];
  }

  // Search filter
  const query = filterSearchInput.value.trim().toLowerCase();
  if (query) {
    users = users.filter(u =>
      u.username.toLowerCase().includes(query) ||
      (u.full_name && u.full_name.toLowerCase().includes(query))
    );
  }

  // Verified filter
  if (filterVerified) {
    users = users.filter(u => u.is_verified);
  }

  // Sort
  const sort = filterSortSelect.value;
  if (sort === 'name') {
    users.sort((a, b) => a.username.localeCompare(b.username));
  } else if (sort === 'verified') {
    users.sort((a, b) => (b.is_verified ? 1 : 0) - (a.is_verified ? 1 : 0));
  } else if (sort === 'oldest') {
    users.reverse();
  }

  return users;
}

function refreshList() {
  const showControls = currentTab === 'not-following';
  const users = getFilteredUsers();
  renderUserList(users, showControls);
  updateSelectedCount();
}

// ── Progress Listener ──

chrome.runtime.onMessage.addListener((message) => {
  if (message.action === 'PROGRESS') {
    const { phase, current, total } = message.data;
    const phaseText = phase === 'following' ? t('collectingFollowing') : t('collectingFollowers');
    const percent = total > 0 ? Math.round((current / total) * 100) : 0;

    // Reset timer on phase change
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

    // ETA calculation
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

  // Reset search/filter/selection on tab switch
  filterSearchInput.value = '';
  filterVerified = false;
  filterVerifiedBtn.classList.remove('active');
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

filterSearchInput.addEventListener('input', refreshList);

filterVerifiedBtn.addEventListener('click', () => {
  filterVerified = !filterVerified;
  filterVerifiedBtn.classList.toggle('active', filterVerified);
  refreshList();
});

filterSortSelect.value = getSortPreference();
filterSortSelect.addEventListener('change', () => {
  saveSortPreference(filterSortSelect.value);
  refreshList();
});

// ── CSV Export ──

filterExportBtn.addEventListener('click', () => {
  const users = getFilteredUsers();
  if (users.length === 0) return;

  const tabNames = { 'following': t('following'), 'followers': t('followers'), 'mutual': t('mutual'), 'not-following': t('notFollowing') };
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

// ── Analysis ──

async function startAnalysis() {
  const cached = getCachedAnalysis();
  if (cached) {
    analysisData = {
      following: cached.following,
      followers: cached.followers,
      notFollowingBack: cached.notFollowingBack,
      mutual: cached.mutual
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
    const mutual = following.filter(u => followerIds.has(u.id));

    analysisData = { following, followers, notFollowingBack, mutual };

    const followerUsernames = followers.map(u => u.username);
    const followingUsernames = following.map(u => u.username);

    setCachedAnalysis(following, followers, notFollowingBack, mutual, totalFollowing, totalFollowers);

    hide(progressSection);
    showResults(totalFollowing, totalFollowers, followerUsernames, followingUsernames);

    // Clear badge on fresh analysis
    chrome.runtime.sendMessage({ action: 'CLEAR_BADGE' }).catch(() => {});
  } catch (error) {
    hide(progressSection);
    showError(error.message);
  }
}

// ── Results ──

function showResults(totalFollowing, totalFollowers, followerUsernames, followingUsernames) {
  followingCountEl.textContent = totalFollowing;
  followerCountEl.textContent = totalFollowers;
  mutualCountEl.textContent = analysisData.mutual.length;
  notFollowingCountEl.textContent = analysisData.notFollowingBack.length;
  updateRatio(totalFollowing, totalFollowers);

  tabFollowingCount.textContent = totalFollowing;
  tabFollowerCount.textContent = totalFollowers;
  tabMutualCount.textContent = analysisData.mutual.length;
  tabNotFollowingCount.textContent = analysisData.notFollowingBack.length;

  saveSnapshot(
    totalFollowing,
    totalFollowers,
    analysisData.notFollowingBack.length,
    followerUsernames,
    followingUsernames
  );

  show(resultSection);
  switchTab('not-following');
}

function showResultsFromCache(cached) {
  followingCountEl.textContent = cached.totalFollowing;
  followerCountEl.textContent = cached.totalFollowers;
  mutualCountEl.textContent = analysisData.mutual.length;
  notFollowingCountEl.textContent = analysisData.notFollowingBack.length;
  updateRatio(cached.totalFollowing, cached.totalFollowers);

  tabFollowingCount.textContent = cached.totalFollowing;
  tabFollowerCount.textContent = cached.totalFollowers;
  tabMutualCount.textContent = analysisData.mutual.length;
  tabNotFollowingCount.textContent = analysisData.notFollowingBack.length;

  show(resultSection);
  switchTab('not-following');
}

// ── Render User List (Virtual Scroll) ──

const ITEM_HEIGHT = 65;
const BUFFER_COUNT = 5;

function renderUserList(users, showUnfollowControls) {
  userListEl.innerHTML = '';
  userListEl.onscroll = null;

  if (users.length === 0) {
    const emptyMsg = filterSearchInput.value.trim() || filterVerified
      ? t('noSearchResults')
      : showUnfollowControls
        ? t('allMutual')
        : t('emptyList');
    userListEl.innerHTML = `<p style="text-align:center;color:var(--text-secondary);padding:20px;">${emptyMsg}</p>`;
    return;
  }

  if (users.length <= 100) {
    renderAllUsers(users, showUnfollowControls);
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
        loadImageAsBlob(picUrl).then(blobUrl => { img.src = blobUrl; });
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
      const card = createUserCard(users[i], showUnfollowControls, i);
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

function renderAllUsers(users, showUnfollowControls) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      const picUrl = img.dataset.picUrl;
      if (picUrl) {
        loadImageAsBlob(picUrl).then(blobUrl => { img.src = blobUrl; });
        delete img.dataset.picUrl;
      }
      observer.unobserve(img);
    });
  }, { rootMargin: '100px' });

  users.forEach((user, i) => {
    const card = createUserCard(user, showUnfollowControls, i);
    userListEl.appendChild(card);
    const img = card.querySelector('.user-avatar');
    observer.observe(img);
  });
}

function createUserCard(user, showUnfollowControls, index) {
  const card = document.createElement('div');
  card.className = 'user-card';
  card.dataset.userId = user.id;
  card.dataset.index = index;

  const verified = user.is_verified ? '<span class="user-verified">&#10003;</span>' : '';
  const unfollowedBadge = wasUnfollowed(user.id) ? `<span class="badge-unfollowed">${t('prevUnfollowed')}</span>` : '';
  const whitelisted = isWhitelisted(user.id);
  const whitelistBadge = whitelisted ? `<span class="badge-whitelist">${t('protected')}</span>` : '';

  const isOldFollowing = showUnfollowControls && analysisData &&
    index >= analysisData.notFollowingBack.length * (1 - OLD_FOLLOWING_THRESHOLD);
  const oldBadge = isOldFollowing ? `<span class="badge-old">${t('oldFollowing')}</span>` : '';

  // Tags from memo
  const memo = getUserMemo(user.id);
  const tagBadges = (memo?.tags || []).map(tag =>
    `<span class="badge-tag badge-tag-${tag}">${t('tag' + tag.charAt(0).toUpperCase() + tag.slice(1))}</span>`
  ).join('');

  const memoPreview = memo?.text
    ? `<div class="user-memo-preview">${memo.text.slice(0, 40)}${memo.text.length > 40 ? '...' : ''}</div>`
    : '';

  const isChecked = selectedIds.has(user.id);
  const checkboxHtml = showUnfollowControls
    ? `<input type="checkbox" class="user-checkbox" data-user-id="${user.id}"${whitelisted ? ' disabled' : ''}${isChecked && !whitelisted ? ' checked' : ''}>`
    : '';

  let actionsHtml = '';
  if (showUnfollowControls) {
    const wlClass = whitelisted ? ' active' : '';
    const memoClass = memo ? ' has-memo' : '';
    actionsHtml = `<div class="user-actions">
      <button class="btn-memo${memoClass}" data-user-id="${user.id}" data-username="${user.username}" title="메모">📝</button>
      <button class="btn-whitelist${wlClass}" data-user-id="${user.id}" title="화이트리스트">🛡️</button>
      <button class="btn-unfollow" data-user-id="${user.id}" data-username="${user.username}"${whitelisted ? ' disabled' : ''}>${t('unfollow')}</button>
    </div>`;
  } else {
    const memoClass = memo ? ' has-memo' : '';
    actionsHtml = `<div class="user-actions">
      <button class="btn-memo${memoClass}" data-user-id="${user.id}" data-username="${user.username}" title="메모">📝</button>
    </div>`;
  }

  card.innerHTML = `
    ${checkboxHtml}
    <img class="user-avatar" src="${FALLBACK_AVATAR}" data-pic-url="${user.profile_pic_url}" alt="${user.username}">
    <div class="user-info">
      <div class="user-username">
        <a class="username-link" href="https://www.instagram.com/${user.username}/" target="_blank" rel="noopener">${user.username}</a>${verified}${whitelistBadge}${tagBadges}${oldBadge}${unfollowedBadge}
      </div>
      <div class="user-fullname">${user.full_name}</div>
      ${memoPreview}
    </div>
    ${actionsHtml}
  `;

  return card;
}

// ── Selection (Set-based for virtual scroll) ──

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
    const users = getFilteredUsers();
    users.forEach(u => {
      if (!whitelist.has(u.id)) selectedIds.add(u.id);
    });
  } else {
    selectedIds.clear();
  }
  syncCheckboxesToSet();
  updateSelectedCount();
});

// ── Shift+Click Range Selection ──

userListEl.addEventListener('click', (e) => {
  const cb = e.target.closest('.user-checkbox');
  if (!cb) return;

  const currentIndex = parseInt(cb.closest('.user-card').dataset.index, 10);

  if (e.shiftKey && lastClickedIndex >= 0) {
    const users = getFilteredUsers();
    const whitelist = getWhitelist();
    const start = Math.min(lastClickedIndex, currentIndex);
    const end = Math.max(lastClickedIndex, currentIndex);
    const shouldCheck = cb.checked;

    for (let i = start; i <= end; i++) {
      if (i < users.length && !whitelist.has(users[i].id)) {
        if (shouldCheck) {
          selectedIds.add(users[i].id);
        } else {
          selectedIds.delete(users[i].id);
        }
      }
    }
    syncCheckboxesToSet();
    updateSelectedCount();

    // Update selectAll state
    const selectableCount = users.filter(u => !whitelist.has(u.id)).length;
    selectAllCheckbox.checked = selectableCount > 0 && selectedIds.size >= selectableCount;
  }

  lastClickedIndex = currentIndex;
});

userListEl.addEventListener('change', (e) => {
  if (e.target.classList.contains('user-checkbox')) {
    const uid = e.target.dataset.userId;
    if (e.target.checked) {
      selectedIds.add(uid);
    } else {
      selectedIds.delete(uid);
    }
    updateSelectedCount();
    const whitelist = getWhitelist();
    const users = getFilteredUsers();
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
      const verified = usernameDiv.querySelector('.user-verified');
      const badge = document.createElement('span');
      badge.className = 'badge-whitelist';
      badge.textContent = t('protected');
      if (verified) {
        verified.insertAdjacentElement('afterend', badge);
      } else {
        usernameDiv.querySelector('.username-link').insertAdjacentElement('afterend', badge);
      }
    }
  } else {
    if (checkbox) checkbox.disabled = false;
    if (unfollowBtn) unfollowBtn.disabled = false;
    const badge = usernameDiv.querySelector('.badge-whitelist');
    if (badge) badge.remove();
  }

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

  // Update tag buttons
  modal.querySelectorAll('.tag-btn').forEach(btn => {
    btn.classList.toggle('active', memoTargetTags.includes(btn.dataset.tag));
  });

  show(modal);
  input.focus();
});

document.getElementById('memo-modal').addEventListener('click', (e) => {
  const tagBtn = e.target.closest('.tag-btn');
  if (tagBtn) {
    const tag = tagBtn.dataset.tag;
    if (memoTargetTags.includes(tag)) {
      memoTargetTags = memoTargetTags.filter(t => t !== tag);
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
      showToast(t('toastUnfollowed', username), 'success');
    } else {
      btn.textContent = t('fail');
      setTimeout(() => {
        btn.textContent = t('unfollow');
        btn.disabled = false;
      }, 2000);
    }
  } catch {
    btn.textContent = t('error');
    setTimeout(() => {
      btn.textContent = t('unfollow');
      btn.disabled = false;
    }, 2000);
  }
});

// ── Batch Unfollow ──

unfollowStopBtn.addEventListener('click', () => {
  unfollowStopped = true;
  unfollowStopBtn.disabled = true;
  unfollowStopBtn.textContent = t('stopping');
});

unfollowSelectedBtn.addEventListener('click', async () => {
  if (selectedIds.size === 0) return;

  const whitelist = getWhitelist();
  const users = getFilteredUsers();
  const targets = users
    .filter(u => selectedIds.has(u.id) && !whitelist.has(u.id))
    .map(u => ({ userId: u.id, username: u.username }));

  if (targets.length === 0) return;
  if (!await showConfirm(t('confirmUnfollow', targets.length))) return;

  unfollowStopped = false;
  unfollowStopBtn.disabled = false;
  unfollowStopBtn.textContent = t('stop');
  hide(resultSection);
  show(unfollowProgress);

  let completed = 0;
  const total = targets.length;

  // Show initial ETA
  unfollowEta.textContent = formatEta(estimateEta(0, total));

  for (let i = 0; i < targets.length; i++) {
    if (unfollowStopped) break;

    const { userId, username } = targets[i];
    const current = i + 1;
    const percent = Math.round((current / total) * 100);

    unfollowMessage.textContent = `${t('unfollowing')}... (${current}/${total})`;
    unfollowTarget.textContent = `@${username}`;
    unfollowBar.style.width = `${percent}%`;
    unfollowCount.textContent = `${current} / ${total}`;
    unfollowEta.textContent = formatEta(estimateEta(completed, total));

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'UNFOLLOW_USER',
        data: { userId }
      });

      if (response.success) {
        recordUnfollow(userId, username);
        const card = userListEl.querySelector(`[data-user-id="${userId}"]`);
        if (card) {
          const btn = card.querySelector('.btn-unfollow');
          if (btn) {
            btn.textContent = t('done');
            btn.classList.add('done');
          }
          const cb = card.querySelector('.user-checkbox');
          if (cb) cb.checked = false;
        }
      }
    } catch {
      // skip failed ones
    }

    completed++;

    if (unfollowStopped) break;

    if (completed % UNFOLLOW_BATCH_SIZE === 0 && completed < total) {
      const waitSec = Math.ceil((UNFOLLOW_BATCH_PAUSE + Math.random() * 5000) / 1000);
      const baseEta = estimateEta(completed, total);
      await countdownDelay(waitSec, (remaining) => {
        unfollowMessage.textContent = `${t('waitingSafety')}... (${completed}/${total})`;
        unfollowTarget.textContent = t('resumeIn', remaining);
        unfollowEta.textContent = formatEta(baseEta - (waitSec - remaining));
      });
      unfollowTarget.textContent = '';
    } else if (completed < total) {
      await randomDelay(UNFOLLOW_DELAY_MIN, UNFOLLOW_DELAY_MAX);
    }
  }

  unfollowMessage.textContent = unfollowStopped ? t('stopped', completed) : t('completed', completed);
  unfollowTarget.textContent = '';
  unfollowEta.textContent = '';
  unfollowBar.style.width = unfollowStopped ? `${Math.round((completed / total) * 100)}%` : '100%';
  unfollowCount.textContent = `${completed} / ${total}`;
  unfollowStopBtn.disabled = true;

  showToast(unfollowStopped ? t('stopped', completed) : t('completed', completed), 'success');

  setTimeout(() => {
    hide(unfollowProgress);
    updateSelectedCount();
    show(resultSection);
    const remaining = userListEl.querySelectorAll('.btn-unfollow:not(.done)').length;
    notFollowingCountEl.textContent = remaining;
    tabNotFollowingCount.textContent = remaining;
  }, 2000);
});

// ── Scheduled Unfollow ──

scheduledUnfollowBtn.addEventListener('click', async () => {
  if (selectedIds.size === 0) return;

  const whitelist = getWhitelist();
  const users = getFilteredUsers();
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
    scheduledTimer = setTimeout(processScheduledQueue, 5000);
  }
});

// ── Error ──

function showError(errorCode) {
  errorMessage.textContent = getErrorText(errorCode);
  show(errorSection);
  show(startSection);
}

// ── Event Listeners ──

startBtn.addEventListener('click', () => {
  sessionStorage.removeItem(CACHE_KEY);
  startAnalysis();
});
retryBtn.addEventListener('click', () => {
  hide(errorSection);
  sessionStorage.removeItem(CACHE_KEY);
  startAnalysis();
});

// ── Keyboard Shortcuts ──

document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + A: select all (only in not-following tab with result visible)
  if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !resultSection.classList.contains('hidden') && currentTab === 'not-following') {
    // Only if not in an input
    if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      selectAllCheckbox.checked = !selectAllCheckbox.checked;
      selectAllCheckbox.dispatchEvent(new Event('change'));
    }
  }

  // Escape: close modals
  if (e.key === 'Escape') {
    const confirmModal = document.getElementById('confirm-modal');
    const memoModal = document.getElementById('memo-modal');
    const compareModal = document.getElementById('compare-modal');
    if (!confirmModal.classList.contains('hidden')) {
      document.getElementById('confirm-no').click();
    } else if (!memoModal.classList.contains('hidden')) {
      document.getElementById('memo-cancel').click();
    } else if (!compareModal.classList.contains('hidden')) {
      document.getElementById('compare-close').click();
    }
  }

  // Ctrl/Cmd + F: focus search
  if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !resultSection.classList.contains('hidden')) {
    if (document.activeElement !== filterSearchInput) {
      e.preventDefault();
      filterSearchInput.focus();
      filterSearchInput.select();
    }
  }
});

// ── Stats Dashboard (Canvas Chart) ──

function drawStatsChart() {
  const snapshots = getSnapshots();
  const canvas = document.getElementById('stats-chart');
  const section = document.getElementById('stats-section');

  if (snapshots.length < 2) {
    hide(section);
    return;
  }

  show(section);

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);

  const data = snapshots.slice(0, 10).reverse();
  const pad = { top: 20, right: 16, bottom: 30, left: 44 };
  const chartW = w - pad.left - pad.right;
  const chartH = h - pad.top - pad.bottom;

  let allValues = [];
  data.forEach(d => allValues.push(d.following, d.followers, d.notFollowingBack));
  const minVal = Math.min(...allValues);
  const maxVal = Math.max(...allValues);
  const range = maxVal - minVal || 1;

  const style = getComputedStyle(document.documentElement);
  const colorFollowers = style.getPropertyValue('--chart-line-followers').trim();
  const colorFollowing = style.getPropertyValue('--chart-line-following').trim();
  const colorNotFollowing = style.getPropertyValue('--chart-line-notfollowing').trim();
  const colorGrid = style.getPropertyValue('--chart-grid').trim();
  const colorText = style.getPropertyValue('--chart-text').trim();
  const bgCard = style.getPropertyValue('--bg-card').trim();

  ctx.fillStyle = bgCard;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = colorGrid;
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.moveTo(pad.left, y);
    ctx.lineTo(w - pad.right, y);
    ctx.stroke();

    const val = Math.round(maxVal - (range / 4) * i);
    ctx.fillStyle = colorText;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(val, pad.left - 6, y + 3);
  }

  ctx.fillStyle = colorText;
  ctx.font = '9px sans-serif';
  ctx.textAlign = 'center';
  data.forEach((d, i) => {
    const x = pad.left + (chartW / (data.length - 1)) * i;
    const date = new Date(d.date);
    const label = `${date.getMonth() + 1}/${date.getDate()}`;
    ctx.fillText(label, x, h - 8);
  });

  const drawLine = (key, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    data.forEach((d, i) => {
      const x = pad.left + (chartW / (data.length - 1)) * i;
      const y = pad.top + chartH - ((d[key] - minVal) / range) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    data.forEach((d, i) => {
      const x = pad.left + (chartW / (data.length - 1)) * i;
      const y = pad.top + chartH - ((d[key] - minVal) / range) * chartH;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  drawLine('followers', colorFollowers);
  drawLine('following', colorFollowing);
  drawLine('notFollowingBack', colorNotFollowing);

  const legends = [
    { label: t('chartFollowers'), color: colorFollowers },
    { label: t('chartFollowing'), color: colorFollowing },
    { label: t('chartNotFollowing'), color: colorNotFollowing }
  ];
  let lx = pad.left;
  ctx.font = '10px sans-serif';
  legends.forEach(leg => {
    ctx.fillStyle = leg.color;
    ctx.fillRect(lx, 4, 12, 3);
    ctx.fillStyle = colorText;
    ctx.textAlign = 'left';
    ctx.fillText(leg.label, lx + 15, 10);
    lx += ctx.measureText(leg.label).width + 30;
  });
}

// ── Snapshot Display ──

function showSnapshots() {
  const snapshots = getSnapshots();
  const snapshotSection = document.getElementById('snapshot-section');
  const snapshotList = document.getElementById('snapshot-list');
  const compareBtn = document.getElementById('snapshot-compare-btn');

  if (snapshots.length === 0) {
    hide(snapshotSection);
    return;
  }

  // Show compare button if 2+ snapshots
  if (snapshots.length >= 2) {
    show(compareBtn);
  } else {
    hide(compareBtn);
  }

  snapshotList.innerHTML = '';
  compareSelected.clear();

  snapshots.forEach((snap, i) => {
    const prev = snapshots[i + 1];
    const card = document.createElement('div');
    card.className = 'snapshot-card';
    card.dataset.snapIndex = i;

    const deltaHtml = (current, previous, invertColor) => {
      if (!prev) return '';
      const diff = current - previous;
      if (diff === 0) return '<span class="snapshot-delta neutral">±0</span>';
      const cls = invertColor
        ? (diff > 0 ? 'down' : 'up')
        : (diff > 0 ? 'up' : 'down');
      const sign = diff > 0 ? '+' : '';
      return `<span class="snapshot-delta ${cls}">${sign}${diff}</span>`;
    };

    let changesHtml = '';
    if (prev && snap.followerUsernames && prev.followerUsernames) {
      const prevSet = new Set(prev.followerUsernames);
      const currSet = new Set(snap.followerUsernames);
      const lost = prev.followerUsernames.filter(u => !currSet.has(u));
      const gained = snap.followerUsernames.filter(u => !prevSet.has(u));

      if (lost.length > 0 || gained.length > 0) {
        const lostHtml = lost.length > 0
          ? `<div><span class="change-label-lost">${t('lostFollowers', lost.length)}</span><div class="snapshot-changes-list">${lost.map(u => `<a href="https://www.instagram.com/${u}/" target="_blank" rel="noopener">@${u}</a>`).join(', ')}</div></div>`
          : '';
        const gainedHtml = gained.length > 0
          ? `<div><span class="change-label-new">${t('newFollowers', gained.length)}</span><div class="snapshot-changes-list">${gained.map(u => `<a href="https://www.instagram.com/${u}/" target="_blank" rel="noopener">@${u}</a>`).join(', ')}</div></div>`
          : '';
        changesHtml = `<details class="snapshot-changes"><summary>${t('followerChanges')}</summary>${lostHtml}${gainedHtml}</details>`;
      }
    }

    const autoLabel = snap.auto ? ' (auto)' : '';

    card.innerHTML = `
      <div class="snapshot-header">
        <span class="snapshot-date">${formatDate(snap.date)}${autoLabel}</span>
        <div class="snapshot-actions">
          <input type="checkbox" class="snapshot-compare-check" data-snap-index="${i}" title="비교 선택">
          <button class="snapshot-delete" data-index="${i}" title="삭제">&times;</button>
        </div>
      </div>
      <div class="snapshot-stats">
        <div class="snapshot-stat">
          <span class="snapshot-stat-label">${t('following')}</span>
          <span class="snapshot-stat-value">${snap.following}</span>
          ${deltaHtml(snap.following, prev?.following, false)}
        </div>
        <div class="snapshot-stat">
          <span class="snapshot-stat-label">${t('followers')}</span>
          <span class="snapshot-stat-value">${snap.followers}</span>
          ${deltaHtml(snap.followers, prev?.followers, false)}
        </div>
        <div class="snapshot-stat">
          <span class="snapshot-stat-label">${t('notFollowing')}</span>
          <span class="snapshot-stat-value">${snap.notFollowingBack}</span>
          ${deltaHtml(snap.notFollowingBack, prev?.notFollowingBack, true)}
        </div>
      </div>
      ${changesHtml}
    `;
    snapshotList.appendChild(card);
  });

  show(snapshotSection);
}

// ── Snapshot Compare ──

document.getElementById('snapshot-list').addEventListener('change', (e) => {
  const check = e.target.closest('.snapshot-compare-check');
  if (!check) return;
  const idx = parseInt(check.dataset.snapIndex, 10);

  if (check.checked) {
    if (compareSelected.size >= 2) {
      // Uncheck the oldest one
      const oldest = [...compareSelected][0];
      compareSelected.delete(oldest);
      const oldCheck = document.querySelector(`.snapshot-compare-check[data-snap-index="${oldest}"]`);
      if (oldCheck) oldCheck.checked = false;
      const oldCard = oldCheck?.closest('.snapshot-card');
      if (oldCard) oldCard.classList.remove('selected-compare');
    }
    compareSelected.add(idx);
    check.closest('.snapshot-card').classList.add('selected-compare');
  } else {
    compareSelected.delete(idx);
    check.closest('.snapshot-card').classList.remove('selected-compare');
  }
});

document.getElementById('snapshot-compare-btn').addEventListener('click', () => {
  if (compareSelected.size !== 2) {
    showToast(t('selectTwoSnapshots'));
    return;
  }

  const snapshots = getSnapshots();
  const indices = [...compareSelected].sort((a, b) => b - a); // older first
  const older = snapshots[indices[0]];
  const newer = snapshots[indices[1]];

  const content = document.getElementById('compare-content');
  let html = '';

  // Numeric comparison
  const rows = [
    { label: t('following'), old: older.following, new_: newer.following },
    { label: t('followers'), old: older.followers, new_: newer.followers },
    { label: t('notFollowing'), old: older.notFollowingBack, new_: newer.notFollowingBack }
  ];

  html += '<div class="compare-section">';
  rows.forEach(r => {
    const diff = r.new_ - r.old;
    const diffStr = diff > 0 ? `+${diff}` : `${diff}`;
    const cls = diff > 0 ? 'color:var(--color-up)' : diff < 0 ? 'color:var(--color-danger)' : '';
    html += `<div class="compare-row"><span class="compare-label">${r.label}</span><div class="compare-values"><span>${r.old}</span><span class="compare-arrow">→</span><span>${r.new_}</span><span style="${cls};font-weight:600">${diffStr}</span></div></div>`;
  });
  html += '</div>';

  // Follower diff
  if (older.followerUsernames && newer.followerUsernames) {
    const oldSet = new Set(older.followerUsernames);
    const newSet = new Set(newer.followerUsernames);
    const lost = older.followerUsernames.filter(u => !newSet.has(u));
    const gained = newer.followerUsernames.filter(u => !oldSet.has(u));

    if (lost.length > 0) {
      html += `<div class="compare-section"><h4 class="change-label-lost">${t('lostFollowers', lost.length)}</h4><div class="compare-userlist">${lost.map(u => `<a href="https://www.instagram.com/${u}/" target="_blank" rel="noopener">@${u}</a>`).join(', ')}</div></div>`;
    }
    if (gained.length > 0) {
      html += `<div class="compare-section"><h4 class="change-label-new">${t('newFollowers', gained.length)}</h4><div class="compare-userlist">${gained.map(u => `<a href="https://www.instagram.com/${u}/" target="_blank" rel="noopener">@${u}</a>`).join(', ')}</div></div>`;
    }
  }

  content.innerHTML = html;
  show(document.getElementById('compare-modal'));
});

document.getElementById('compare-close').addEventListener('click', () => {
  hide(document.getElementById('compare-modal'));
});

function deleteSnapshot(index) {
  const snapshots = getSnapshots();
  snapshots.splice(index, 1);
  localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshots));
  drawStatsChart();
  showSnapshots();
}

document.getElementById('snapshot-list').addEventListener('click', (e) => {
  const btn = e.target.closest('.snapshot-delete');
  if (!btn) return;
  const index = parseInt(btn.dataset.index, 10);
  deleteSnapshot(index);
});

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
      setTimeout(() => {
        btn.textContent = t('refollow');
        btn.disabled = false;
      }, 2000);
    }
  } catch {
    btn.textContent = t('error');
    setTimeout(() => {
      btn.textContent = t('refollow');
      btn.disabled = false;
    }, 2000);
  }
});

// ── Backup / Restore ──

document.getElementById('backup-btn').addEventListener('click', () => {
  const data = {
    version: 3,
    date: new Date().toISOString(),
    unfollowHistory: getUnfollowHistory(),
    snapshots: getSnapshots(),
    whitelist: [...getWhitelist()],
    memos: getMemos(),
    scheduledQueue: getScheduledQueue(),
    settings: {
      darkMode: localStorage.getItem(DARK_MODE_KEY),
      sort: localStorage.getItem(SORT_KEY),
      lang: localStorage.getItem(LANG_KEY)
    }
  };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `insta-unfollow-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  showToast(t('backupSuccess'), 'success');
});

document.getElementById('restore-btn').addEventListener('click', () => {
  document.getElementById('restore-file').click();
});

document.getElementById('restore-file').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (data.unfollowHistory) saveUnfollowHistory(data.unfollowHistory);
      if (data.snapshots) localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(data.snapshots));
      if (data.whitelist) saveWhitelist(new Set(data.whitelist));
      if (data.memos) saveMemos(data.memos);
      if (data.scheduledQueue) saveScheduledQueue(data.scheduledQueue);
      if (data.settings) {
        if (data.settings.darkMode !== null) localStorage.setItem(DARK_MODE_KEY, data.settings.darkMode);
        if (data.settings.sort) localStorage.setItem(SORT_KEY, data.settings.sort);
        if (data.settings.lang) localStorage.setItem(LANG_KEY, data.settings.lang);
      }

      // Refresh UI
      initDarkMode();
      currentLang = localStorage.getItem(LANG_KEY) || 'ko';
      langSelect.value = currentLang;
      filterSortSelect.value = getSortPreference();
      applyI18n();
      drawStatsChart();
      showSnapshots();
      showHistory();
      showScheduledStatus();

      showToast(t('restoreSuccess'), 'success');
    } catch {
      showToast(t('restoreFail'), 'error');
    }
  };
  reader.readAsText(file);
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

// ── Format Date ──

function formatDate(isoString) {
  const d = new Date(isoString);
  const now = new Date();
  const diffMs = now - d;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return t('justNow');
  if (diffMin < 60) return t('minutesAgo', diffMin);
  if (diffHour < 24) return t('hoursAgo', diffHour);
  if (diffDay < 7) return t('daysAgo', diffDay);

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}.${mm}.${dd}`;
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

  // Clear badge on tab open
  chrome.runtime.sendMessage({ action: 'CLEAR_BADGE' }).catch(() => {});

  // Resume scheduled queue if exists
  if (getScheduledQueue().length > 0 && !scheduledTimer) {
    scheduledTimer = setTimeout(processScheduledQueue, 10000);
  }

  // Load cached analysis on tab reopen
  const cached = getCachedAnalysis();
  if (cached) {
    analysisData = {
      following: cached.following,
      followers: cached.followers,
      notFollowingBack: cached.notFollowingBack,
      mutual: cached.mutual
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

// ── Init ──

initDarkMode();
applyI18n();
checkAuthState();
