chrome.runtime.onInstalled.addListener(() => {
  console.log("Extensão instalada.");

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

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "PING") {
    sendResponse({ type: "PONG", from: "background" });
  }
  return true;
});
