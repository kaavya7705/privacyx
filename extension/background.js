/**
 * PrivacyX Extension — Background Service Worker
 * Manifest V3 — Collects ONLY privacy-relevant metadata
 * NO passwords, NO keystrokes, NO page content, NO private messages
 */

// Domain categorization (mirrors server-side categorizer)
const DOMAIN_CATEGORIES = {
  technology: ["github.com", "stackoverflow.com", "npmjs.com", "gitlab.com", "dev.to", "medium.com", "techcrunch.com", "hackernews.com", "news.ycombinator.com"],
  education: ["coursera.org", "udemy.com", "edx.org", "khanacademy.org", "scholar.google.com", "wikipedia.org", "academia.edu"],
  career: ["linkedin.com", "indeed.com", "glassdoor.com", "wellfound.com"],
  finance: ["bloomberg.com", "cnbc.com", "yahoo.com/finance", "coinbase.com"],
  healthcare: ["webmd.com", "mayoclinic.org", "healthline.com", "nih.gov"],
  shopping: ["amazon.com", "ebay.com", "walmart.com", "flipkart.com", "myntra.com"],
  entertainment: ["youtube.com", "netflix.com", "twitch.tv", "spotify.com"],
  social: ["facebook.com", "twitter.com", "x.com", "instagram.com", "reddit.com", "tiktok.com", "discord.com"],
  travel: ["booking.com", "airbnb.com", "maps.google.com", "makemytrip.com"],
  news: ["bbc.com", "cnn.com", "nytimes.com", "ndtv.com"],
  sports: ["espn.com", "cricbuzz.com"],
  gaming: ["store.steampowered.com", "epicgames.com"],
  developer_tools: ["github.com", "gitlab.com", "vscode.dev", "replit.com"],
  search: ["google.com", "bing.com", "duckduckgo.com"],
};

function categorizeDomain(domain) {
  const normalized = domain.toLowerCase().replace(/^www\./, "");
  for (const [category, domains] of Object.entries(DOMAIN_CATEGORIES)) {
    if (domains.some(d => normalized.includes(d))) return category;
  }
  return "unknown";
}

function getTimeBucket(date) {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = Math.floor(date.getMinutes() / 15) * 15;
  const minutesStr = minutes.toString().padStart(2, "0");
  const endMinutes = (minutes + 15) % 60;
  const endHours = endMinutes === 0 ? (date.getHours() + 1) % 24 : date.getHours();
  return `${hours}:${minutesStr}-${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
}

// Event batch
let eventBatch = [];
const BATCH_INTERVAL = 60000; // 1 minute
const MAX_BATCH_SIZE = 50;

// Process tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete" || !tab.url) return;

  // Skip internal chrome pages
  if (tab.url.startsWith("chrome://") || tab.url.startsWith("chrome-extension://")) return;
  if (tab.url.startsWith("about:")) return;

  chrome.storage.local.get(["monitoring", "apiToken", "apiUrl"], (data) => {
    if (!data.monitoring || data.monitoring.paused) return;
    if (!data.apiToken) return;

    try {
      const url = new URL(tab.url);
      const domain = url.hostname;

      // Skip localhost / the PrivacyX app itself
      if (domain === "localhost" || domain === "127.0.0.1") return;

      const category = categorizeDomain(domain);
      const now = new Date();

      const event = {
        source: "browser",
        type: "domain_visit",
        category: category,
        domainCategory: category,
        timeBucket: getTimeBucket(now),
        durationBucket: "<1m",
        dayOfWeek: now.getDay(),
        hourOfDay: now.getHours(),
        sensitivity: getSensitivity(category),
        metadata: { synthetic: false },
      };

      eventBatch.push(event);

      // Update badge
      chrome.action.setBadgeText({ text: String(eventBatch.length) });
      chrome.action.setBadgeBackgroundColor({ color: "#00f0ff" });

      // Auto-flush if batch is full
      if (eventBatch.length >= MAX_BATCH_SIZE) {
        flushBatch(data.apiToken, data.apiUrl);
      }
    } catch (e) {
      console.error("PrivacyX: Error processing tab update", e);
    }
  });
});

function getSensitivity(category) {
  const map = {
    healthcare: 0.9, finance: 0.8, career: 0.7, social: 0.6, travel: 0.6,
    shopping: 0.5, education: 0.3, entertainment: 0.3, technology: 0.2,
    developer_tools: 0.2, news: 0.2, sports: 0.2, gaming: 0.2, search: 0.4,
  };
  return map[category] || 0.5;
}

async function flushBatch(apiToken, apiUrl) {
  if (eventBatch.length === 0) return;

  const events = [...eventBatch];
  eventBatch = [];

  try {
    const url = (apiUrl || "http://localhost:3000") + "/api/events";
    const res = await fetch(url, {
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
      chrome.action.setBadgeText({ text: "" });

      // Update total count
      chrome.storage.local.get(["totalEvents"], (stored) => {
        chrome.storage.local.set({ totalEvents: (stored.totalEvents || 0) + events.length });
      });
    } else {
      // Put events back
      eventBatch = [...events, ...eventBatch];
      console.error("PrivacyX: Flush failed", res.status);
    }
  } catch (e) {
    eventBatch = [...events, ...eventBatch];
    console.error("PrivacyX: Flush error", e);
  }
}

// Set up periodic flush
chrome.alarms.create("flushEvents", { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "flushEvents") {
    chrome.storage.local.get(["apiToken", "apiUrl"], (data) => {
      if (data.apiToken) flushBatch(data.apiToken, data.apiUrl);
    });
  }
});

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "flush") {
    chrome.storage.local.get(["apiToken", "apiUrl"], (data) => {
      if (data.apiToken) {
        flushBatch(data.apiToken, data.apiUrl).then(() => {
          chrome.storage.local.get(["totalEvents"], (stored) => {
            sendResponse({ success: true, totalEvents: stored.totalEvents || 0, queued: eventBatch.length });
          });
        });
      } else {
        sendResponse({ success: false, error: "No API token configured" });
      }
    });
    return true; // Keep message channel open for async response
  }
});

// Initialize on install
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
    apiUrl: "http://localhost:3000",
    totalEvents: 0,
  });
});

