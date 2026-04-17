const btn = document.getElementById("action-btn");
const status = document.getElementById("status");

btn.addEventListener("click", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  status.textContent = `Aba ativa: ${tab?.title ?? "desconhecida"}`;
});
