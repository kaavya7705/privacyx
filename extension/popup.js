document.addEventListener("DOMContentLoaded", () => {
  // Elements
  const statusDot = document.getElementById("statusDot");
  const statusText = document.getElementById("statusText");
  const radarHeadline = document.getElementById("radarHeadline");
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
  const autoConnectBtn = document.getElementById("autoConnectBtn");
  const autoConnectBtnSettings = document.getElementById("autoConnectBtnSettings");
  const activityList = document.getElementById("activityList");
  const threatsList = document.getElementById("threatsList");
  const streamBadge = document.getElementById("streamBadge");
  const threatCountBadge = document.getElementById("threatCountBadge");
  const clearActivityBtn = document.getElementById("clearActivityBtn");

  let currentMode = "active";
  let rawEvents = [];
  let currentFilter = "all";

  // Tab Navigation Handling
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetTab = btn.getAttribute("data-tab");
      tabButtons.forEach((b) => b.classList.remove("active"));
      tabPanes.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPane = document.getElementById(targetTab);
      if (targetPane) targetPane.classList.add("active");
    });
  });

  // Filter Pills Handling
  const filterPills = document.querySelectorAll(".filter-pills .pill");
  filterPills.forEach((pill) => {
    pill.addEventListener("click", () => {
      filterPills.forEach((p) => p.classList.remove("active", "active-danger"));
      const filter = pill.getAttribute("data-filter");
      currentFilter = filter || "all";
      if (filter === "high") {
        pill.classList.add("active-danger");
      } else {
        pill.classList.add("active");
      }
      renderRecentEvents(rawEvents);
    });
  });

  function updateModeUI(mode) {
    currentMode = mode || "active";
    if (currentMode === "active") {
      modeBadge.textContent = "ACTIVE";
      modeBadge.className = "badge-mode";
      if (modeDesc) modeDesc.textContent = "Auto-blocking trackers, data brokers & intercepting PII in real-time.";
      if (radarHeadline) radarHeadline.textContent = "Active Threat Defense";
    } else {
      modeBadge.textContent = "MONITOR";
      modeBadge.className = "badge-mode monitor";
      if (modeDesc) modeDesc.textContent = "Auditing browsing telemetry & scoring risk without blocking requests.";
      if (radarHeadline) radarHeadline.textContent = "Audit Monitoring Mode";
    }
  }

  function formatTime(isoStr) {
    if (!isoStr) return "";
    try {
      const d = new Date(isoStr);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return "";
    }
  }

  // Render Live Activity List
  function renderRecentEvents(events) {
    rawEvents = Array.isArray(events) ? events : [];
    if (streamBadge) streamBadge.textContent = String(rawEvents.length);
    if (!activityList) return;

    let filtered = rawEvents;
    if (currentFilter === "high") {
      filtered = rawEvents.filter((ev) => Boolean(ev.isHighRisk || (typeof ev.sensitivity === "number" && ev.sensitivity >= 0.70)));
    } else if (currentFilter === "healthcare") {
      filtered = rawEvents.filter((ev) => (ev.category || "").includes("health") || (ev.domain || "").includes("health") || (ev.domain || "").includes("med"));
    } else if (currentFilter === "finance") {
      filtered = rawEvents.filter((ev) => (ev.category || "").includes("finance") || (ev.domain || "").includes("bank") || (ev.domain || "").includes("pay"));
    } else if (currentFilter === "tech") {
      filtered = rawEvents.filter((ev) => (ev.category || "").includes("tech") || (ev.domain || "").includes("git") || (ev.domain || "").includes("dev"));
    }

    if (filtered.length === 0) {
      activityList.innerHTML = `
        <div class="activity-empty">
          ${currentFilter === "all"
            ? "Navigate to any website in your browser to see real-time AI-classified domain events here."
            : `No events matched the "${currentFilter}" filter.`}
        </div>
      `;
      return;
    }

    activityList.innerHTML = filtered.slice(0, 25).map((ev) => {
      const domain = ev.domain || ev.metadata?.domain || "Web Activity";
      const category = (ev.category && ev.category !== "unknown") ? ev.category.replace(/_/g, " ") : "general web";
      const sensitivity = typeof ev.sensitivity === "number" ? ev.sensitivity : 0.45;
      const isHigh = Boolean(ev.isHighRisk || sensitivity >= 0.70);
      const isMedium = !isHigh && (ev.riskLevel === "medium" || sensitivity >= 0.50);

      const riskClass = isHigh ? "risk-high" : (isMedium ? "risk-medium" : "risk-low");
      const riskText = isHigh ? "HIGH RISK" : (isMedium ? "ELEVATED" : "LOW RISK");
      const itemHighClass = isHigh ? "high-risk" : "";
      const timeStr = formatTime(ev.createdAt || ev.timestamp);

      return `
        <div class="activity-item ${itemHighClass}">
          <div class="activity-top">
            <span class="activity-domain" title="${domain}">${domain}</span>
            <span class="activity-badge-risk ${riskClass}">${riskText}</span>
          </div>
          <div class="activity-bottom">
            <span class="activity-category">✨ AI: ${category}</span>
            <span class="activity-time">${timeStr}</span>
          </div>
        </div>
      `;
    }).join("");
  }

  // Render Intercepted Threats Feed
  function renderThreats(threats) {
    if (!threatsList) return;
    const list = Array.isArray(threats) ? threats : [];
    if (threatCountBadge) threatCountBadge.textContent = `${list.length} Total`;

    if (list.length === 0) {
      threatsList.innerHTML = `
        <div class="activity-empty">
          No privacy threats or data broker attempts detected yet. Your active shield is monitoring.
        </div>
      `;
      return;
    }

    threatsList.innerHTML = list.slice(0, 25).map((threat) => {
      const type = (threat.type || "Threat").replace(/_/g, " ");
      const domain = threat.domain || "Unknown Domain";
      const timeStr = formatTime(threat.timestamp || threat.createdAt);
      const blocked = threat.blocked ? "BLOCKED" : "DETECTED";

      return `
        <div class="threat-item">
          <div class="threat-header">
            <span class="threat-type">${type}</span>
            <span class="activity-badge-risk risk-high">${blocked}</span>
          </div>
          <div class="activity-top">
            <span class="threat-domain">${domain}</span>
            <span class="activity-time">${timeStr}</span>
          </div>
        </div>
      `;
    }).join("");
  }

  // Clear live events
  if (clearActivityBtn) {
    clearActivityBtn.addEventListener("click", () => {
      chrome.runtime.sendMessage({ action: "clearRecentEvents" }, () => {
        renderRecentEvents([]);
      });
    });
  }

  // Live storage change listener for instant reactive UI updates
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local") {
      if (changes.recentEvents) {
        renderRecentEvents(changes.recentEvents.newValue);
      }
      if (changes.leakHistory) {
        renderThreats(changes.leakHistory.newValue);
      }
    }
  });

  // Load state and request live session stats from background
  function refreshState() {
    chrome.storage.local.get(
      ["monitoring", "apiToken", "apiUrl", "totalEvents", "shieldMode", "recentEvents", "leakHistory"],
      (data) => {
        const isPaused = data.monitoring?.paused ?? false;
        const hasToken = !!data.apiToken;

        updateModeUI(data.shieldMode);
        renderRecentEvents(data.recentEvents);
        renderThreats(data.leakHistory);

        if (!hasToken) {
          statusDot.className = "status-ping disconnected";
          statusText.textContent = "No API token connected";
        } else if (isPaused) {
          statusDot.className = "status-ping paused";
          statusText.textContent = "Protection Paused";
          toggleBtn.textContent = "▶ Resume Protection";
          toggleBtn.className = "btn btn-resume";
        } else {
          statusDot.className = "status-ping";
          statusText.textContent = "Shield Armed & Protecting";
          toggleBtn.textContent = "⏸ Pause Protection";
          toggleBtn.className = "btn btn-pause";
        }

        totalCount.textContent = data.totalEvents || 0;
        if (data.apiToken && !tokenInput.value) {
          tokenInput.value = "••••••••••••";
        }
      }
    );

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
      if (Array.isArray(res.recentEvents) && res.recentEvents.length > 0) {
        renderRecentEvents(res.recentEvents);
      }
      if (Array.isArray(res.recentLeaks) && res.recentLeaks.length > 0) {
        renderThreats(res.recentLeaks);
      }
    });
  }

  refreshState();

  // Mode Toggle (Active <-> Monitor)
  function toggleMode() {
    const nextMode = currentMode === "active" ? "monitor" : "active";
    chrome.runtime.sendMessage({ action: "setShieldMode", mode: nextMode }, (res) => {
      if (res && res.success) {
        updateModeUI(nextMode);
      }
    });
  }

  if (toggleModeBtn) toggleModeBtn.addEventListener("click", toggleMode);
  if (modeBadge) modeBadge.addEventListener("click", toggleMode);

  // Auto connect handler
  function tryAutoConnect(showFeedback = true) {
    const btns = [autoConnectBtn, autoConnectBtnSettings].filter(Boolean);
    if (showFeedback) {
      btns.forEach((b) => {
        b.textContent = "⏳ Connecting...";
        b.disabled = true;
      });
    }

    chrome.runtime.sendMessage({ action: "autoConnect" }, (res) => {
      if (showFeedback) {
        btns.forEach((b) => {
          b.textContent = "🔗 Auto-Connect";
          b.disabled = false;
        });
      }
      if (res && res.success) {
        statusDot.className = "status-ping";
        statusText.textContent = "Connected to PrivacyX!";
        tokenInput.value = "••••••••••••";
        refreshState();
      } else if (showFeedback) {
        statusText.textContent = res?.error || "Login to localhost:3000 first";
      }
    });
  }

  if (autoConnectBtn) autoConnectBtn.addEventListener("click", () => tryAutoConnect(true));
  if (autoConnectBtnSettings) autoConnectBtnSettings.addEventListener("click", () => tryAutoConnect(true));

  // If no token exists on load, attempt silent auto-connect
  chrome.storage.local.get(["apiToken"], (data) => {
    if (!data.apiToken) {
      tryAutoConnect(false);
    }
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
      syncBtn.textContent = "⚡ Sync Now";
      syncBtn.disabled = false;
      if (response && response.success) {
        queueCount.textContent = String(response.queued || 0);
        totalCount.textContent = response.totalEvents || 0;
        statusText.textContent = "Synced to PrivacyX!";
        setTimeout(() => {
          refreshState();
        }, 1800);
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
        statusDot.className = "status-ping";
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
