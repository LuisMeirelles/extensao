console.log("Content script carregado em:", window.location.href);

chrome.runtime.sendMessage({ type: "PING" }, (response) => {
  if (chrome.runtime.lastError) return;
  console.log("Resposta do background:", response);
});
