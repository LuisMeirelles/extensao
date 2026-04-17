const API_BASE_URL = 'https://presuppurative-uncoordinately-jacquelyne.ngrok-free.dev';

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type !== 'KIWIFY_TOKEN' || typeof message.token !== 'string') return;
  fetch(`${API_BASE_URL}/kiwify/v1/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: message.token }),
  }).catch(() => {});
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.action.disable();

  chrome.declarativeContent.onPageChanged.removeRules(undefined, () => {
    chrome.declarativeContent.onPageChanged.addRules([
      {
        conditions: [
          new chrome.declarativeContent.PageStateMatcher({
            pageUrl: { hostEquals: "dashboard.kiwify.com", schemes: ["https"] },
          }),
        ],
        actions: [new chrome.declarativeContent.ShowAction()],
      },
    ]);
  });
});
