// ── Analysis, Results, Stats ──
// v5.0: Results displayed in dashboard view, no more start-section/result-section toggle

import { t } from '../modules/i18n.js';
import { getCachedAnalysis, setCachedAnalysis, CACHE_KEY } from '../storage/cache.js';
import { getSnapshots, saveSnapshot, buildUnstableUsers } from '../storage/snapshot.js';
import { getWhitelist, saveWhitelist, getAutoWhitelist } from '../storage/whitelist.js';
import { recordFirstSeen } from '../storage/preferences.js';
import { setMaliciousUsers, FREE_ANALYSIS_LIMIT } from '../storage/tier.js';
import { show, hide, getErrorText } from '../modules/ui.js';
import { drawStatsChart } from '../modules/chart.js';
import { renderSafetyGauge } from '../modules/safety.js';

export function setupAnalysis(els, state) {
  const {
    startBtn, progressSection, progressMessage, progressBar,
    progressCount, progressStep, progressPercent, progressEtaEl,
    errorSection, errorMessage,
    followingCountEl, followerCountEl, mutualCountEl, notFollowingCountEl,
    followerOnlyCountEl, ratioValueEl, followerChangesEl,
    tabFollowingCount, tabFollowerCount, tabMutualCount, tabNotFollowingCount,
    tabFollowerOnlyCount, tabWhitelistCount,
    deltaFollowing, deltaFollower, deltaMutual, deltaNotFollowing, deltaFollowerOnly,
    growthValueEl, retentionValueEl, safetyGaugeContainer, freeLimitBanner,
    retryBtn, mainNav
  } = els;

  let progressStartTime = 0;
  let currentPhase = '';

  // ── Progress Listener ──
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action !== 'PROGRESS') return;
    const { phase, current, total } = message.data;
    const phaseText = phase === 'following' ? t('collectingFollowing') : t('collectingFollowers');
    const percent = total > 0 ? Math.round((current / total) * 100) : 0;
    if (phase !== currentPhase) { currentPhase = phase; progressStartTime = Date.now(); }
    progressStep.textContent = `${phase === 'following' ? 1 : 2} / 2`;
    progressMessage.textContent = `${phaseText}...`;
    progressBar.style.width = `${percent}%`;
    progressPercent.textContent = `${percent}%`;
    progressCount.textContent = `${current} / ${total}`;
    if (current > 0 && total > 0 && current < total) {
      const elapsed = (Date.now() - progressStartTime) / 1000;
      const remaining = Math.round((total - current) / (current / elapsed));
      progressEtaEl.textContent = remaining >= 60
        ? t('etaRemaining', Math.floor(remaining / 60), remaining % 60)
        : t('etaRemainingSeconds', remaining);
    } else { progressEtaEl.textContent = ''; }
  });

  function updateRatio(totalFollowing, totalFollowers) {
    if (totalFollowing === 0) { ratioValueEl.textContent = '-'; ratioValueEl.className = 'stat-value'; return; }
    const ratio = totalFollowers / totalFollowing;
    ratioValueEl.textContent = ratio.toFixed(2);
    ratioValueEl.className = `stat-value ${ratio < 0.5 ? 'ratio-bad' : ratio < 1 ? 'ratio-warning' : 'ratio-good'}`;
  }

  function setDelta(el, diff, invertColor = false) {
    if (!el) return;
    if (diff === 0 || isNaN(diff)) { el.textContent = ''; return; }
    el.textContent = `${diff > 0 ? '+' : ''}${diff}`;
    el.className = invertColor ? `stat-delta ${diff > 0 ? 'down' : 'up'}` : `stat-delta ${diff > 0 ? 'up' : 'down'}`;
  }

  function clearDeltas() {
    [deltaFollowing, deltaFollower, deltaMutual, deltaNotFollowing, deltaFollowerOnly].forEach(el => { if (el) el.textContent = ''; });
  }

  function updateStatDeltas(tf, tfl, mc, nfc, foc) {
    const snapshots = getSnapshots();
    if (snapshots.length < 1) { clearDeltas(); return; }
    const prev = snapshots[0];
    setDelta(deltaFollowing, tf - prev.following);
    setDelta(deltaFollower, tfl - prev.followers);
    setDelta(deltaMutual, mc - (prev.following - prev.notFollowingBack));
    setDelta(deltaNotFollowing, nfc - prev.notFollowingBack, true);
    if (deltaFollowerOnly) setDelta(deltaFollowerOnly, foc - (prev.followers - (prev.following - prev.notFollowingBack)));
  }

  function showFollowerChanges(currentFollowers) {
    const snapshots = getSnapshots();
    if (snapshots.length === 0 || !currentFollowers) { hide(followerChangesEl); return; }
    const prev = snapshots[0];
    if (!prev.followerUsernames) { hide(followerChangesEl); return; }
    const prevSet = new Set(prev.followerUsernames);
    const currUsernames = currentFollowers.map(u => u.username);
    const currSet = new Set(currUsernames);
    const lost = prev.followerUsernames.filter(u => !currSet.has(u));
    const gained = currUsernames.filter(u => !prevSet.has(u));
    if (lost.length === 0 && gained.length === 0) {
      followerChangesEl.textContent = '';
      const span = document.createElement('span');
      span.className = 'no-changes'; span.textContent = t('noChanges');
      followerChangesEl.appendChild(span); show(followerChangesEl); return;
    }
    const details = document.createElement('details'); details.open = true;
    const summary = document.createElement('summary'); summary.textContent = t('followerChanges');
    details.appendChild(summary);
    if (gained.length > 0) {
      const gainDiv = document.createElement('div'); gainDiv.className = 'change-gained'; gainDiv.textContent = t('newFollowers', gained.length); details.appendChild(gainDiv);
      const gainList = document.createElement('div'); gainList.className = 'changes-list';
      gained.forEach((u, i) => { if (i > 0) gainList.appendChild(document.createTextNode(', ')); const a = document.createElement('a'); a.href = `https://www.instagram.com/${encodeURIComponent(u)}/`; a.target = '_blank'; a.rel = 'noopener'; a.textContent = `@${u}`; gainList.appendChild(a); });
      details.appendChild(gainList);
    }
    if (lost.length > 0) {
      const lostDiv = document.createElement('div'); lostDiv.className = 'change-lost'; lostDiv.textContent = t('lostFollowers', lost.length); details.appendChild(lostDiv);
      const lostList = document.createElement('div'); lostList.className = 'changes-list';
      lost.forEach((u, i) => { if (i > 0) lostList.appendChild(document.createTextNode(', ')); const a = document.createElement('a'); a.href = `https://www.instagram.com/${encodeURIComponent(u)}/`; a.target = '_blank'; a.rel = 'noopener'; a.textContent = `@${u}`; lostList.appendChild(a); });
      details.appendChild(lostList);
    }
    followerChangesEl.textContent = ''; followerChangesEl.appendChild(details); show(followerChangesEl);
  }

  function applyFreeLimit(data) {
    if (state.userTier === 'free' && data.notFollowingBack.length > FREE_ANALYSIS_LIMIT) {
      state.fullNotFollowingBackCount = data.notFollowingBack.length;
      data.notFollowingBack = data.notFollowingBack.slice(0, FREE_ANALYSIS_LIMIT);
    } else { state.fullNotFollowingBackCount = data.notFollowingBack.length; }
  }

  function showFreeLimitBanner() {
    if (state.userTier === 'free' && state.fullNotFollowingBackCount > FREE_ANALYSIS_LIMIT) {
      freeLimitBanner.textContent = '';
      freeLimitBanner.appendChild(document.createTextNode(t('freeAnalysisLimit', FREE_ANALYSIS_LIMIT, state.fullNotFollowingBackCount)));
      const hint = document.createElement('span'); hint.className = 'upgrade-hint'; hint.textContent = t('upgradeToPremium');
      freeLimitBanner.appendChild(hint); show(freeLimitBanner);
    } else { hide(freeLimitBanner); }
  }

  function displayResults(totalFollowing, totalFollowers) {
    followingCountEl.textContent = totalFollowing; followerCountEl.textContent = totalFollowers;
    mutualCountEl.textContent = state.analysisData.mutual.length;
    notFollowingCountEl.textContent = state.fullNotFollowingBackCount || state.analysisData.notFollowingBack.length;
    if (followerOnlyCountEl) followerOnlyCountEl.textContent = state.analysisData.followerOnly.length;
    updateRatio(totalFollowing, totalFollowers);
    if (tabFollowingCount) tabFollowingCount.textContent = totalFollowing;
    if (tabFollowerCount) tabFollowerCount.textContent = totalFollowers;
    if (tabMutualCount) tabMutualCount.textContent = state.analysisData.mutual.length;
    if (tabNotFollowingCount) tabNotFollowingCount.textContent = state.fullNotFollowingBackCount || state.analysisData.notFollowingBack.length;
    if (tabFollowerOnlyCount) tabFollowerOnlyCount.textContent = state.analysisData.followerOnly.length;
    if (tabWhitelistCount) tabWhitelistCount.textContent = getWhitelist().size;
    // Enable users view and show results on dashboard
    state.enableUsersView();
    state.switchTab('not-following');
    showFreeLimitBanner();
  }

  function updateGrowthAndRetention(totalFollowers) {
    const snapshots = getSnapshots();
    if (snapshots.length >= 2) {
      const oldest = snapshots[Math.min(snapshots.length - 1, 6)];
      const daysDiff = (new Date(snapshots[0].date) - new Date(oldest.date)) / 86400000;
      if (daysDiff > 0) {
        const daily = (totalFollowers - oldest.followers) / daysDiff;
        growthValueEl.textContent = t('growthDaily', daily);
        growthValueEl.className = `stat-value ${daily >= 0 ? 'ratio-good' : 'ratio-bad'}`;
      }
    }
    if (snapshots.length >= 2 && snapshots[0].followerUsernames) {
      const prev = snapshots.find((s, i) => i > 0 && s.followerUsernames);
      if (prev?.followerUsernames) {
        const currFollowers = state.analysisData?.followers?.map(u => u.username) || [];
        const retained = prev.followerUsernames.filter(u => new Set(currFollowers).has(u)).length;
        const rate = prev.followerUsernames.length > 0 ? Math.round((retained / prev.followerUsernames.length) * 100) : 100;
        retentionValueEl.textContent = `${rate}%`;
        retentionValueEl.className = `stat-value ${rate >= 95 ? 'ratio-good' : rate >= 85 ? 'ratio-warning' : 'ratio-bad'}`;
      }
    }
  }

  function autoWhitelistMutuals() {
    if (!getAutoWhitelist() || !state.analysisData?.mutual) return;
    const wl = getWhitelist(); let added = 0;
    state.analysisData.mutual.forEach(u => { if (!wl.has(u.id)) { wl.add(u.id); added++; } });
    if (added > 0) { saveWhitelist(wl); if (tabWhitelistCount) tabWhitelistCount.textContent = wl.size; }
  }

  function refreshSafetyGauge() {
    if (!safetyGaugeContainer) return;
    safetyGaugeContainer.textContent = '';
    safetyGaugeContainer.appendChild(renderSafetyGauge());
  }

  async function fetchMaliciousUsersList() {
    try {
      const res = await chrome.runtime.sendMessage({ action: 'FETCH_MALICIOUS_USERS' });
      if (res.success && res.data) { setMaliciousUsers(res.data); if (state.analysisData) state.refreshList(); state.showSnapshots?.(); }
    } catch { /* ignore */ }
  }

  function hydrateFromCache(cached) {
    state.analysisData = { following: cached.following, followers: cached.followers, notFollowingBack: cached.notFollowingBack, mutual: cached.mutual, followerOnly: cached.followerOnly || [] };
    applyFreeLimit(state.analysisData);
  }

  async function startAnalysis() {
    const cached = getCachedAnalysis();
    if (cached) { hydrateFromCache(cached); hide(errorSection); buildUnstableUsers(); displayResults(cached.totalFollowing, cached.totalFollowers); return; }
    hide(errorSection); show(progressSection); hide(mainNav);
    progressMessage.textContent = t('startingAnalysis'); progressBar.style.width = '0%'; progressPercent.textContent = '0%';
    progressCount.textContent = ''; progressStep.textContent = '1 / 2'; progressEtaEl.textContent = '';
    progressStartTime = Date.now(); currentPhase = '';
    try {
      const response = await chrome.runtime.sendMessage({ action: 'ANALYZE' });
      if (!response.success) throw new Error(response.error);
      const { following, followers, notFollowingBack, totalFollowing, totalFollowers } = response.data;
      const followerIds = new Set(followers.map(u => u.id));
      const followingIds = new Set(following.map(u => u.id));
      const mutual = following.filter(u => followerIds.has(u.id));
      const followerOnly = followers.filter(u => !followingIds.has(u.id));
      state.analysisData = { following, followers, notFollowingBack, mutual, followerOnly };
      applyFreeLimit(state.analysisData); recordFirstSeen([...following, ...followers]);
      showFollowerChanges(followers);
      updateStatDeltas(totalFollowing, totalFollowers, mutual.length, notFollowingBack.length, followerOnly.length);
      setCachedAnalysis(following, followers, notFollowingBack, mutual, followerOnly, totalFollowing, totalFollowers);
      hide(progressSection); show(mainNav); fetchMaliciousUsersList();
      saveSnapshot(totalFollowing, totalFollowers, notFollowingBack.length, followers.map(u => u.username), following.map(u => u.username));
      displayResults(totalFollowing, totalFollowers); buildUnstableUsers(); autoWhitelistMutuals();
      updateGrowthAndRetention(totalFollowers);
      chrome.runtime.sendMessage({ action: 'CLEAR_BADGE' }).catch(() => {});
    } catch (error) {
      hide(progressSection); show(mainNav);
      errorMessage.textContent = getErrorText(error.message);
      const instaLink = document.getElementById('instagram-link');
      if (instaLink) { error.message === 'NOT_LOGGED_IN' ? show(instaLink) : hide(instaLink); }
      show(errorSection);
    }
  }

  startBtn.addEventListener('click', () => { sessionStorage.removeItem(CACHE_KEY); startAnalysis(); });
  retryBtn.addEventListener('click', () => { hide(errorSection); sessionStorage.removeItem(CACHE_KEY); startAnalysis(); });

  function loadSnapshotView(index) {
    const result = state.buildSnapshotAnalysis?.(index);
    if (!result) return;
    state.analysisData = result.analysisData; const s = result.stats;
    followingCountEl.textContent = s.following; followerCountEl.textContent = s.followers;
    mutualCountEl.textContent = s.mutual; notFollowingCountEl.textContent = s.notFollowingBack;
    if (followerOnlyCountEl) followerOnlyCountEl.textContent = s.followerOnly;
    if (tabWhitelistCount) tabWhitelistCount.textContent = getWhitelist().size;
    updateRatio(s.following, s.followers); clearDeltas();
    if (tabFollowingCount) tabFollowingCount.textContent = s.following;
    if (tabFollowerCount) tabFollowerCount.textContent = s.followers;
    if (tabMutualCount) tabMutualCount.textContent = s.mutual;
    if (tabNotFollowingCount) tabNotFollowingCount.textContent = s.notFollowingBack;
    if (tabFollowerOnlyCount) tabFollowerOnlyCount.textContent = s.followerOnly;
    hide(errorSection); hide(progressSection); hide(followerChangesEl);
    state.enableUsersView();
    state.switchTab('not-following');
  }

  return { startAnalysis, refreshSafetyGauge, fetchMaliciousUsersList, hydrateFromCache, displayResults, clearDeltas, updateRatio, loadSnapshotView };
}
