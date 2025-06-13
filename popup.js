const switchInput = document.getElementById("activeSwitch");
const sizeSlider = document.getElementById("cursorSize");
const uploadInput = document.getElementById("uploadCursor");
const cursorGrid = document.querySelector(".grid-cursor");

// Estado inicial
let currentState = {
  active: false,
  selectedCursor: "cursor-1",
  size: 32,
  customCursorSvg: null
};

// Cargar estado desde storage
function loadState() {
  chrome.storage.sync.get(
    ["cursorType", "selectedCursor", "cursorSize", "customCursorSvg"],
    ({ cursorType, selectedCursor, cursorSize, customCursorSvg }) => {
      currentState = {
        active: cursorType === "custom",
        selectedCursor: selectedCursor || "cursor-1",
        size: cursorSize || 32,
        customCursorSvg: customCursorSvg || null
      };

      updateUI();
      updateStorage();
    }
  );
}

// Actualizar UI según estado
function updateUI() {
  switchInput.checked = currentState.active;
  sizeSlider.value = currentState.size;

  // Actualizar botones de cursor
  const cursorButtons = document.querySelectorAll(".cursor-btn");
  cursorButtons.forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.cursor === currentState.selectedCursor);
  });

  // Crear/actualizar botón custom si existe
  if (currentState.customCursorSvg) {
    let customBtn = document.querySelector('[data-cursor="custom-upload"]');
    
    if (!customBtn) {
      customBtn = document.createElement("button");
      customBtn.classList.add("cursor-btn");
      customBtn.dataset.cursor = "custom-upload";
      customBtn.onclick = () => selectCursor("custom-upload");

      const img = document.createElement("img");
      img.alt = "Cursor personalizado";
      customBtn.appendChild(img);

      cursorGrid.appendChild(customBtn);
    }

    const img = customBtn.querySelector("img");
    if (img) {
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(currentState.customCursorSvg)}`;
    }
  }
}

// Actualizar storage según estado
function updateStorage() {
  chrome.storage.sync.set({
    cursorType: currentState.active ? "custom" : "default",
    selectedCursor: currentState.selectedCursor,
    cursorSize: currentState.size,
    customCursorSvg: currentState.customCursorSvg
  });
}

// Enviar cambios a todas las pestañas
function updateAllTabs() {
  chrome.tabs.query({}, tabs => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: "update-cursor",
        state: currentState
      });
    });
  });
}

// Seleccionar cursor
function selectCursor(cursorId) {
  currentState.selectedCursor = cursorId;
  currentState.active = true; // Activar automáticamente al seleccionar cursor
  
  updateUI();
  updateStorage();
  updateAllTabs();
}

// Event listeners
switchInput.addEventListener("change", () => {
  currentState.active = switchInput.checked;
  updateStorage();
  updateAllTabs();
  updateUI();
});

sizeSlider.addEventListener("input", () => {
  currentState.size = parseInt(sizeSlider.value);
  updateStorage();
  updateAllTabs();
});

uploadInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file || !file.name.endsWith(".svg")) {
    return alert("Por favor selecciona un archivo SVG válido.");
  }

  const reader = new FileReader();
  reader.onload = () => {
    currentState.customCursorSvg = reader.result;
    currentState.selectedCursor = "custom-upload";
    currentState.active = true;
    
    updateUI();
    updateStorage();
    updateAllTabs();
  };
  reader.readAsText(file);
});

// Inicializar
document.querySelectorAll(".cursor-btn").forEach(btn => {
  btn.onclick = () => selectCursor(btn.dataset.cursor);
});

loadState();