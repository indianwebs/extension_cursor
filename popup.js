var defaultValue = true;

chrome.storage.sync.get('activeSwitch', function (data) {
  if (!data.hasOwnProperty('activeSwitch') || typeof data.activeSwitch === 'undefined') {
    data.activeSwitch = defaultValue;
  }
  document.getElementById("activeSwitch").checked = data.activeSwitch;
});

function storeSwitch() {
  var switchState = document.getElementById('activeSwitch').checked;

  chrome.storage.sync.set({ activeSwitch: switchState }, function () {
    if (switchState) {
      console.log('El switch está ON');
    } else {
      console.log('El switch está OFF');
    }
  });
}

document.getElementById('activeSwitch').addEventListener('change', storeSwitch);
