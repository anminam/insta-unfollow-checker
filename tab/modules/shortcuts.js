// ── Keyboard Shortcuts ──

import { t } from './i18n.js';
import { isOnboardingDone, setOnboardingDone } from '../storage/preferences.js';
import { show, hide } from './ui.js';

export function initShortcuts(els, state) {
  const { resultSection, selectAllCheckbox, filterSearchInput } = els;
  const $ = (id) => document.getElementById(id);

  document.addEventListener('keydown', (e) => {
    // Ctrl+A: select all (not-following tab only)
    if ((e.ctrlKey || e.metaKey) && e.key === 'a' && !resultSection.classList.contains('hidden') && state.currentTab === 'not-following') {
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
    // Ctrl+F: focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f' && !resultSection.classList.contains('hidden')) {
      if (document.activeElement !== filterSearchInput) { e.preventDefault(); filterSearchInput.focus(); filterSearchInput.select(); }
    }
  });
}
