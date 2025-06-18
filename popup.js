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

let isUpdating = false;

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
  return new Promise((resolve) => {
    chrome.storage.local.set({
      cursorType: currentState.active ? "custom" : "default",
      selectedCursor: currentState.active ? currentState.selectedCursor : "",
      cursorSize: currentState.size,
      customCursorSvg: currentState.customCursorSvg,
      colorEnabled: currentState.colorEnabled,
      cursorColor: currentState.cursorColor,
      cursorOpacity: currentState.cursorOpacity
    }, () => {
      if (chrome.runtime.lastError) {
        console.error("Storage error:", chrome.runtime.lastError);
      }
      resolve();
    });
  });
}

function updateAllTabs() {
  return new Promise((resolve) => {
    chrome.tabs.query({}, (tabs) => {
      if (tabs.length === 0) {
        resolve();
        return;
      }

      let completed = 0;
      tabs.forEach((tab) => {
        try {
          chrome.tabs.sendMessage(
            tab.id,
            {
              action: "update-cursor",
              state: currentState
            },
            () => {
              completed++;
              if (completed >= tabs.length) resolve();
            }
          );
        } catch (error) {
          console.error(`Error in tab ${tab.id}:`, error);
          completed++;
          if (completed >= tabs.length) resolve();
        }
      });
    });
  });
}

async function safeUpdate() {
  if (isUpdating) return;
  isUpdating = true;

  try {
    await updateStorage();
    await updateAllTabs();
    updateUI();
  } catch (error) {
    console.error("Update error:", error);
  } finally {
    isUpdating = false;
  }
}

function selectCursor(cursorId) {
  currentState.selectedCursor = cursorId;
  currentState.active = true;
  safeUpdate();
}

// Event listeners
switchInput.addEventListener("change", async () => {
  currentState.active = switchInput.checked;
  
  if (!currentState.active) {
    currentState.colorEnabled = false;
  }
  
  await safeUpdate();
});

sizeSlider.addEventListener("input", () => {
  currentState.size = parseInt(sizeSlider.value);
  safeUpdate();
});

colorSwitch.addEventListener("change", () => {
  currentState.colorEnabled = colorSwitch.checked;
  safeUpdate();
});

colorPicker.addEventListener("input", () => {
  currentState.cursorColor = colorPicker.value;
  safeUpdate();
});

opacitySlider.addEventListener("input", () => {
  currentState.cursorOpacity = opacitySlider.value;
  opacityValue.textContent = `${opacitySlider.value}%`;
  safeUpdate();
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
    safeUpdate();
  };
  reader.readAsText(file);
});

document.querySelectorAll(".cursor-btn").forEach(btn => {
  if (btn.dataset.cursor !== "custom-upload") {
    btn.onclick = () => selectCursor(btn.dataset.cursor);
  }
});

// Initialize
loadState();