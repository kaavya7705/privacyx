/**
 * Domain Categorizer — maps domains to high-level privacy categories
 * Used both in the browser extension (JS) and server (TS)
 */

export const DOMAIN_CATEGORIES: Record<string, string[]> = {
  technology: [
    "github.com", "stackoverflow.com", "developer.mozilla.org", "npmjs.com",
    "gitlab.com", "bitbucket.org", "codepen.io", "replit.com", "vercel.com",
    "netlify.com", "heroku.com", "aws.amazon.com", "cloud.google.com",
    "azure.microsoft.com", "digitalocean.com", "docker.com", "kubernetes.io",
    "hackernews.com", "news.ycombinator.com", "dev.to", "medium.com",
    "techcrunch.com", "theverge.com", "arstechnica.com", "wired.com",
  ],
  education: [
    "coursera.org", "udemy.com", "edx.org", "khanacademy.org",
    "mit.edu", "stanford.edu", "harvard.edu", "oxfordonline.com",
    "scholar.google.com", "academia.edu", "researchgate.net",
    "wikipedia.org", "britannica.com", "quizlet.com",
  ],
  career: [
    "linkedin.com", "indeed.com", "glassdoor.com", "monster.com",
    "ziprecruiter.com", "angel.co", "wellfound.com", "hired.com",
    "lever.co", "greenhouse.io", "workday.com",
  ],
  finance: [
    "bloomberg.com", "reuters.com", "wsj.com", "cnbc.com",
    "marketwatch.com", "yahoo.com/finance", "investing.com",
    "bankofamerica.com", "chase.com", "wellsfargo.com",
    "robinhood.com", "coinbase.com", "binance.com",
  ],
  healthcare: [
    "webmd.com", "mayoclinic.org", "healthline.com", "nih.gov",
    "cdc.gov", "who.int", "medlineplus.gov", "drugs.com",
    "medscape.com", "pubmed.ncbi.nlm.nih.gov",
  ],
  shopping: [
    "amazon.com", "ebay.com", "walmart.com", "target.com",
    "bestbuy.com", "etsy.com", "aliexpress.com", "shopify.com",
    "flipkart.com", "myntra.com",
  ],
  entertainment: [
    "youtube.com", "netflix.com", "twitch.tv", "spotify.com",
    "hulu.com", "disneyplus.com", "primevideo.com", "hbomax.com",
    "imdb.com", "rottentomatoes.com", "soundcloud.com",
  ],
  social: [
    "facebook.com", "twitter.com", "x.com", "instagram.com",
    "reddit.com", "tiktok.com", "snapchat.com", "pinterest.com",
    "tumblr.com", "discord.com", "threads.net",
  ],
  travel: [
    "booking.com", "airbnb.com", "expedia.com", "tripadvisor.com",
    "kayak.com", "skyscanner.com", "hotels.com", "maps.google.com",
    "flightradar24.com", "makemytrip.com", "goibibo.com",
  ],
  news: [
    "bbc.com", "cnn.com", "nytimes.com", "theguardian.com",
    "washingtonpost.com", "reuters.com", "apnews.com",
    "aljazeera.com", "ndtv.com", "timesofindia.indiatimes.com",
  ],
  sports: [
    "espn.com", "sports.yahoo.com", "nba.com", "nfl.com",
    "fifa.com", "cricbuzz.com", "espncricinfo.com",
    "bbc.com/sport", "bleacherreport.com",
  ],
  gaming: [
    "store.steampowered.com", "epicgames.com", "xbox.com",
    "playstation.com", "ign.com", "gamespot.com", "kotaku.com",
    "twitch.tv", "roblox.com", "ea.com",
  ],
  developer_tools: [
    "github.com", "gitlab.com", "vscode.dev", "codespaces.github.com",
    "codesandbox.io", "jsfiddle.net", "localhost",
  ],
  search: [
    "google.com", "bing.com", "duckduckgo.com", "yahoo.com",
    "baidu.com", "yandex.com",
  ],
};

// Keyword-based category detection for domains not in the list
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  technology: ["tech", "dev", "code", "program", "software", "api", "cloud", "data", "cyber"],
  education: ["edu", "learn", "course", "university", "school", "study", "tutorial", "academy"],
  career: ["job", "career", "hire", "recruit", "resume", "work", "employ"],
  finance: ["bank", "finance", "invest", "trade", "stock", "crypto", "pay", "money"],
  healthcare: ["health", "medical", "doctor", "hospital", "pharmacy", "clinic", "wellness"],
  shopping: ["shop", "store", "buy", "deal", "sale", "market", "cart", "product"],
  entertainment: ["movie", "music", "video", "stream", "game", "play", "watch", "listen"],
  social: ["social", "chat", "message", "friend", "community", "forum", "network"],
  travel: ["travel", "hotel", "flight", "booking", "trip", "tour", "vacation", "map"],
  news: ["news", "press", "journal", "report", "daily", "times", "herald", "gazette"],
  sports: ["sport", "team", "league", "score", "match", "player", "athlete", "fitness"],
  gaming: ["game", "gaming", "esport", "steam", "xbox", "playstation", "nintendo"],
};

export function categorizeDomain(domain: string): string {
  const normalizedDomain = domain.toLowerCase().replace(/^www\./, "");

  // Check exact domain matches
  for (const [category, domains] of Object.entries(DOMAIN_CATEGORIES)) {
    if (domains.some((d) => normalizedDomain.includes(d) || d.includes(normalizedDomain))) {
      return category;
    }
  }

  // Check keyword-based matching
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => normalizedDomain.includes(kw))) {
      return category;
    }
  }

  return "unknown";
}

export function getSensitivity(category: string): number {
  const sensitivityMap: Record<string, number> = {
    healthcare: 0.9,
    finance: 0.8,
    career: 0.7,
    social: 0.6,
    travel: 0.6,
    shopping: 0.5,
    education: 0.3,
    entertainment: 0.3,
    technology: 0.2,
    developer_tools: 0.2,
    news: 0.2,
    sports: 0.2,
    gaming: 0.2,
    search: 0.4,
    unknown: 0.5,
  };
  return sensitivityMap[category] ?? 0.5;
}

export const ALL_CATEGORIES = Object.keys(DOMAIN_CATEGORIES);
