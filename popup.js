
document.addEventListener('DOMContentLoaded', () => {
  const output = document.getElementById('output');
  const copyBtn = document.getElementById('copyBtn');
  const status = document.getElementById('status');

  // Query the active tab
  chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
    const activeTab = tabs[0];
    if (activeTab.url && activeTab.url.includes("google.com/maps")) {
      // Send message to content script
      chrome.tabs.sendMessage(activeTab.id, {action: "getRoute"}, (response) => {
        if (chrome.runtime.lastError) {
          output.value = "Error: Please refresh the Google Maps page and try again.";
        } else if (response && response.data) {
          output.value = response.data;
        } else {
          output.value = "No data found.";
        }
      });
    } else {
      output.value = "Please open Google Maps to use this extension.";
    }
  });

  copyBtn.addEventListener('click', () => {
    output.select();
    document.execCommand('copy');
    status.textContent = "Copied!";
    setTimeout(() => {
      status.textContent = "";
    }, 2000);
  });
});
