// ── Settings (interval, daily limit, toggles) ──

import { getScheduledInterval, saveScheduledInterval, getScheduledDailyLimit, saveScheduledDailyLimit, getSmartSchedule, saveSmartSchedule } from '../storage/preferences.js';
import { getAutoWhitelist, saveAutoWhitelist } from '../storage/whitelist.js';

export function setupSettings(els) {
  const {
    scheduledIntervalSlider, scheduledIntervalValue,
    scheduledDailyLimitInput, autoWhitelistToggle, smartScheduleToggle
  } = els;

  if (scheduledIntervalSlider) {
    scheduledIntervalSlider.value = getScheduledInterval();
    scheduledIntervalValue.textContent = `${getScheduledInterval()}`;
    scheduledIntervalSlider.addEventListener('input', () => {
      const v = parseInt(scheduledIntervalSlider.value, 10);
      scheduledIntervalValue.textContent = `${v}`;
      saveScheduledInterval(v);
    });
  }

  if (scheduledDailyLimitInput) {
    scheduledDailyLimitInput.value = getScheduledDailyLimit();
    scheduledDailyLimitInput.addEventListener('change', () => saveScheduledDailyLimit(parseInt(scheduledDailyLimitInput.value, 10) || 50));
  }

  autoWhitelistToggle.checked = getAutoWhitelist();
  autoWhitelistToggle.addEventListener('change', () => saveAutoWhitelist(autoWhitelistToggle.checked));

  smartScheduleToggle.checked = getSmartSchedule();
  smartScheduleToggle.addEventListener('change', () => saveSmartSchedule(smartScheduleToggle.checked));
}
