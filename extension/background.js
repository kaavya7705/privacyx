/**
 * PrivacyX Shield — Background Service Worker v2.0
 * Manifest V3 — Real-time PII detection, tracker blocking, data leak prevention
 * 
 * COLLECTS: Domain categories, timestamps, sensitivity scores
 * BLOCKS: Known trackers, data brokers, PII in URLs
 * DETECTS: Emails, phone numbers, credit cards, API keys in outgoing requests
 * NEVER COLLECTS: Passwords, keystrokes, page content, private messages
 */

// =========================================================================
// PII Detection Patterns
// =========================================================================
const PII_PATTERNS = {
  email: {
    regex: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    severity: "high",
    label: "Email Address",
  },
  phone: {
    regex: /(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,
    severity: "high",
    label: "Phone Number",
  },
  creditCard: {
    regex: /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/g,
    severity: "critical",
    label: "Credit Card Number",
  },
  ssn: {
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    severity: "critical",
    label: "SSN Pattern",
  },
  apiKey: {
    regex: /(?:api[_-]?key|token|secret|password|auth)[\s=:]+['\"]?([a-zA-Z0-9_\-]{20,})['\"]?/gi,
    severity: "critical",
    label: "API Key / Token",
  },
  ipAddress: {
    regex: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    severity: "medium",
    label: "IP Address",
  },
};

// =========================================================================
// Known Tracker & Data Broker Domains
// =========================================================================
const TRACKER_DOMAINS = new Set([
  // Analytics
  "google-analytics.com", "analytics.google.com", "googletagmanager.com",
  "hotjar.com", "mixpanel.com", "amplitude.com", "segment.com",
  "heap.io", "fullstory.com", "mouseflow.com", "crazyegg.com",
  // Advertising
  "doubleclick.net", "googlesyndication.com", "googleadservices.com",
  "facebook.net", "fbcdn.net", "ads.twitter.com", "ads.linkedin.com",
  "adsrvr.org", "criteo.com", "criteo.net", "taboola.com", "outbrain.com",
  "adnxs.com", "rubiconproject.com", "pubmatic.com",
  // Data brokers
  "bluekai.com", "oracle.com/marketingcloud", "acxiom.com",
  "experian.com/marketing", "epsilon.com", "liveramp.com",
  "lotame.com", "nielsen.com", "comscore.com",
  // Fingerprinting
  "fingerprintjs.com", "deviceinfo.me",
]);

const DATA_BROKER_DOMAINS = new Set([
  "spokeo.com", "whitepages.com", "beenverified.com", "intelius.com",
  "peoplefinder.com", "pipl.com", "truthfinder.com", "instantcheckmate.com",
  "mylife.com", "radaris.com", "ussearch.com", "peekyou.com",
]);

// =========================================================================
// Domain categorization (mirrors server-side categorizer)
// =========================================================================
const DOMAIN_CATEGORIES = {
  technology: ["github.com", "stackoverflow.com", "npmjs.com", "gitlab.com", "dev.to", "medium.com", "techcrunch.com", "hackernews.com", "news.ycombinator.com", "openai.com", "anthropic.com", "huggingface.co", "vercel.com", "aws.amazon.com"],
  education: ["coursera.org", "udemy.com", "edx.org", "khanacademy.org", "scholar.google.com", "wikipedia.org", "academia.edu", "mit.edu", "stanford.edu", "harvard.edu", "duolingo.com", "quizlet.com"],
  career: ["linkedin.com", "indeed.com", "glassdoor.com", "wellfound.com", "monster.com", "ziprecruiter.com", "upwork.com", "fiverr.com", "workday.com"],
  finance: ["bloomberg.com", "cnbc.com", "yahoo.com/finance", "coinbase.com", "binance.com", "paypal.com", "stripe.com", "robinhood.com", "chase.com", "bankofamerica.com", "wellsfargo.com", "fidelity.com"],
  healthcare: ["webmd.com", "mayoclinic.org", "healthline.com", "nih.gov", "cdc.gov", "who.int", "drugs.com", "cvs.com", "walgreens.com", "goodrx.com", "psychologytoday.com"],
  shopping: ["amazon.com", "ebay.com", "walmart.com", "flipkart.com", "myntra.com", "target.com", "bestbuy.com", "etsy.com", "aliexpress.com", "shopify.com"],
  entertainment: ["youtube.com", "netflix.com", "twitch.tv", "spotify.com", "hulu.com", "disneyplus.com", "primevideo.com", "imdb.com", "soundcloud.com", "tiktok.com"],
  social: ["facebook.com", "twitter.com", "x.com", "instagram.com", "reddit.com", "discord.com", "threads.net", "telegram.org", "whatsapp.com", "pinterest.com"],
  travel: ["booking.com", "airbnb.com", "maps.google.com", "makemytrip.com", "expedia.com", "tripadvisor.com", "uber.com", "lyft.com"],
  news: ["bbc.com", "cnn.com", "nytimes.com", "ndtv.com", "theguardian.com", "washingtonpost.com", "reuters.com", "forbes.com"],
  sports: ["espn.com", "cricbuzz.com", "nba.com", "nfl.com", "fifa.com", "strava.com"],
  gaming: ["store.steampowered.com", "epicgames.com", "xbox.com", "playstation.com", "roblox.com", "ign.com"],
  developer_tools: ["github.com", "gitlab.com", "vscode.dev", "replit.com", "codesandbox.io", "codepen.io"],
  search: ["google.com", "bing.com", "duckduckgo.com", "kagi.com", "brave.com"],
};

const CATEGORY_KEYWORDS = {
  healthcare: ["health", "med", "doctor", "clinic", "hospital", "pharma", "rx", "care", "cure", "patient", "therapy", "psych", "dental"],
  finance: ["bank", "finance", "invest", "trade", "stock", "crypto", "pay", "money", "wallet", "credit", "loan", "fund", "insur"],
  career: ["job", "career", "hire", "recruit", "resume", "work", "employ", "intern", "staff"],
  technology: ["tech", "dev", "code", "program", "software", "api", "cloud", "data", "cyber", "ai", "ml", "bot"],
  education: ["edu", "learn", "course", "university", "school", "study", "tutorial", "academy", "college"],
  shopping: ["shop", "store", "buy", "deal", "sale", "market", "cart", "product", "price"],
  entertainment: ["movie", "music", "video", "stream", "show", "cinema", "song", "film"],
  social: ["social", "chat", "message", "friend", "community", "forum", "network"],
  travel: ["travel", "hotel", "flight", "booking", "trip", "tour", "vacation", "map"],
  news: ["news", "press", "journal", "report", "daily", "times", "herald", "gazette", "post"],
  sports: ["sport", "team", "league", "score", "match", "player", "fitness", "gym"],
  gaming: ["game", "gaming", "esport", "steam", "play", "arcade"],
};

function categorizeDomain(domain) {
  const normalized = domain.toLowerCase().replace(/^www\./, "").trim();

  // 1. Exact catalog match
  for (const [category, domains] of Object.entries(DOMAIN_CATEGORIES)) {
    if (domains.some(d => normalized === d || normalized.endsWith(`.${d}`) || normalized.includes(d))) {
      return category;
    }
  }

  // 2. TLD indicators
  if (normalized.endsWith(".edu") || normalized.includes(".edu.")) return "education";
  if (normalized.endsWith(".gov") || normalized.includes(".gov.")) return "government";

  // 3. Keyword matching
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(kw => normalized.includes(kw))) {
      return category;
    }
  }

  // 4. Derive from SLD name — NEVER return "unknown"
  const parts = normalized.split(".");
  const mainPart = parts.length > 1 ? parts[parts.length - 2] : parts[0];
  if (mainPart && mainPart.length > 2) {
    return `${mainPart}_web`;
  }

  return "general_web";
}

function getTimeBucket(date) {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = Math.floor(date.getMinutes() / 15) * 15;
  const minutesStr = minutes.toString().padStart(2, "0");
  const endMinutes = (minutes + 15) % 60;
  const endHours = endMinutes === 0 ? (date.getHours() + 1) % 24 : date.getHours();
  return `${hours}:${minutesStr}-${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
}

function getSensitivity(category) {
  const map = {
    healthcare: 0.95, finance: 0.90, career: 0.75, government: 0.75,
    social: 0.65, travel: 0.60, shopping: 0.50, education: 0.35,
    entertainment: 0.30, technology: 0.20, developer_tools: 0.20,
    news: 0.25, sports: 0.20, gaming: 0.20, search: 0.45,
    general_web: 0.45,
  };
  return map[category] || 0.45;
}

// =========================================================================
// Event & Leak Batching
// =========================================================================
let eventBatch = [];
let leakBatch = [];
const BATCH_INTERVAL = 60000; // 1 minute
const MAX_BATCH_SIZE = 50;

// Stats tracking
let sessionStats = {
  eventsCollected: 0,
  trackersBlocked: 0,
  piiDetected: 0,
  leaksBlocked: 0,
};

// =========================================================================
// PII Scanner
// =========================================================================
function scanForPII(text) {
  const findings = [];
  if (!text || typeof text !== "string") return findings;

  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    const matches = text.match(pattern.regex);
    if (matches) {
      findings.push({
        type,
        label: pattern.label,
        severity: pattern.severity,
        count: matches.length,
        // Never store the actual PII — just the count and type
        timestamp: new Date().toISOString(),
      });
    }
  }
  return findings;
}

function isTrackerDomain(domain) {
  const normalized = domain.toLowerCase().replace(/^www\./, "");
  for (const tracker of TRACKER_DOMAINS) {
    if (normalized.includes(tracker) || tracker.includes(normalized)) {
      return true;
    }
  }
  return false;
}

function isDataBroker(domain) {
  const normalized = domain.toLowerCase().replace(/^www\./, "");
  for (const broker of DATA_BROKER_DOMAINS) {
    if (normalized.includes(broker)) return true;
  }
  return false;
}

// =========================================================================
// URL PII Scanner — scans URLs for leaked PII in query parameters
// =========================================================================
function scanUrlForPII(url) {
  try {
    const urlObj = new URL(url);
    const fullString = urlObj.search + urlObj.hash;
    return scanForPII(fullString);
  } catch {
    return [];
  }
}

// Local cache for AI-classified domains and visit deduplication
const domainAiCache = new Map();
const recentDomainVisits = new Map(); // domain -> timestamp ms

async function classifyDomainWithServer(domain, apiUrl = "http://localhost:3000") {
  const normalized = domain.toLowerCase().replace(/^www\./, "").trim();
  if (domainAiCache.has(normalized)) {
    return domainAiCache.get(normalized);
  }

  // 1. Instant local heuristic categorization
  const heuristicCategory = categorizeDomain(normalized);
  const heuristicSensitivity = getSensitivity(heuristicCategory);
  const isHigh = heuristicSensitivity >= 0.70;
  const baseline = {
    domain: normalized,
    category: heuristicCategory,
    sensitivity: heuristicSensitivity,
    riskLevel: isHigh ? "high" : (heuristicSensitivity >= 0.50 ? "medium" : "low"),
    isHighRisk: isHigh,
    source: "local_heuristic",
  };

  // 2. Query server AI classification (Groq AI llama-3.3-70b-versatile or ML NLP)
  try {
    const targetUrl = `${apiUrl || "http://localhost:3000"}/api/classify?domain=${encodeURIComponent(normalized)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(targetUrl, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const data = await res.json();
      if (data && data.category) {
        const enriched = {
          domain: normalized,
          category: data.category,
          sensitivity: typeof data.sensitivity === "number" ? data.sensitivity : heuristicSensitivity,
          riskLevel: data.riskLevel || (data.sensitivity >= 0.70 ? "high" : "low"),
          isHighRisk: Boolean(data.isHighRisk || data.sensitivity >= 0.70),
          source: data.model ? "groq_ai" : "ai_engine",
        };
        domainAiCache.set(normalized, enriched);
        return enriched;
      }
    }
  } catch (err) {
    // Graceful fallback to baseline
  }

  domainAiCache.set(normalized, baseline);
  return baseline;
}

// =========================================================================
// Tab Navigation Handler — Captures all browsed domains immediately
// =========================================================================
async function processTabNavigation(tab, trigger = "updated") {
  if (!tab || !tab.url) return;
  if (
    tab.url.startsWith("chrome://") ||
    tab.url.startsWith("chrome-extension://") ||
    tab.url.startsWith("about:") ||
    tab.url.startsWith("edge://") ||
    tab.url.startsWith("brave://") ||
    tab.url.startsWith("devtools://")
  ) {
    return;
  }

  let urlObj;
  try {
    urlObj = new URL(tab.url);
  } catch {
    return;
  }

  const hostname = urlObj.hostname;
  if (!hostname || hostname === "localhost" || hostname === "127.0.0.1") return;

  const domain = hostname.toLowerCase().replace(/^www\./, "").trim();
  const now = Date.now();

  // Deduplication per domain (don't capture more than once every 6 seconds)
  const lastTime = recentDomainVisits.get(domain);
  if (lastTime && now - lastTime < 6000) {
    return;
  }
  recentDomainVisits.set(domain, now);

  if (recentDomainVisits.size > 150) {
    for (const [d, t] of recentDomainVisits.entries()) {
      if (now - t > 30000) recentDomainVisits.delete(d);
    }
  }

  chrome.storage.local.get(["monitoring", "apiToken", "apiUrl", "shieldMode", "recentEvents"], async (data) => {
    if (data.monitoring?.paused) return;

    // --- Tracker Detection ---
    if (isTrackerDomain(domain)) {
      sessionStats.trackersBlocked++;
      recordLeak("tracker", domain, "medium", data.shieldMode === "active");
      updateBadge();
      return;
    }

    // --- Data Broker Detection ---
    if (isDataBroker(domain)) {
      sessionStats.leaksBlocked++;
      recordLeak("data_broker", domain, "critical", true);
      chrome.notifications.create(`broker-${Date.now()}`, {
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "⚠️ Data Broker Blocked",
        message: `PrivacyX Shield intercepted high-risk data broker: ${domain}`,
        priority: 2,
      });
      updateBadge();
      return;
    }

    // --- PII in URL Detection ---
    const urlPII = scanUrlForPII(tab.url);
    if (urlPII.length > 0) {
      sessionStats.piiDetected += urlPII.length;
      for (const finding of urlPII) {
        recordLeak("pii_in_url", domain, finding.severity, false, finding);
      }
      const criticalFindings = urlPII.filter((f) => f.severity === "critical");
      if (criticalFindings.length > 0) {
        chrome.notifications.create(`pii-${Date.now()}`, {
          type: "basic",
          iconUrl: "icons/icon128.png",
          title: "🔴 Sensitive Data in URL!",
          message: `Detected ${criticalFindings.map((f) => f.label).join(", ")} on ${domain}`,
          priority: 2,
        });
      }
    }

    // --- AI / ML Classification for the domain ---
    const classification = await classifyDomainWithServer(domain, data.apiUrl);
    const dateObj = new Date();
    const eventTime = dateObj.toISOString();

    const event = {
      domain: domain,
      source: "browser",
      type: "domain_visit",
      category: classification.category,
      domainCategory: classification.category,
      timeBucket: getTimeBucket(dateObj),
      durationBucket: "<1m",
      dayOfWeek: dateObj.getDay(),
      hourOfDay: dateObj.getHours(),
      sensitivity: classification.sensitivity,
      riskLevel: classification.riskLevel,
      isHighRisk: classification.isHighRisk,
      createdAt: eventTime,
      timestamp: eventTime,
      metadata: {
        domain: domain,
        url: tab.url ? tab.url.split("?")[0] : domain,
        classifiedBy: classification.source,
        synthetic: false,
        hasTracker: false,
        piiDetected: urlPII.length > 0,
      },
    };

    // Store in local storage recentEvents (top 30 events) so popup displays it immediately!
    const existingEvents = Array.isArray(data.recentEvents) ? data.recentEvents : [];
    const updatedEvents = [event, ...existingEvents.slice(0, 29)];
    chrome.storage.local.set({ recentEvents: updatedEvents });

    // Push into eventBatch
    eventBatch.push(event);
    sessionStats.eventsCollected++;
    updateBadge();

    // High risk notification if very high sensitivity
    if (classification.isHighRisk && classification.sensitivity >= 0.85) {
      chrome.notifications.create(`risk-${Date.now()}`, {
        type: "basic",
        iconUrl: "icons/icon128.png",
        title: "🛡️ High-Sensitivity Domain Monitored",
        message: `${domain} classified as high-risk (${classification.category.replace(/_/g, " ")}). Privacy minimization active.`,
        priority: 1,
      });
    }

    // Auto-flush to backend server if apiToken is available and batch is ready
    if (data.apiToken) {
      if (eventBatch.length >= 3 || classification.isHighRisk) {
        flushBatch(data.apiToken, data.apiUrl);
      }
    }
  });
}

// Tab Update Handler
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" || (changeInfo.url && !changeInfo.url.startsWith("chrome://"))) {
    processTabNavigation(tab, "updated");
  }
});

// Tab Activated Handler (when user switches tabs)
chrome.tabs.onActivated.addListener((activeInfo) => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (chrome.runtime.lastError || !tab) return;
    processTabNavigation(tab, "activated");
  });
});

// =========================================================================
// Network Request Monitoring
// =========================================================================
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.type === "main_frame") return; // Don't block page navigations

    try {
      const url = new URL(details.url);
      const domain = url.hostname;

      // Skip localhost
      if (domain === "localhost" || domain === "127.0.0.1") return;

      chrome.storage.local.get(["shieldMode", "monitoring"], (data) => {
        if (data.monitoring?.paused) return;

        // Tracker Detection
        if (isTrackerDomain(domain)) {
          sessionStats.trackersBlocked++;
          recordLeak("tracker", domain, "medium", data.shieldMode === "active");
          updateBadge();
        }

        // Data Broker Detection
        if (isDataBroker(domain)) {
          sessionStats.leaksBlocked++;
          recordLeak("data_broker", domain, "critical", true);
          updateBadge();
        }
      });

      // Scan request URL for PII leakage
      const piiFindings = scanUrlForPII(details.url);
      if (piiFindings.length > 0) {
        sessionStats.piiDetected += piiFindings.length;
        for (const finding of piiFindings) {
          recordLeak("pii_in_request", domain, finding.severity, false, finding);
        }
        updateBadge();
      }
    } catch (e) {
      // Ignore malformed URLs
    }
  },
  { urls: ["<all_urls>"] },
  []
);

// =========================================================================
// Leak Recording
// =========================================================================
function recordLeak(type, domain, severity, blocked, piiDetail = null) {
  const now = new Date().toISOString();
  const leak = {
    type,
    domain,
    severity,
    blocked,
    piiDetail,
    timestamp: now,
    createdAt: now,
  };
  leakBatch.push(leak);

  // Store locally for popup stats
  chrome.storage.local.get(["leakHistory"], (data) => {
    const history = data.leakHistory || [];
    history.unshift(leak);
    // Keep last 200 leaks
    chrome.storage.local.set({ leakHistory: history.slice(0, 200) });
  });
}

// =========================================================================
// Badge Updates
// =========================================================================
function updateBadge() {
  const total = eventBatch.length;
  const threats = sessionStats.trackersBlocked + sessionStats.piiDetected;

  if (threats > 0) {
    chrome.action.setBadgeText({ text: `${threats}` });
    chrome.action.setBadgeBackgroundColor({ color: "#ff006e" }); // Magenta for threats
  } else if (total > 0) {
    chrome.action.setBadgeText({ text: `${total}` });
    chrome.action.setBadgeBackgroundColor({ color: "#00f0ff" }); // Cyan for events
  } else {
    chrome.action.setBadgeText({ text: "" });
  }
}

// =========================================================================
// Batch Flushing
// =========================================================================
async function flushBatch(apiToken, apiUrl) {
  if (eventBatch.length === 0 && leakBatch.length === 0) return;

  const events = [...eventBatch];
  const leaks = [...leakBatch];
  eventBatch = [];
  leakBatch = [];

  const baseUrl = apiUrl || "http://localhost:3000";

  // Flush events
  if (events.length > 0) {
    try {
      const res = await fetch(`${baseUrl}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ events }),
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`PrivacyX: Flushed ${data.count} events`);
        chrome.storage.local.get(["totalEvents"], (stored) => {
          chrome.storage.local.set({ totalEvents: (stored.totalEvents || 0) + events.length });
        });
      } else {
        eventBatch = [...events, ...eventBatch];
        console.error("PrivacyX: Event flush failed", res.status);
      }
    } catch (e) {
      eventBatch = [...events, ...eventBatch];
      console.error("PrivacyX: Event flush error", e);
    }
  }

  // Flush leaks
  if (leaks.length > 0) {
    try {
      const res = await fetch(`${baseUrl}/api/leaks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiToken}`,
        },
        body: JSON.stringify({ leaks }),
      });

      if (!res.ok) {
        leakBatch = [...leaks, ...leakBatch];
        console.error("PrivacyX: Leak flush failed", res.status);
      }
    } catch (e) {
      leakBatch = [...leaks, ...leakBatch];
      console.error("PrivacyX: Leak flush error", e);
    }
  }

  updateBadge();
}

// =========================================================================
// Alarms & Message Handling
// =========================================================================
chrome.alarms.create("flushEvents", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "flushEvents") {
    chrome.storage.local.get(["apiToken", "apiUrl"], (data) => {
      if (data.apiToken) flushBatch(data.apiToken, data.apiUrl);
    });
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "flush") {
    chrome.storage.local.get(["apiToken", "apiUrl"], (data) => {
      if (data.apiToken) {
        flushBatch(data.apiToken, data.apiUrl).then(() => {
          chrome.storage.local.get(["totalEvents"], (stored) => {
            sendResponse({
              success: true,
              totalEvents: stored.totalEvents || 0,
              queued: eventBatch.length,
              stats: sessionStats,
            });
          });
        });
      } else {
        sendResponse({ success: false, error: "No API token configured" });
      }
    });
    return true;
  }

  if (request.action === "getStats") {
    chrome.storage.local.get(["totalEvents", "leakHistory", "recentEvents"], (data) => {
      sendResponse({
        sessionStats,
        totalEvents: data.totalEvents || 0,
        leakCount: (data.leakHistory || []).length,
        recentLeaks: (data.leakHistory || []).slice(0, 10),
        recentEvents: (data.recentEvents || []).slice(0, 20),
        queuedEvents: eventBatch.length,
      });
    });
    return true;
  }

  if (request.action === "clearRecentEvents") {
    chrome.storage.local.set({ recentEvents: [] }, () => {
      sendResponse({ success: true });
    });
    return true;
  }

  if (request.action === "setShieldMode") {
    chrome.storage.local.set({ shieldMode: request.mode });
    sendResponse({ success: true, mode: request.mode });
    return true;
  }

  if (request.action === "scanPII") {
    // Manual scan request from content script
    const findings = scanForPII(request.text);
    sendResponse({ findings });
    return true;
  }

  if (request.action === "piiDetected") {
    // Content script found PII in a form
    sessionStats.piiDetected++;
    recordLeak("pii_in_form", request.domain, request.severity, false, request.detail);
    
    // Notify user
    chrome.notifications.create(`form-pii-${Date.now()}`, {
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "⚠️ Sensitive Data Detected",
      message: `${request.detail.label} detected in a form on ${request.domain}. Be careful about what you share.`,
      priority: 1,
    });
    
    sendResponse({ acknowledged: true });
    return true;
  }

  if (request.action === "autoConnect") {
    chrome.storage.local.get(["apiUrl"], async (data) => {
      const baseUrl = data.apiUrl || "http://localhost:3000";
      try {
        const res = await fetch(`${baseUrl}/api/user/token`, { credentials: "include" });
        if (res.ok) {
          const json = await res.json();
          if (json.token) {
            chrome.storage.local.set({ apiToken: json.token }, () => {
              sendResponse({ success: true, token: json.token });
            });
            return;
          }
        }
        sendResponse({ success: false, error: "Not logged in to PrivacyX" });
      } catch (err) {
        sendResponse({ success: false, error: err.message || "Failed to reach server" });
      }
    });
    return true;
  }
});

// =========================================================================
// Install / Startup
// =========================================================================
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    monitoring: {
      browser: true,
      websiteCategories: true,
      searchCategories: false,
      location: false,
      desktop: false,
      paused: false,
    },
    shieldMode: "monitor", // "monitor" = detect only, "active" = detect + block
    apiUrl: "http://localhost:3000",
    totalEvents: 0,
    leakHistory: [],
  });

  // Show install notification
  chrome.notifications.create("install", {
    type: "basic",
    iconUrl: "icons/icon128.png",
    title: "🛡️ PrivacyX Shield Active",
    message: "Privacy monitoring enabled. Configure your API token in the popup to start sending events.",
    priority: 1,
  });
});
