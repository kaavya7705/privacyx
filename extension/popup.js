document.addEventListener("DOMContentLoaded", () => {
  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");
  const queueCount = document.getElementById("queueCount");
  const totalCount = document.getElementById("totalCount");
  const piiCount = document.getElementById("piiCount");
  const trackersCount = document.getElementById("trackersCount");
  const modeBadge = document.getElementById("modeBadge");
  const modeDesc = document.getElementById("modeDesc");
  const toggleModeBtn = document.getElementById("toggleModeBtn");
  const toggleBtn = document.getElementById("toggleBtn");
  const dashboardBtn = document.getElementById("dashboardBtn");
  const tokenInput = document.getElementById("tokenInput");
  const syncBtn = document.getElementById("syncBtn");

  let currentMode = "active";

  function updateModeUI(mode) {
    currentMode = mode || "active";
    if (currentMode === "active") {
      modeBadge.textContent = "ACTIVE";
      modeBadge.className = "badge-mode";
      modeDesc.textContent = "Active: Auto-blocking trackers & brokers";
    } else {
      modeBadge.textContent = "MONITOR";
      modeBadge.className = "badge-mode monitor";
      modeDesc.textContent = "Monitor: Detecting without blocking requests";
    }
  }

  // Load state and request live stats from background
  function refreshState() {
    chrome.storage.local.get(["monitoring", "apiToken", "apiUrl", "totalEvents", "shieldMode"], (data) => {
      const isPaused = data.monitoring?.paused ?? false;
      const hasToken = !!data.apiToken;

      updateModeUI(data.shieldMode);

      if (!hasToken) {
        statusDot.className = "status-dot disconnected";
        statusText.textContent = "No API token — enter token below";
      } else if (isPaused) {
        statusDot.className = "status-dot paused";
        statusText.textContent = "Monitoring & Defense Paused";
        toggleBtn.textContent = "▶ Resume Protection";
        toggleBtn.className = "btn btn-resume";
      } else {
        statusDot.className = "status-dot active";
        statusText.textContent = "Shield Active & Protecting";
        toggleBtn.textContent = "⏸ Pause Protection";
        toggleBtn.className = "btn btn-pause";
      }

      totalCount.textContent = data.totalEvents || 0;
      if (data.apiToken && !tokenInput.value) {
        tokenInput.value = "••••••••••••";
      }
    });

    // Query background service worker for live session stats
    chrome.runtime.sendMessage({ action: "getStats" }, (res) => {
      if (chrome.runtime.lastError || !res) return;
      if (res.sessionStats) {
        piiCount.textContent = (res.sessionStats.piiDetected || 0) + (res.sessionStats.leaksBlocked || 0);
        trackersCount.textContent = res.sessionStats.trackersBlocked || 0;
      }
      if (typeof res.queuedEvents === "number") {
        queueCount.textContent = res.queuedEvents;
      }
      if (typeof res.totalEvents === "number") {
        totalCount.textContent = res.totalEvents;
      }
    });
  }

  refreshState();

  // Mode Toggle (Active <-> Monitor)
  toggleModeBtn.addEventListener("click", () => {
    const nextMode = currentMode === "active" ? "monitor" : "active";
    chrome.runtime.sendMessage({ action: "setShieldMode", mode: nextMode }, (res) => {
      if (res && res.success) {
        updateModeUI(nextMode);
      }
    });
  });

  // Toggle monitoring pause/resume
  toggleBtn.addEventListener("click", () => {
    chrome.storage.local.get(["monitoring"], (data) => {
      const monitoring = data.monitoring || {};
      monitoring.paused = !monitoring.paused;
      chrome.storage.local.set({ monitoring }, () => {
        refreshState();
      });
    });
  });

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
        statusText.textContent = "Synced successfully to PrivacyX!";
        setTimeout(() => {
          refreshState();
        }, 2000);
      } else {
        statusText.textContent = response?.error || "Sync failed";
      }
    });
  });

  // Open Dashboard
  dashboardBtn.addEventListener("click", () => {
    chrome.storage.local.get(["apiUrl"], (data) => {
      chrome.tabs.create({ url: (data.apiUrl || "http://localhost:3000") + "/dashboard" });
    });
  });

  // Token input save
  tokenInput.addEventListener("change", () => {
    const token = tokenInput.value.trim();
    if (token && !token.startsWith("••")) {
      chrome.storage.local.set({ apiToken: token }, () => {
        statusDot.className = "status-dot active";
        statusText.textContent = "Token saved — shield active";
        tokenInput.value = "••••••••••••";
        refreshState();
      });
    }
  });

  // Update badge text for queue
  chrome.action.getBadgeText({}, (text) => {
    if (text) queueCount.textContent = text;
  });
});
