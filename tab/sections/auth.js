// ── Auth (Google Login, Tier, Auth Gate) ──
// v5.0: No more start-section toggle, uses view system

import { t } from '../modules/i18n.js';
import { isOnboardingDone } from '../storage/preferences.js';
import { getCachedAnalysis } from '../storage/cache.js';
import { show, hide } from '../modules/ui.js';
import { drawStatsChart } from '../modules/chart.js';
import { showOnboarding } from '../modules/onboarding.js';

export function setupAuth(els, state, { analysis, userActions, showSnapshots, initProfilePreview }) {
  const {
    authGate, mainApp, googleLoginBtn, authError, authEmailEl,
    headerAuth, logoutBtn, headerLoginBtn, headerGuest,
    userTierBadge, scheduledUnfollowBtn,
    autoAnalysisToggle, userListEl,
    settingsAccountEmail, settingsAccountTier, settingsAccountInfo,
    settingsAccountGuest, settingsLoginBtn, settingsLogoutBtn
  } = els;

  async function checkAuthState() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'GET_AUTH_STATUS' });
      if (response.success && response.data?.loggedIn) showMainApp(response.data.email, response.data.premium);
      else showMainApp(null, false);
    } catch { showMainApp(null, false); }
  }

  function showMainApp(email, premium) {
    hide(authGate); show(mainApp);
    state.userTier = premium ? 'premium' : 'free';
    if (email) {
      authEmailEl.textContent = email;
      show(headerAuth); hide(headerGuest);
      userTierBadge.textContent = premium ? t('premiumBadge') : t('freeBadge');
      userTierBadge.className = 'tier-badge ' + (premium ? 'premium' : 'free');
      show(userTierBadge);
    } else {
      hide(headerAuth); show(headerGuest);
    }
    premium ? scheduledUnfollowBtn.classList.remove('hidden') : scheduledUnfollowBtn.classList.add('hidden');
    // Settings account card
    if (email) {
      settingsAccountEmail.textContent = email;
      settingsAccountTier.textContent = premium ? t('premiumBadge') : t('freeBadge');
      settingsAccountTier.className = 'tier-badge ' + (premium ? 'premium' : 'free');
      show(settingsAccountInfo); hide(settingsAccountGuest);
      hide(settingsLoginBtn); show(settingsLogoutBtn);
    } else {
      hide(settingsAccountInfo); show(settingsAccountGuest);
      show(settingsLoginBtn); hide(settingsLogoutBtn);
    }
    initMainApp();
  }

  function initMainApp() {
    if (!isOnboardingDone()) showOnboarding();
    drawStatsChart(); showSnapshots(); userActions.showHistory(); userActions.showScheduledStatus();
    (async () => { try { const r = await chrome.runtime.sendMessage({ action: 'GET_AUTO_ANALYSIS_STATUS' }); autoAnalysisToggle.checked = r.data?.enabled || false; } catch { autoAnalysisToggle.checked = false; } })();
    analysis.refreshSafetyGauge(); initProfilePreview(userListEl);
    chrome.runtime.sendMessage({ action: 'CLEAR_BADGE' }).catch(() => {});
    userActions.resumeScheduled();
    // If cached analysis exists, hydrate and display on dashboard
    const cached = getCachedAnalysis();
    if (cached) {
      analysis.hydrateFromCache(cached);
      analysis.displayResults(cached.totalFollowing, cached.totalFollowers);
    }
  }

  async function doGoogleLogin() {
    try {
      const response = await Promise.race([chrome.runtime.sendMessage({ action: 'GOOGLE_LOGIN' }), new Promise((_, rej) => setTimeout(() => rej(new Error('LOGIN_TIMEOUT')), 30000))]);
      if (!response.success) throw new Error(response.error || 'GOOGLE_API_ERROR');
      showMainApp(response.data.email, response.data.premium);
    } catch (err) {
      const msg = err.message || '';
      const errorText = (msg.includes('canceled') || msg.includes('cancelled') || msg.includes('The user did not approve')) ? t('GOOGLE_LOGIN_CANCELLED') : (t(msg) || t('GOOGLE_API_ERROR'));
      authError.textContent = errorText;
      show(authError);
    }
  }

  // ── Event Listeners ──

  googleLoginBtn.addEventListener('click', async () => {
    googleLoginBtn.disabled = true; googleLoginBtn.querySelector('span').textContent = t('loggingIn'); hide(authError);
    await doGoogleLogin();
    googleLoginBtn.disabled = false; googleLoginBtn.querySelector('span').textContent = t('googleLogin');
  });

  if (headerLoginBtn) {
    headerLoginBtn.addEventListener('click', async () => {
      headerLoginBtn.disabled = true;
      await doGoogleLogin();
      headerLoginBtn.disabled = false;
    });
  }

  logoutBtn.addEventListener('click', async () => {
    try { await chrome.runtime.sendMessage({ action: 'GOOGLE_LOGOUT' }); } catch { /* ignore */ }
    state.userTier = 'free'; showMainApp(null, false);
  });

  // Settings view login/logout
  if (settingsLoginBtn) {
    settingsLoginBtn.addEventListener('click', async () => {
      settingsLoginBtn.disabled = true;
      await doGoogleLogin();
      settingsLoginBtn.disabled = false;
    });
  }
  if (settingsLogoutBtn) {
    settingsLogoutBtn.addEventListener('click', async () => {
      try { await chrome.runtime.sendMessage({ action: 'GOOGLE_LOGOUT' }); } catch { /* ignore */ }
      state.userTier = 'free'; showMainApp(null, false);
    });
  }

  autoAnalysisToggle.addEventListener('change', async () => {
    try { await chrome.runtime.sendMessage({ action: 'SET_AUTO_ANALYSIS', data: { enabled: autoAnalysisToggle.checked, periodMinutes: 1440 } }); }
    catch { autoAnalysisToggle.checked = !autoAnalysisToggle.checked; }
  });

  return { checkAuthState, showMainApp };
}
