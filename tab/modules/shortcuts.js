// ── Keyboard Shortcuts ──
// v5.0: Uses view system instead of resultSection

import { isOnboardingDone, setOnboardingDone } from '../storage/preferences.js';
import { hide } from './ui.js';

export function initShortcuts(els, state) {
  const { selectAllCheckbox, filterSearchInput } = els;
  const $ = (id) => document.getElementById(id);

  document.addEventListener('keydown', (e) => {
    // Ctrl+A: select all (not-following tab, users view only)
    if ((e.ctrlKey || e.metaKey) && e.key === 'a' && state.currentView === 'users' && state.currentTab === 'not-following') {
      if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault(); selectAllCheckbox.checked = !selectAllCheckbox.checked; selectAllCheckbox.dispatchEvent(new Event('change'));
      }
    }
    // Escape: close modals/overlays
    if (e.key === 'Escape') {
      const dynOverlay = document.querySelector('.modal-overlay:not(.hidden):not(#confirm-modal):not(#memo-modal):not(#compare-modal)');
      if (dynOverlay && !dynOverlay.id) { dynOverlay.remove(); return; }
      if (!$('confirm-modal').classList.contains('hidden')) $('confirm-no').click();
      else if (!$('memo-modal').classList.contains('hidden')) $('memo-cancel').click();
      else if (!$('compare-modal').classList.contains('hidden')) $('compare-close').click();
      else if ($('onboarding-overlay') && !$('onboarding-overlay').classList.contains('hidden')) { hide($('onboarding-overlay')); setOnboardingDone(); }
    }
    // Ctrl+F: focus search (switch to users view if needed)
    if ((e.ctrlKey || e.metaKey) && e.key === 'f' && state.analysisData) {
      e.preventDefault();
      if (state.currentView !== 'users') state.switchView('users');
      filterSearchInput.focus(); filterSearchInput.select();
    }
  });
}
