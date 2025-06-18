// Estado inicial
let currentCursor = {
  active: false,
  type: "",
  size: 32,
  customSvg: null,
  colorEnabled: false,
  cursorColor: "#000000",
  cursorOpacity: 100
};

// Aplicar cursor
function applyCursor() {
  // Limpiar estilos previos de manera exhaustiva
  const existingStyles = document.querySelectorAll('style[id="bigmouse-style"]');
  existingStyles.forEach(style => style.remove());
  
  // Resetear cursor por defecto
  document.body.style.cursor = "";
  document.documentElement.style.cursor = "";

  if (!currentCursor.active) {
    return;
  }

  // Función para modificar el SVG con el color seleccionado
  const applyColorToSvg = (svgText) => {
    if (!currentCursor.colorEnabled) {
      return svgText;
    }
    
    const hexToRgb = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return {r, g, b};
    };
    
    const rgb = hexToRgb(currentCursor.cursorColor);
    const opacity = currentCursor.cursorOpacity / 100;
    
    return svgText
      .replace(/fill:rgb\([^)]+\)/g, `fill:rgb(${rgb.r},${rgb.g},${rgb.b})`)
      .replace(/fill-opacity:[^;]+/g, `fill-opacity:${opacity}`)
      .replace(/fill="#[^"]+"/g, `fill="${currentCursor.cursorColor}"`)
      .replace(/fill-opacity="[^"]+"/g, `fill-opacity="${opacity}"`);
  };

  const isCustomUpload = currentCursor.type === "custom-upload" && currentCursor.customSvg;
  
  if (isCustomUpload) {
    try {
      let svgText = currentCursor.customSvg;
      svgText = applyColorToSvg(svgText);
      
      const encoded = encodeURIComponent(
        svgText
          .replace(/width="[^"]+"/, `width="${currentCursor.size}"`)
          .replace(/height="[^"]+"/, `height="${currentCursor.size}"`)
      );
      const dataUrl = `url("data:image/svg+xml;charset=utf-8,${encoded}") ${currentCursor.size / 2} ${currentCursor.size / 2}, auto`;
      
      const style = document.createElement("style");
      style.id = "bigmouse-style";
      style.textContent = `
        body, body * {
          cursor: ${dataUrl} !important;
        }
      `;
      document.head.appendChild(style);
    } catch (error) {
      console.error("Error applying custom cursor:", error);
    }
  } else if (currentCursor.type) {
    const cursorPath = `media/${currentCursor.type}.svg`;
    
    fetch(chrome.runtime.getURL(cursorPath))
      .then(res => res.ok ? res.text() : Promise.reject("Cursor not found"))
      .then(svgText => {
        let modifiedSvg = applyColorToSvg(svgText);
        const encoded = encodeURIComponent(
          modifiedSvg
            .replace(/width="[^"]+"/, `width="${currentCursor.size}"`)
            .replace(/height="[^"]+"/, `height="${currentCursor.size}"`)
        );
        const dataUrl = `url("data:image/svg+xml;charset=utf-8,${encoded}") ${currentCursor.size / 2} ${currentCursor.size / 2}, auto`;
        
        const style = document.createElement("style");
        style.id = "bigmouse-style";
        style.textContent = `
          body, body * {
            cursor: ${dataUrl} !important;
          }
        `;
        document.head.appendChild(style);
      })
      .catch(err => {
        console.error("Error loading cursor:", err);
      });
  }
}

// Escuchar mensajes del popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "update-cursor") {
    currentCursor = {
      active: message.state.active,
      type: message.state.active ? message.state.selectedCursor : "",
      size: message.state.size,
      customSvg: message.state.customCursorSvg,
      colorEnabled: message.state.colorEnabled,
      cursorColor: message.state.cursorColor,
      cursorOpacity: message.state.cursorOpacity
    };
    applyCursor();
    sendResponse({success: true});
  }
  return true;
});

// Cargar estado inicial desde storage.local
chrome.storage.local.get(
  ["cursorType", "selectedCursor", "cursorSize", "customCursorSvg", "colorEnabled", "cursorColor", "cursorOpacity"],
  ({ cursorType, selectedCursor, cursorSize, customCursorSvg, colorEnabled, cursorColor, cursorOpacity }) => {
    currentCursor = {
      active: cursorType === "custom",
      type: cursorType === "custom" ? selectedCursor || "cursor-1" : "",
      size: cursorSize || 32,
      customSvg: customCursorSvg || null,
      colorEnabled: colorEnabled || false,
      cursorColor: cursorColor || "#000000",
      cursorOpacity: cursorOpacity || 100
    };
    applyCursor();
  }
);

// Escuchar cambios en storage.local
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local") {
    let needsUpdate = false;
    
    if (changes.cursorType) {
      currentCursor.active = changes.cursorType.newValue === "custom";
      currentCursor.type = currentCursor.active ? (changes.selectedCursor?.newValue || currentCursor.type) : "";
      needsUpdate = true;
    }
    
    if (changes.selectedCursor && currentCursor.active) {
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
    
    if (changes.colorEnabled) {
      currentCursor.colorEnabled = changes.colorEnabled.newValue;
      needsUpdate = true;
    }
    
    if (changes.cursorColor) {
      currentCursor.cursorColor = changes.cursorColor.newValue;
      needsUpdate = true;
    }
    
    if (changes.cursorOpacity) {
      currentCursor.cursorOpacity = changes.cursorOpacity.newValue;
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      applyCursor();
    }
  }
});