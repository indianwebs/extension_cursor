const switchInput = document.getElementById("activeSwitch");

// Sincroniza el estado del switch al abrir el popup
chrome.storage.sync.get("cursorType", ({ cursorType }) => {
  switchInput.checked = cursorType === "custom";
});

// Escucha cambios del switch
switchInput.addEventListener("change", () => {
  const newType = switchInput.checked ? "custom" : "default";

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "set-cursor",
      type: newType
    });
  });
});