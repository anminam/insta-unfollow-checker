// ── Onboarding Overlay ──

import { t } from './i18n.js';
import { setOnboardingDone } from '../storage/preferences.js';
import { show, hide } from './ui.js';

export function showOnboarding() {
  const overlay = document.getElementById('onboarding-overlay');
  if (!overlay) return;

  let step = 0;
  const steps = overlay.querySelectorAll('.onboarding-step');
  const dots = overlay.querySelectorAll('.onboarding-dot');
  const prevBtn = document.getElementById('onboarding-prev');
  const nextBtn = document.getElementById('onboarding-next');

  function update() {
    steps.forEach((s, i) => s.classList.toggle('hidden', i !== step));
    dots.forEach((d, i) => d.classList.toggle('active', i === step));
    prevBtn.classList.toggle('hidden', step === 0);
    nextBtn.textContent = step === steps.length - 1 ? t('onboardingDone') : t('onboardingNext');
  }

  prevBtn.addEventListener('click', () => { if (step > 0) { step--; update(); } });
  nextBtn.addEventListener('click', () => {
    if (step < steps.length - 1) { step++; update(); }
    else { hide(overlay); setOnboardingDone(); }
  });

  update();
  show(overlay);
}
