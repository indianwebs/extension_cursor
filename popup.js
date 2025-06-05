var defaultValue = true;
chrome.storage.sync.get('activeSwitch', function (data) {
  if (!data.hasOwnProperty('activeSwitch') || typeof data.activeSwitch === 'undefined')
    data.activeSwitch = defaultValue;
  document.getElementById("activeSwitch").checked = data.activeSwitch;
});

function storeSwitch() {
  var switchState = document.getElementById('activeSwitch').checked;
  chrome.storage.sync.set({activeSwitch: switchState}, function () {
    console.log('activeSwitch saved');
  });
}

document.getElementById('activeSwitch').addEventListener('change', storeSwitch);