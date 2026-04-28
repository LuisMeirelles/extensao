window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  const data = event.data;
  if (data?.type !== 'KIWIFY_TOKEN' || typeof data.token !== 'string') return;
  chrome.runtime.sendMessage({ type: 'KIWIFY_TOKEN', token: data.token, deviceToken: data.deviceToken, store: data.store });
});
