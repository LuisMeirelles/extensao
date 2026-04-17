const nameInput = document.getElementById("name-input");
const saveBtn = document.getElementById("save-btn");
const saveStatus = document.getElementById("save-status");

chrome.storage.sync.get({ name: "" }, ({ name }) => {
  nameInput.value = name;
});

saveBtn.addEventListener("click", () => {
  chrome.storage.sync.set({ name: nameInput.value }, () => {
    saveStatus.textContent = "Salvo!";
    setTimeout(() => (saveStatus.textContent = ""), 1500);
  });
});
