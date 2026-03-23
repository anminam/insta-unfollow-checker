// ── Confirm Modal Component ──

/**
 * Show a confirm dialog using the existing #confirm-modal in tab.html.
 * @param {string} message
 * @returns {Promise<boolean>}
 */
export function showConfirm(message) {
  return new Promise((resolve) => {
    const modal = document.getElementById('confirm-modal');
    const msg = document.getElementById('confirm-message');
    const yesBtn = document.getElementById('confirm-yes');
    const noBtn = document.getElementById('confirm-no');

    if (!modal || !msg || !yesBtn || !noBtn) {
      resolve(false);
      return;
    }

    msg.textContent = message;
    modal.classList.remove('hidden');

    const cleanup = (result) => {
      modal.classList.add('hidden');
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
