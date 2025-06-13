// Estado inicial
let currentCursor = {
  active: false,
  type: "default",
  size: 32,
  customSvg: null
};

// Aplicar cursor
function applyCursor() {
  // Limpiar estilos previos
  const existingStyle = document.getElementById("cursorxl-style");
  if (existingStyle) existingStyle.remove();

  if (!currentCursor.active) {
    return; // Si no está activo, no hacer nada (usar cursor por defecto)
  }

  // Determinar qué cursor usar
  const isCustomUpload = currentCursor.type === "custom-upload" && currentCursor.customSvg;
  
  if (isCustomUpload) {
    // Cursor personalizado (SVG subido)
    const encoded = encodeURIComponent(
      currentCursor.customSvg
        .replace(/width="[^"]+"/, `width="${currentCursor.size}"`)
        .replace(/height="[^"]+"/, `height="${currentCursor.size}"`)
    );
    const dataUrl = `url("data:image/svg+xml;charset=utf-8,${encoded}") ${currentCursor.size / 2} ${currentCursor.size / 2}, auto`;
    
    const style = document.createElement("style");
    style.id = "cursorxl-style";
    style.textContent = `
      body, body * {
        cursor: ${dataUrl} !important;
      }
    `;
    document.head.appendChild(style);
  } else {
    // Cursor predefinido (de los botones)
    const cursorPath = `media/${currentCursor.type}.svg`;
    
    fetch(chrome.runtime.getURL(cursorPath))
      .then(res => {
        if (!res.ok) throw new Error("Cursor no encontrado");
        return res.text();
      })
      .then(svgText => {
        const encoded = encodeURIComponent(
          svgText
            .replace(/width="[^"]+"/, `width="${currentCursor.size}"`)
            .replace(/height="[^"]+"/, `height="${currentCursor.size}"`)
        );
        const dataUrl = `url("data:image/svg+xml;charset=utf-8,${encoded}") ${currentCursor.size / 2} ${currentCursor.size / 2}, auto`;
        
        const style = document.createElement("style");
        style.id = "cursorxl-style";
        style.textContent = `
          body, body * {
            cursor: ${dataUrl} !important;
          }
        `;
        document.head.appendChild(style);
      })
      .catch(err => {
        console.error("Error cargando cursor:", err);
        // Si falla, volver al cursor por defecto
        const existingStyle = document.getElementById("cursorxl-style");
        if (existingStyle) existingStyle.remove();
      });
  }
}

// Escuchar mensajes del popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "update-cursor") {
    currentCursor = {
      active: message.state.active,
      type: message.state.selectedCursor,
      size: message.state.size,
      customSvg: message.state.customCursorSvg
    };
    applyCursor();
  }
});

// Cargar estado inicial
chrome.storage.sync.get(
  ["cursorType", "selectedCursor", "cursorSize", "customCursorSvg"],
  ({ cursorType, selectedCursor, cursorSize, customCursorSvg }) => {
    currentCursor = {
      active: cursorType === "custom",
      type: selectedCursor || "cursor-1",
      size: cursorSize || 32,
      customSvg: customCursorSvg || null
    };
    applyCursor();
  }
);

// Escuchar cambios en storage
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync") {
    let needsUpdate = false;
    
    if (changes.cursorType) {
      currentCursor.active = changes.cursorType.newValue === "custom";
      needsUpdate = true;
    }
    
    if (changes.selectedCursor) {
      currentCursor.type = changes.selectedCursor.newValue;
      needsUpdate = true;
    }
    
    if (changes.cursorSize) {
      currentCursor.size = changes.cursorSize.newValue;
      needsUpdate = true;
    }
    
    if (changes.customCursorSvg) {
      currentCursor.customSvg = changes.customCursorSvg.newValue;
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      applyCursor();
    }
  }
});