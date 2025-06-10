// Recuperar el estado guardado al cargar
chrome.storage.sync.get("cursorType", ({ cursorType }) => {
  if (cursorType === "custom") {
    const cssUrl = chrome.runtime.getURL("cursor.css");
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssUrl;
    link.id = "cursor-style";
    document.head.appendChild(link);
    document.body.setAttribute("data-cursor", "custom");
  } else {
    document.body.setAttribute("data-cursor", "default");
  }
});


// Escuchar cambios desde el popup
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "set-cursor" && message.type) {
    document.body.setAttribute("data-cursor", message.type);
    chrome.storage.sync.set({ cursorType: message.type });

    const existingLink = document.getElementById("cursor-style");

    if (message.type === "custom" && !existingLink) {
      const cssUrl = chrome.runtime.getURL("cursor.css");
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = cssUrl;
      link.id = "cursor-style";
      document.head.appendChild(link);
    }

    if (message.type === "default" && existingLink) {
      existingLink.remove();
    }
  }
});