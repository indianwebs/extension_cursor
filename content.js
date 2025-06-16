// Estado inicial
let currentCursor = {
  active: false,
  type: "default",
  size: 32,
  customSvg: null,
  colorEnabled: false,
  cursorColor: "#000000",
  cursorOpacity: 100
};

// Aplicar cursor
function applyCursor() {
  // Limpiar estilos previos
  const existingStyle = document.getElementById("bigmouse-style");
  if (existingStyle) existingStyle.remove();

  if (!currentCursor.active) {
    return; // Si no está activo, no hacer nada (usar cursor por defecto)
  }

  // Función para modificar el SVG con el color seleccionado
  const applyColorToSvg = (svgText) => {
    if (!currentCursor.colorEnabled) {
      return svgText;
    }
    
    // Convertir el color hexadecimal a RGB
    const hexToRgb = (hex) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return {r, g, b};
    };
    
    const rgb = hexToRgb(currentCursor.cursorColor);
    const opacity = currentCursor.cursorOpacity / 100;
    
    // Modificar los paths del SVG para aplicar el color
    return svgText
      .replace(/fill:rgb\([^)]+\)/g, `fill:rgb(${rgb.r},${rgb.g},${rgb.b})`)
      .replace(/fill-opacity:[^;]+/g, `fill-opacity:${opacity}`)
      .replace(/fill="#[^"]+"/g, `fill="${currentCursor.cursorColor}"`)
      .replace(/fill-opacity="[^"]+"/g, `fill-opacity="${opacity}"`);
  };

  // Determinar qué cursor usar
  const isCustomUpload = currentCursor.type === "custom-upload" && currentCursor.customSvg;
  
  if (isCustomUpload) {
    // Cursor personalizado (SVG subido)
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
  } else {
    // Cursor predefinido (de los botones)
    const cursorPath = `media/${currentCursor.type}.svg`;
    
    fetch(chrome.runtime.getURL(cursorPath))
      .then(res => {
        if (!res.ok) throw new Error("Cursor no encontrado");
        return res.text();
      })
      .then(svgText => {
        let modifiedSvg = svgText;
        modifiedSvg = applyColorToSvg(modifiedSvg);
        
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
        console.error("Error cargando cursor:", err);
        // Si falla, volver al cursor por defecto
        const existingStyle = document.getElementById("bigmouse-style");
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
      customSvg: message.state.customCursorSvg,
      colorEnabled: message.state.colorEnabled,
      cursorColor: message.state.cursorColor,
      cursorOpacity: message.state.cursorOpacity
    };
    applyCursor();
  }
});

// Cargar estado inicial desde storage.local
chrome.storage.local.get(
  ["cursorType", "selectedCursor", "cursorSize", "customCursorSvg", "colorEnabled", "cursorColor", "cursorOpacity"],
  ({ cursorType, selectedCursor, cursorSize, customCursorSvg, colorEnabled, cursorColor, cursorOpacity }) => {
    currentCursor = {
      active: cursorType === "custom",
      type: selectedCursor || "cursor-1",
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