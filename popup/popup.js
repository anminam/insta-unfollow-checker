document.getElementById('popup-tagline').textContent = chrome.i18n.getMessage('popupTagline');
document.getElementById('open-btn').textContent = chrome.i18n.getMessage('popupButton');

document.getElementById('open-btn').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('tab/tab.html') });
  window.close();
});
