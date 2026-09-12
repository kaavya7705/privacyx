document.addEventListener("DOMContentLoaded", () => {
  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");
  const queueCount = document.getElementById("queueCount");
  const totalCount = document.getElementById("totalCount");
  const toggleBtn = document.getElementById("toggleBtn");
  const dashboardBtn = document.getElementById("dashboardBtn");
  const tokenInput = document.getElementById("tokenInput");

  // Load state
  chrome.storage.local.get(["monitoring", "apiToken", "apiUrl", "totalEvents"], (data) => {
    const isPaused = data.monitoring?.paused ?? false;
    const hasToken = !!data.apiToken;

    if (!hasToken) {
      statusDot.className = "status-dot disconnected";
      statusText.textContent = "No API token — enter token below";
    } else if (isPaused) {
      statusDot.className = "status-dot paused";
      statusText.textContent = "Monitoring paused";
      toggleBtn.textContent = "▶ Resume Monitoring";
      toggleBtn.className = "btn btn-resume";
    } else {
      statusDot.className = "status-dot active";
      statusText.textContent = "Monitoring active";
    }

    totalCount.textContent = data.totalEvents || 0;
    if (data.apiToken) tokenInput.value = "••••••••••••";
  });

  // Toggle monitoring
  toggleBtn.addEventListener("click", () => {
    chrome.storage.local.get(["monitoring"], (data) => {
      const monitoring = data.monitoring || {};
      monitoring.paused = !monitoring.paused;
      chrome.storage.local.set({ monitoring });

      if (monitoring.paused) {
        statusDot.className = "status-dot paused";
        statusText.textContent = "Monitoring paused";
        toggleBtn.textContent = "▶ Resume Monitoring";
        toggleBtn.className = "btn btn-resume";
      } else {
        statusDot.className = "status-dot active";
        statusText.textContent = "Monitoring active";
        toggleBtn.textContent = "⏸ Pause Monitoring";
        toggleBtn.className = "btn btn-pause";
      }
    });
  });

  const syncBtn = document.getElementById("syncBtn");

  // Sync now button
  syncBtn.addEventListener("click", () => {
    syncBtn.textContent = "⏳ Syncing...";
    syncBtn.disabled = true;
    chrome.runtime.sendMessage({ action: "flush" }, (response) => {
      syncBtn.textContent = "⚡ Sync Events Now";
      syncBtn.disabled = false;
      if (response && response.success) {
        queueCount.textContent = String(response.queued || 0);
        totalCount.textContent = response.totalEvents || 0;
        statusText.textContent = "Synced successfully!";
        setTimeout(() => {
          statusText.textContent = "Monitoring active";
        }, 2000);
      } else {
        statusText.textContent = response?.error || "Sync failed";
      }
    });
  });

  // Dashboard button
  dashboardBtn.addEventListener("click", () => {
    chrome.storage.local.get(["apiUrl"], (data) => {
      chrome.tabs.create({ url: (data.apiUrl || "http://localhost:3000") + "/dashboard" });
    });
  });

  // Token input
  tokenInput.addEventListener("change", () => {
    const token = tokenInput.value.trim();
    if (token && !token.startsWith("••")) {
      chrome.storage.local.set({ apiToken: token });
      statusDot.className = "status-dot active";
      statusText.textContent = "Token saved — monitoring active";
      tokenInput.value = "••••••••••••";
    }
  });

  // Update queue count
  chrome.action.getBadgeText({}, (text) => {
    queueCount.textContent = text || "0";
  });
});
