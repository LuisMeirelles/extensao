chrome.runtime.onInstalled.addListener(() => {
  console.log("Extensão instalada.");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type === "PING") {
    sendResponse({ type: "PONG", from: "background" });
  }
  return true;
});
