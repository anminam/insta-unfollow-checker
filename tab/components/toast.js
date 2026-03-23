// ── Toast Notification Component ──

/**
 * Show a toast notification.
 * @param {string} message
 * @param {string} [type=''] - 'success' | 'error' | ''
 * @param {{ label: string, callback: Function }|null} [action=null]
 */
export function showToast(message, type = '', action = null) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast${type ? ` toast-${type}` : ''}`;
  toast.textContent = message;

  if (action) {
    const btn = document.createElement('button');
    btn.className = 'toast-action';
    btn.textContent = action.label;
    btn.addEventListener('click', () => {
      action.callback();
      toast.remove();
    });
    toast.appendChild(btn);
  }

  container.appendChild(toast);
  const duration = action ? 5000 : 3000;
  setTimeout(() => {
    if (toast.parentNode) toast.remove();
  }, duration);
}
