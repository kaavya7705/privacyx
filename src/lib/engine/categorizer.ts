/**
 * Domain Categorizer & AI/ML Privacy Risk Classifier
 * Maps domains to high-level privacy categories and assesses sensitivity scores
 */

import { getGroqClient } from "@/lib/groq";

export const DOMAIN_CATEGORIES: Record<string, string[]> = {
  technology: [
    "github.com", "stackoverflow.com", "developer.mozilla.org", "npmjs.com",
    "gitlab.com", "bitbucket.org", "codepen.io", "replit.com", "vercel.com",
    "netlify.com", "heroku.com", "aws.amazon.com", "cloud.google.com",
    "azure.microsoft.com", "digitalocean.com", "docker.com", "kubernetes.io",
    "hackernews.com", "news.ycombinator.com", "dev.to", "medium.com",
    "techcrunch.com", "theverge.com", "arstechnica.com", "wired.com",
    "openai.com", "anthropic.com", "huggingface.co", "producthunt.com",
  ],
  education: [
    "coursera.org", "udemy.com", "edx.org", "khanacademy.org",
    "mit.edu", "stanford.edu", "harvard.edu", "oxfordonline.com",
    "scholar.google.com", "academia.edu", "researchgate.net",
    "wikipedia.org", "britannica.com", "quizlet.com", "duolingo.com",
  ],
  career: [
    "linkedin.com", "indeed.com", "glassdoor.com", "monster.com",
    "ziprecruiter.com", "angel.co", "wellfound.com", "hired.com",
    "lever.co", "greenhouse.io", "workday.com", "upwork.com", "fiverr.com",
  ],
  finance: [
    "bloomberg.com", "reuters.com", "wsj.com", "cnbc.com",
    "marketwatch.com", "yahoo.com/finance", "investing.com",
    "bankofamerica.com", "chase.com", "wellsfargo.com", "paypal.com",
    "stripe.com", "robinhood.com", "coinbase.com", "binance.com",
    "fidelity.com", "vanguard.com", "mint.intuit.com",
  ],
  healthcare: [
    "webmd.com", "mayoclinic.org", "healthline.com", "nih.gov",
    "cdc.gov", "who.int", "medlineplus.gov", "drugs.com",
    "medscape.com", "pubmed.ncbi.nlm.nih.gov", "cvs.com", "walgreens.com",
    "goodrx.com", "psychologytoday.com", "plannedparenthood.org",
  ],
  shopping: [
    "amazon.com", "ebay.com", "walmart.com", "target.com",
    "bestbuy.com", "etsy.com", "aliexpress.com", "shopify.com",
    "flipkart.com", "myntra.com", "shein.com", "zara.com", "nike.com",
  ],
  entertainment: [
    "youtube.com", "netflix.com", "twitch.tv", "spotify.com",
    "hulu.com", "disneyplus.com", "primevideo.com", "hbomax.com",
    "imdb.com", "rottentomatoes.com", "soundcloud.com", "tiktok.com",
    "music.apple.com", "vimeo.com",
  ],
  social: [
    "facebook.com", "twitter.com", "x.com", "instagram.com",
    "reddit.com", "snapchat.com", "pinterest.com",
    "tumblr.com", "discord.com", "threads.net", "telegram.org", "whatsapp.com",
  ],
  travel: [
    "booking.com", "airbnb.com", "expedia.com", "tripadvisor.com",
    "kayak.com", "skyscanner.com", "hotels.com", "maps.google.com",
    "flightradar24.com", "makemytrip.com", "goibibo.com", "uber.com", "lyft.com",
  ],
  news: [
    "bbc.com", "cnn.com", "nytimes.com", "theguardian.com",
    "washingtonpost.com", "apnews.com", "aljazeera.com",
    "ndtv.com", "timesofindia.indiatimes.com", "forbes.com",
  ],
  sports: [
    "espn.com", "sports.yahoo.com", "nba.com", "nfl.com",
    "fifa.com", "cricbuzz.com", "espncricinfo.com",
    "bbc.com/sport", "bleacherreport.com", "strava.com",
  ],
  gaming: [
    "store.steampowered.com", "epicgames.com", "xbox.com",
    "playstation.com", "ign.com", "gamespot.com", "kotaku.com",
    "roblox.com", "ea.com", "blizzard.com", "riotgames.com",
  ],
  developer_tools: [
    "github.com", "gitlab.com", "vscode.dev", "codespaces.github.com",
    "codesandbox.io", "jsfiddle.net", "localhost", "127.0.0.1",
  ],
  search: [
    "google.com", "bing.com", "duckduckgo.com", "yahoo.com",
    "baidu.com", "yandex.com", "kagi.com", "brave.com",
  ],
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  healthcare: ["health", "med", "doctor", "clinic", "hospital", "pharma", "rx", "pill", "care", "cure", "patient", "disease", "therapy", "psych", "dental"],
  finance: ["bank", "finance", "invest", "trade", "stock", "crypto", "pay", "money", "wallet", "credit", "loan", "fund", "insur", "asset", "wealth"],
  career: ["job", "career", "hire", "recruit", "resume", "work", "employ", "intern", "staff", "talent"],
  technology: ["tech", "dev", "code", "program", "software", "api", "cloud", "data", "cyber", "system", "host", "ai", "ml", "bot", "algorithm"],
  education: ["edu", "learn", "course", "university", "school", "study", "tutorial", "academy", "college", "lecture", "degree"],
  shopping: ["shop", "store", "buy", "deal", "sale", "market", "cart", "product", "price", "order", "retail"],
  entertainment: ["movie", "music", "video", "stream", "show", "cinema", "song", "tune", "film"],
  social: ["social", "chat", "message", "friend", "community", "forum", "network", "connect"],
  travel: ["travel", "hotel", "flight", "booking", "trip", "tour", "vacation", "map", "airline", "stay", "resort"],
  news: ["news", "press", "journal", "report", "daily", "times", "herald", "gazette", "post", "chronicle"],
  sports: ["sport", "team", "league", "score", "match", "player", "athlete", "fitness", "gym", "workout"],
  gaming: ["game", "gaming", "esport", "steam", "play", "quest", "arcade"],
};

export type DomainClassificationResult = {
  category: string;
  sensitivity: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  source: "exact" | "keywords" | "groq_ai" | "heuristic_ml";
  rationale: string;
};

// In-memory cache for fast repeated classification
const classificationCache = new Map<string, DomainClassificationResult>();

export function categorizeDomain(domain: string): string {
  const normalized = domain.toLowerCase().replace(/^www\./, "");

  // Check exact/substring domain matches
  for (const [category, domains] of Object.entries(DOMAIN_CATEGORIES)) {
    if (domains.some((d) => normalized === d || normalized.endsWith(`.${d}`) || normalized.includes(d))) {
      return category;
    }
  }

  // TLD Heuristics
  if (normalized.endsWith(".edu") || normalized.includes(".edu.")) return "education";
  if (normalized.endsWith(".gov") || normalized.includes(".gov.")) return "government";

  // Check keyword-based matching
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => normalized.includes(kw))) {
      return category;
    }
  }

  // If unrecognized, derive a clean label instead of "unknown"
  const parts = normalized.split(".");
  const mainPart = parts.length > 1 ? parts[parts.length - 2] : parts[0];
  if (mainPart && mainPart.length > 2) {
    return `${mainPart}_activity`;
  }

  return "general_web";
}

export function getSensitivity(category: string): number {
  const sensitivityMap: Record<string, number> = {
    healthcare: 0.95,
    finance: 0.90,
    career: 0.75,
    government: 0.75,
    social: 0.65,
    travel: 0.60,
    shopping: 0.50,
    search: 0.45,
    education: 0.35,
    entertainment: 0.30,
    technology: 0.20,
    developer_tools: 0.20,
    news: 0.25,
    sports: 0.20,
    gaming: 0.20,
    general_web: 0.40,
    unknown: 0.40,
  };
  return sensitivityMap[category] ?? 0.45;
}

/**
 * AI & ML-Powered Domain Classifier
 * Dynamically classifies unfamiliar domains, identifies high-risk exposure,
 * and determines behavioral sensitivity.
 */
export async function classifyDomainWithAI(domain: string): Promise<DomainClassificationResult> {
  const normalized = domain.toLowerCase().replace(/^www\./, "").trim();

  // Check cache
  if (classificationCache.has(normalized)) {
    return classificationCache.get(normalized)!;
  }

  // 1. Try exact predefined domain matching
  for (const [category, domains] of Object.entries(DOMAIN_CATEGORIES)) {
    if (domains.some((d) => normalized === d || normalized.endsWith(`.${d}`))) {
      const sensitivity = getSensitivity(category);
      const riskLevel: "low" | "medium" | "high" | "critical" =
        sensitivity >= 0.85 ? "critical" : sensitivity >= 0.65 ? "high" : sensitivity >= 0.45 ? "medium" : "low";
      const result: DomainClassificationResult = {
        category,
        sensitivity,
        riskLevel,
        source: "exact",
        rationale: `Matched established catalog for ${category} domain patterns.`,
      };
      classificationCache.set(normalized, result);
      return result;
    }
  }

  // 2. Try keyword heuristics
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => normalized.includes(kw))) {
      const sensitivity = getSensitivity(category);
      const riskLevel: "low" | "medium" | "high" | "critical" =
        sensitivity >= 0.85 ? "critical" : sensitivity >= 0.65 ? "high" : sensitivity >= 0.45 ? "medium" : "low";
      const result: DomainClassificationResult = {
        category,
        sensitivity,
        riskLevel,
        source: "keywords",
        rationale: `Classified via privacy keyword signal matching (${category}).`,
      };
      classificationCache.set(normalized, result);
      return result;
    }
  }

  // 3. Try Groq AI for unknown domains if API key is present
  try {
    const groq = getGroqClient();
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content: `You are an automated privacy and cybersecurity domain classifier. Output ONLY valid JSON in this exact schema:
{"category": "healthcare"|"finance"|"career"|"technology"|"social"|"shopping"|"education"|"news"|"entertainment"|"travel"|"gaming"|"government"|"general_web", "sensitivity": number between 0.1 and 0.95, "riskLevel": "low"|"medium"|"high"|"critical", "rationale": "short explanation under 15 words"}`,
        },
        {
          role: "user",
          content: `Classify the domain: ${normalized}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 150,
      response_format: { type: "json_object" },
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || "{}");
    if (parsed.category) {
      const category = parsed.category.toLowerCase();
      const sensitivity = typeof parsed.sensitivity === "number" ? parsed.sensitivity : getSensitivity(category);
      const rawRisk = parsed.riskLevel;
      const riskLevel: "low" | "medium" | "high" | "critical" =
        rawRisk === "critical" || rawRisk === "high" || rawRisk === "medium" || rawRisk === "low"
          ? rawRisk
          : sensitivity >= 0.85
          ? "critical"
          : sensitivity >= 0.65
          ? "high"
          : sensitivity >= 0.45
          ? "medium"
          : "low";
      const result: DomainClassificationResult = {
        category,
        sensitivity,
        riskLevel,
        source: "groq_ai",
        rationale: parsed.rationale || `AI verified classification as ${category}.`,
      };
      classificationCache.set(normalized, result);
      return result;
    }
  } catch {
    // Fall through to heuristic ML on Groq error or missing API key
  }

  // 4. Heuristic fallback: Extract SLD brand and assign reasonable sensitivity
  const parts = normalized.split(".");
  const sld = parts.length > 1 ? parts[parts.length - 2] : parts[0];
  const category = sld && sld.length > 2 ? `${sld}` : "general_web";
  const sensitivity = 0.45;
  const result = {
    category,
    sensitivity,
    riskLevel: "medium" as const,
    source: "heuristic_ml" as const,
    rationale: `Pattern-derived domain profile for ${normalized}.`,
  };
  classificationCache.set(normalized, result);
  return result;
}

export const ALL_CATEGORIES = Object.keys(DOMAIN_CATEGORIES);
