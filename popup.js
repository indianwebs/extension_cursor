const switchInput = document.getElementById("activeSwitch");
const sizeSlider = document.getElementById("cursorSize");
const uploadInput = document.getElementById("uploadCursor");
const cursorGrid = document.querySelector(".grid-cursor");
const colorSwitch = document.getElementById("colorSwitch");
const colorPicker = document.getElementById("cursorColor");
const opacitySlider = document.getElementById("cursorOpacity");
const opacityValue = document.getElementById("opacityValue");

let currentState = {
  active: false,
  selectedCursor: "cursor-1",
  size: 32,
  customCursorSvg: null,
  colorEnabled: false,
  cursorColor: "#000000",
  cursorOpacity: 100
};

function loadState() {
  chrome.storage.local.get(
    ["cursorType", "selectedCursor", "cursorSize", "customCursorSvg", "colorEnabled", "cursorColor", "cursorOpacity"],
    ({ cursorType, selectedCursor, cursorSize, customCursorSvg, colorEnabled, cursorColor, cursorOpacity }) => {
      currentState = {
        active: cursorType === "custom",
        selectedCursor: selectedCursor || "cursor-1",
        size: cursorSize || 32,
        customCursorSvg: customCursorSvg || null,
        colorEnabled: colorEnabled || false,
        cursorColor: cursorColor || "#000000",
        cursorOpacity: cursorOpacity || 100
      };
      updateUI();
    }
  );
}

function updateUI() {
  switchInput.checked = currentState.active;
  sizeSlider.value = currentState.size;
  colorSwitch.checked = currentState.colorEnabled;
  colorPicker.value = currentState.cursorColor;
  opacitySlider.value = currentState.cursorOpacity;
  opacityValue.textContent = `${currentState.cursorOpacity}%`;

  document.querySelector(".color-picker").style.display = currentState.colorEnabled ? "flex" : "none";

  const customContainer = document.getElementById("customCursorContainer");
  customContainer.innerHTML = '';

  if (currentState.customCursorSvg) {
    const customBtn = document.createElement("button");
    customBtn.classList.add("cursor-btn");
    customBtn.dataset.cursor = "custom-upload";
    customBtn.onclick = () => selectCursor("custom-upload");

    const img = document.createElement("img");
    img.alt = "Cursor personalizado";
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(currentState.customCursorSvg)}`;
    customBtn.appendChild(img);

    customContainer.appendChild(customBtn);
  }

  const cursorButtons = document.querySelectorAll(".cursor-btn");
  cursorButtons.forEach(btn => {
    btn.classList.toggle("selected", btn.dataset.cursor === currentState.selectedCursor);
  });
}

function updateStorage() {
  chrome.storage.local.set({
    cursorType: currentState.active ? "custom" : "default",
    selectedCursor: currentState.selectedCursor,
    cursorSize: currentState.size,
    customCursorSvg: currentState.customCursorSvg,
    colorEnabled: currentState.colorEnabled,
    cursorColor: currentState.cursorColor,
    cursorOpacity: currentState.cursorOpacity
  }, () => {
    if (chrome.runtime.lastError) {
      console.error("Error al guardar el estado: ", chrome.runtime.lastError);
      alert("Hubo un error al guardar el cursor. Es posible que el archivo sea demasiado grande.");
    }
  });
}

function updateAllTabs() {
  chrome.tabs.query({}, tabs => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: "update-cursor",
        state: currentState
      }, () => {});
    });
  });
}

function selectCursor(cursorId) {
  currentState.selectedCursor = cursorId;
  currentState.active = true;

  updateUI();
  updateStorage();
  updateAllTabs();
}

switchInput.addEventListener("change", () => {
  currentState.active = switchInput.checked;

  // Asegurar que haya un cursor válido cuando se activa
  if (currentState.active && !currentState.selectedCursor) {
    currentState.selectedCursor = "cursor-1";
  }

  updateStorage();
  updateAllTabs();
  updateUI();
});

sizeSlider.addEventListener("input", () => {
  currentState.size = parseInt(sizeSlider.value);
  updateStorage();
  updateAllTabs();
  updateUI();
});

colorSwitch.addEventListener("change", () => {
  currentState.colorEnabled = colorSwitch.checked;

  if (!currentState.selectedCursor) {
    currentState.selectedCursor = "cursor-1";
  }
  currentState.active = true;

  updateStorage();
  updateAllTabs();
  updateUI();
});

colorPicker.addEventListener("input", () => {
  currentState.cursorColor = colorPicker.value;

  // Activar automáticamente si aún no hay cursor seleccionado
  if (!currentState.selectedCursor) {
    currentState.selectedCursor = "cursor-1";
  }
  currentState.active = true;

  updateStorage();
  updateAllTabs();
  updateUI();
});

opacitySlider.addEventListener("input", () => {
  currentState.cursorOpacity = opacitySlider.value;
  opacityValue.textContent = `${opacitySlider.value}%`;

  if (!currentState.selectedCursor) {
    currentState.selectedCursor = "cursor-1";
  }
  currentState.active = true;

  updateStorage();
  updateAllTabs();
  updateUI();
});

uploadInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file || !file.type.includes("svg")) {
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

document.querySelectorAll(".cursor-btn").forEach(btn => {
  if (btn.dataset.cursor !== "custom-upload") {
    btn.onclick = () => selectCursor(btn.dataset.cursor);
  }
});

loadState();
