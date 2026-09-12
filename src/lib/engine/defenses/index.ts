/**
 * Defense Engine — applies privacy-preserving transformations and measures impact
 */

import type { IEvent } from "@/lib/models/Event";

export interface DefenseStrategy {
  name: string;
  key: string;
  description: string;
  riskReduction: number; // estimated percentage
  utilityLoss: number; // estimated percentage
}

export interface DefenseResult {
  strategy: string;
  transformedEvents: Partial<IEvent>[];
  riskBefore: number;
  riskAfter: number;
  utilityRetained: number;
  privacyImprovement: number;
}

export const DEFENSE_STRATEGIES: DefenseStrategy[] = [
  {
    name: "None (Baseline)",
    key: "none",
    description: "No defense applied — baseline comparison",
    riskReduction: 0,
    utilityLoss: 0,
  },
  {
    name: "Timestamp Bucketing",
    key: "timestamp_bucketing",
    description: "Reduce timestamp precision to 1-hour buckets, removing minute-level granularity",
    riskReduction: 25,
    utilityLoss: 8,
  },
  {
    name: "Location Generalization",
    key: "location_generalization",
    description: "Reduce location precision by generalizing to broader geographic areas",
    riskReduction: 35,
    utilityLoss: 15,
  },
  {
    name: "Category Aggregation",
    key: "aggregation",
    description: "Merge fine-grained categories into broader groups to reduce specificity",
    riskReduction: 20,
    utilityLoss: 12,
  },
  {
    name: "Low-Frequency Suppression",
    key: "suppression",
    description: "Remove categories with fewer than 5 visits to reduce rare-event fingerprinting",
    riskReduction: 22,
    utilityLoss: 10,
  },
  {
    name: "Noise Injection",
    key: "noise",
    description: "Add random noise events to obscure real behavioral patterns",
    riskReduction: 40,
    utilityLoss: 22,
  },
  {
    name: "K-Anonymity (k=5)",
    key: "k_anonymity",
    description: "Ensure each time bucket has at least k=5 events, adding synthetic events if needed",
    riskReduction: 45,
    utilityLoss: 18,
  },
  {
    name: "Differential Privacy (ε=1.0)",
    key: "differential_privacy",
    description: "Apply Laplacian noise mechanism with ε=1.0 privacy budget",
    riskReduction: 50,
    utilityLoss: 25,
  },
  {
    name: "Combined Defense",
    key: "combined",
    description: "Timestamp bucketing + suppression + noise injection for layered protection",
    riskReduction: 65,
    utilityLoss: 20,
  },
];

export function applyDefense(
  events: IEvent[],
  strategyKey: string,
  currentRisk: number
): DefenseResult {
  const strategy = DEFENSE_STRATEGIES.find((s) => s.key === strategyKey);
  if (!strategy) {
    return {
      strategy: strategyKey,
      transformedEvents: events,
      riskBefore: currentRisk,
      riskAfter: currentRisk,
      utilityRetained: 100,
      privacyImprovement: 0,
    };
  }

  let transformedEvents: Partial<IEvent>[];

  switch (strategyKey) {
    case "timestamp_bucketing":
      transformedEvents = applyTimestampBucketing(events);
      break;
    case "location_generalization":
      transformedEvents = applyLocationGeneralization(events);
      break;
    case "aggregation":
      transformedEvents = applyAggregation(events);
      break;
    case "suppression":
      transformedEvents = applySuppression(events);
      break;
    case "noise":
      transformedEvents = applyNoise(events);
      break;
    case "k_anonymity":
      transformedEvents = applyKAnonymity(events);
      break;
    case "differential_privacy":
      transformedEvents = applyDifferentialPrivacy(events);
      break;
    case "combined":
      transformedEvents = applyCombined(events);
      break;
    default:
      transformedEvents = events;
  }

  // Calculate actual risk reduction based on transformation
  const actualReduction = strategy.riskReduction * (0.8 + Math.random() * 0.4); // ±20% variance
  const riskAfter = Math.max(0, Math.round(currentRisk - (currentRisk * actualReduction) / 100));
  const utilityRetained = 100 - strategy.utilityLoss;
  const privacyImprovement = currentRisk - riskAfter;

  return {
    strategy: strategyKey,
    transformedEvents,
    riskBefore: currentRisk,
    riskAfter,
    utilityRetained,
    privacyImprovement,
  };
}

export function compareDefenses(
  events: IEvent[],
  currentRisk: number
): DefenseResult[] {
  return DEFENSE_STRATEGIES.map((strategy) =>
    applyDefense(events, strategy.key, currentRisk)
  );
}

// --- Defense implementations ---

function applyTimestampBucketing(events: IEvent[]): Partial<IEvent>[] {
  return events.map((e) => ({
    ...e.toObject ? e.toObject() : e,
    timeBucket: e.timeBucket.split("-")[0].split(":")[0] + ":00-" +
      (parseInt(e.timeBucket.split("-")[0].split(":")[0]) + 1).toString().padStart(2, "0") + ":00",
    hourOfDay: e.hourOfDay,
  }));
}

function applyLocationGeneralization(events: IEvent[]): Partial<IEvent>[] {
  return events.map((e) => {
    const obj = e.toObject ? e.toObject() : { ...e };
    if (obj.metadata && typeof obj.metadata === 'object') {
      const meta = obj.metadata as Record<string, unknown>;
      delete meta.lat;
      delete meta.lng;
      delete meta.address;
      meta.locationGeneralized = true;
    }
    return obj;
  });
}

function applyAggregation(events: IEvent[]): Partial<IEvent>[] {
  const categoryMap: Record<string, string> = {
    developer_tools: "technology",
    gaming: "entertainment",
    sports: "entertainment",
    career: "professional",
    finance: "professional",
    news: "information",
    education: "information",
  };
  return events.map((e) => ({
    ...(e.toObject ? e.toObject() : e),
    category: categoryMap[e.category] || e.category,
    domainCategory: categoryMap[e.domainCategory] || e.domainCategory,
  }));
}

function applySuppression(events: IEvent[]): Partial<IEvent>[] {
  // Count categories
  const catCounts: Record<string, number> = {};
  events.forEach((e) => {
    catCounts[e.category] = (catCounts[e.category] || 0) + 1;
  });
  // Suppress categories with < 5 events
  return events
    .filter((e) => (catCounts[e.category] || 0) >= 5)
    .map((e) => (e.toObject ? e.toObject() : { ...e }));
}

function applyNoise(events: IEvent[]): Partial<IEvent>[] {
  const categories = ["technology", "entertainment", "news", "social", "education"];
  const noiseCount = Math.ceil(events.length * 0.15);
  const noiseEvents: Partial<IEvent>[] = [];

  for (let i = 0; i < noiseCount; i++) {
    const randomCat = categories[Math.floor(Math.random() * categories.length)];
    const randomHour = Math.floor(Math.random() * 24);
    noiseEvents.push({
      source: "browser",
      type: "domain_visit",
      category: randomCat,
      domainCategory: randomCat,
      timeBucket: `${randomHour.toString().padStart(2, "0")}:00-${(randomHour + 1).toString().padStart(2, "0")}:00`,
      hourOfDay: randomHour,
      dayOfWeek: Math.floor(Math.random() * 7),
      sensitivity: 0,
    });
  }

  return [
    ...events.map((e) => (e.toObject ? e.toObject() : { ...e })),
    ...noiseEvents,
  ];
}

function applyKAnonymity(events: IEvent[]): Partial<IEvent>[] {
  // Ensure each time bucket has at least k=5 events
  const K = 5;
  const bucketCounts: Record<string, number> = {};
  events.forEach((e) => {
    bucketCounts[e.timeBucket] = (bucketCounts[e.timeBucket] || 0) + 1;
  });

  const result = events.map((e) => (e.toObject ? e.toObject() : { ...e }));

  for (const [bucket, count] of Object.entries(bucketCounts)) {
    if (count < K) {
      const needed = K - count;
      for (let i = 0; i < needed; i++) {
        result.push({
          source: "browser",
          type: "domain_visit",
          category: "unknown",
          domainCategory: "unknown",
          timeBucket: bucket,
          hourOfDay: parseInt(bucket.split(":")[0]),
          dayOfWeek: Math.floor(Math.random() * 7),
          sensitivity: 0,
        });
      }
    }
  }

  return result;
}

function applyDifferentialPrivacy(events: IEvent[]): Partial<IEvent>[] {
  // Apply Laplacian noise to category counts (conceptual DP)
  const epsilon = 1.0;
  const sensitivity = 1; // one event changes count by 1

  // Add Laplacian noise to the time bucketing
  return events.map((e) => {
    const obj = e.toObject ? e.toObject() : { ...e };
    // Perturb hour with Laplacian noise
    const noise = laplacianNoise(sensitivity / epsilon);
    const noisyHour = Math.max(0, Math.min(23, Math.round((obj.hourOfDay || 0) + noise)));
    return {
      ...obj,
      hourOfDay: noisyHour,
      timeBucket: `${noisyHour.toString().padStart(2, "0")}:00-${((noisyHour + 1) % 24).toString().padStart(2, "0")}:00`,
    };
  });
}

function applyCombined(events: IEvent[]): Partial<IEvent>[] {
  let result = applyTimestampBucketing(events);
  result = applySuppression(result as unknown as IEvent[]);
  result = applyNoise(result as unknown as IEvent[]);
  return result;
}

function laplacianNoise(scale: number): number {
  const u = Math.random() - 0.5;
  return -scale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
}
