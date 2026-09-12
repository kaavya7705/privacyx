/**
 * Feature Engineering Engine
 * Extracts behavioral features from raw privacy events for ML and attack analysis
 */

import type { IEvent } from "@/lib/models/Event";

export interface TemporalFeatures {
  hourDistribution: number[]; // 24 bins
  dayOfWeekDistribution: number[]; // 7 bins
  peakHour: number;
  peakDay: number;
  nightActivity: number; // 22:00–06:00
  morningActivity: number; // 06:00–10:00
  workdayActivity: number; // Mon-Fri
  weekendActivity: number;
  temporalConsistency: number; // 0-1
  regularityScore: number; // 0-1
}

export interface FrequencyFeatures {
  totalEvents: number;
  eventsPerDay: number;
  uniqueCategories: number;
  uniqueDomainCategories: number;
  categoryDistribution: Record<string, number>;
  topCategories: Array<{ category: string; percentage: number }>;
  sessionCount: number;
  avgSessionDuration: number;
}

export interface UniquenessFeatures {
  categoryUniqueness: number; // 0-1
  temporalUniqueness: number; // 0-1
  behaviorUniqueness: number; // 0-1
  rareEventCount: number;
  distinctPatternCount: number;
  overallUniqueness: number; // 0-1
}

export interface BehavioralFeatures {
  sequences: Array<{
    pattern: string[];
    frequency: number;
    confidence: number;
  }>;
  routineStrength: number; // 0-1
  predictability: number; // 0-1
  volatility: number; // 0-1
  interestDiversity: number; // 0-1 (Shannon entropy normalized)
}

export interface CrossSourceFeatures {
  sourceCount: number;
  sourceOverlap: number; // 0-1
  temporalCorrelation: number; // 0-1
  categoryCorrelation: number; // 0-1
  overallCorrelation: number; // 0-1
}

export interface ExtractedFeatures {
  temporal: TemporalFeatures;
  frequency: FrequencyFeatures;
  uniqueness: UniquenessFeatures;
  behavioral: BehavioralFeatures;
  crossSource: CrossSourceFeatures;
  eventCount: number;
  dateRange: { start: Date; end: Date };
}

export function extractFeatures(events: IEvent[]): ExtractedFeatures {
  if (events.length === 0) {
    return getEmptyFeatures();
  }

  const temporal = extractTemporalFeatures(events);
  const frequency = extractFrequencyFeatures(events);
  const uniqueness = extractUniquenessFeatures(events, frequency);
  const behavioral = extractBehavioralFeatures(events, temporal);
  const crossSource = extractCrossSourceFeatures(events);

  const dates = events.map((e) => new Date(e.createdAt));
  const dateRange = {
    start: new Date(Math.min(...dates.map((d) => d.getTime()))),
    end: new Date(Math.max(...dates.map((d) => d.getTime()))),
  };

  return {
    temporal,
    frequency,
    uniqueness,
    behavioral,
    crossSource,
    eventCount: events.length,
    dateRange,
  };
}

function extractTemporalFeatures(events: IEvent[]): TemporalFeatures {
  const hourDistribution = new Array(24).fill(0);
  const dayOfWeekDistribution = new Array(7).fill(0);

  for (const event of events) {
    const hour = event.hourOfDay ?? new Date(event.createdAt).getHours();
    const day = event.dayOfWeek ?? new Date(event.createdAt).getDay();
    hourDistribution[hour]++;
    dayOfWeekDistribution[day]++;
  }

  // Normalize
  const totalEvents = events.length;
  const normalizedHours = hourDistribution.map((v: number) => v / totalEvents);
  const normalizedDays = dayOfWeekDistribution.map((v: number) => v / totalEvents);

  const peakHour = hourDistribution.indexOf(Math.max(...hourDistribution));
  const peakDay = dayOfWeekDistribution.indexOf(Math.max(...dayOfWeekDistribution));

  const nightActivity = normalizedHours
    .filter((_: number, i: number) => i >= 22 || i < 6)
    .reduce((a: number, b: number) => a + b, 0);

  const morningActivity = normalizedHours
    .filter((_: number, i: number) => i >= 6 && i < 10)
    .reduce((a: number, b: number) => a + b, 0);

  const workdayActivity = normalizedDays
    .filter((_: number, i: number) => i >= 1 && i <= 5)
    .reduce((a: number, b: number) => a + b, 0);

  const weekendActivity = normalizedDays
    .filter((_: number, i: number) => i === 0 || i === 6)
    .reduce((a: number, b: number) => a + b, 0);

  // Temporal consistency: how regular is the pattern across days
  const hourEntropy = shannonEntropy(normalizedHours);
  const maxEntropy = Math.log2(24);
  const temporalConsistency = 1 - hourEntropy / maxEntropy;

  // Regularity: are events at similar times each day?
  const dayGroups = groupEventsByDay(events);
  const regularity = computeRegularity(dayGroups);

  return {
    hourDistribution: normalizedHours,
    dayOfWeekDistribution: normalizedDays,
    peakHour,
    peakDay,
    nightActivity,
    morningActivity,
    workdayActivity,
    weekendActivity,
    temporalConsistency,
    regularityScore: regularity,
  };
}

function extractFrequencyFeatures(events: IEvent[]): FrequencyFeatures {
  const categories = new Set<string>();
  const domainCategories = new Set<string>();
  const categoryCount: Record<string, number> = {};

  for (const event of events) {
    categories.add(event.category);
    domainCategories.add(event.domainCategory);
    categoryCount[event.category] = (categoryCount[event.category] || 0) + 1;
  }

  const dates = events.map((e) => new Date(e.createdAt));
  const dateRange =
    (Math.max(...dates.map((d) => d.getTime())) -
      Math.min(...dates.map((d) => d.getTime()))) /
    (1000 * 60 * 60 * 24);
  const daysActive = Math.max(dateRange, 1);

  const topCategories = Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([category, count]) => ({
      category,
      percentage: Math.round((count / events.length) * 100),
    }));

  return {
    totalEvents: events.length,
    eventsPerDay: Math.round(events.length / daysActive),
    uniqueCategories: categories.size,
    uniqueDomainCategories: domainCategories.size,
    categoryDistribution: categoryCount,
    topCategories,
    sessionCount: estimateSessionCount(events),
    avgSessionDuration: 0,
  };
}

function extractUniquenessFeatures(
  events: IEvent[],
  frequency: FrequencyFeatures
): UniquenessFeatures {
  // Category uniqueness based on distribution evenness
  const categoryValues = Object.values(frequency.categoryDistribution);
  const categoryEntropy = shannonEntropy(
    categoryValues.map((v) => v / events.length)
  );
  const maxCategoryEntropy = Math.log2(Math.max(categoryValues.length, 1));
  const categoryUniqueness = maxCategoryEntropy > 0 ? categoryEntropy / maxCategoryEntropy : 0;

  // Temporal uniqueness — how distinctive is the time pattern
  const hourCounts = new Array(24).fill(0);
  events.forEach((e) => {
    hourCounts[e.hourOfDay ?? new Date(e.createdAt).getHours()]++;
  });
  const hourEntropy = shannonEntropy(hourCounts.map((v: number) => v / events.length));
  const temporalUniqueness = 1 - hourEntropy / Math.log2(24);

  // Rare events (< 2% of total)
  const rareThreshold = events.length * 0.02;
  const rareEventCount = categoryValues.filter((v) => v < rareThreshold).length;

  // Overall uniqueness score
  const behaviorUniqueness = (categoryUniqueness + temporalUniqueness) / 2;
  const overallUniqueness = Math.min(
    1,
    (categoryUniqueness * 0.3 + temporalUniqueness * 0.3 + behaviorUniqueness * 0.4)
  );

  return {
    categoryUniqueness,
    temporalUniqueness,
    behaviorUniqueness,
    rareEventCount,
    distinctPatternCount: frequency.uniqueCategories,
    overallUniqueness,
  };
}

function extractBehavioralFeatures(
  events: IEvent[],
  temporal: TemporalFeatures
): BehavioralFeatures {
  // Detect recurring sequences
  const sequences = detectSequences(events);

  // Routine strength: how often sequences repeat
  const routineStrength = sequences.length > 0
    ? Math.min(1, sequences.reduce((sum, s) => sum + s.confidence, 0) / sequences.length)
    : 0;

  // Predictability based on temporal consistency and routine
  const predictability = (temporal.temporalConsistency * 0.5 + routineStrength * 0.5);

  // Volatility: inverse of consistency
  const volatility = 1 - temporal.temporalConsistency;

  // Interest diversity (Shannon entropy over categories)
  const categoryProbs = Object.values(
    events.reduce((acc: Record<string, number>, e) => {
      acc[e.category] = (acc[e.category] || 0) + 1;
      return acc;
    }, {})
  ).map((v) => v / events.length);
  const diversity = categoryProbs.length > 1
    ? shannonEntropy(categoryProbs) / Math.log2(categoryProbs.length)
    : 0;

  return {
    sequences: sequences.slice(0, 10),
    routineStrength,
    predictability,
    volatility,
    interestDiversity: diversity,
  };
}

function extractCrossSourceFeatures(events: IEvent[]): CrossSourceFeatures {
  const sources = new Set(events.map((e) => e.source));
  const sourceCount = sources.size;

  if (sourceCount <= 1) {
    return {
      sourceCount,
      sourceOverlap: 0,
      temporalCorrelation: 0,
      categoryCorrelation: 0,
      overallCorrelation: 0,
    };
  }

  // Group events by source
  const bySource: Record<string, IEvent[]> = {};
  for (const event of events) {
    if (!bySource[event.source]) bySource[event.source] = [];
    bySource[event.source].push(event);
  }

  // Temporal overlap: do sources have events in the same time buckets?
  const sourceTimeBuckets: Record<string, Set<string>> = {};
  for (const [source, sourceEvents] of Object.entries(bySource)) {
    sourceTimeBuckets[source] = new Set(sourceEvents.map((e) => e.timeBucket));
  }

  const allBuckets = Object.values(sourceTimeBuckets);
  let overlapCount = 0;
  let totalBuckets = 0;
  for (let i = 0; i < allBuckets.length; i++) {
    for (let j = i + 1; j < allBuckets.length; j++) {
      const intersection = new Set([...allBuckets[i]].filter((x) => allBuckets[j].has(x)));
      const union = new Set([...allBuckets[i], ...allBuckets[j]]);
      overlapCount += intersection.size;
      totalBuckets += union.size;
    }
  }

  const sourceOverlap = totalBuckets > 0 ? overlapCount / totalBuckets : 0;
  const temporalCorrelation = sourceOverlap;
  const categoryCorrelation = sourceOverlap * 0.8;
  const overallCorrelation = (temporalCorrelation + categoryCorrelation) / 2;

  return {
    sourceCount,
    sourceOverlap,
    temporalCorrelation,
    categoryCorrelation,
    overallCorrelation,
  };
}

// --- Helper functions ---

function shannonEntropy(probabilities: number[]): number {
  return -probabilities
    .filter((p) => p > 0)
    .reduce((sum, p) => sum + p * Math.log2(p), 0);
}

function groupEventsByDay(events: IEvent[]): Record<string, IEvent[]> {
  const groups: Record<string, IEvent[]> = {};
  for (const event of events) {
    const date = new Date(event.createdAt).toISOString().split("T")[0];
    if (!groups[date]) groups[date] = [];
    groups[date].push(event);
  }
  return groups;
}

function computeRegularity(dayGroups: Record<string, IEvent[]>): number {
  const days = Object.values(dayGroups);
  if (days.length < 2) return 0;

  // Compare hour distributions across days
  const hourDists = days.map((dayEvents) => {
    const dist = new Array(24).fill(0);
    dayEvents.forEach((e) => {
      dist[e.hourOfDay ?? new Date(e.createdAt).getHours()]++;
    });
    const total = dayEvents.length;
    return dist.map((v: number) => (total > 0 ? v / total : 0));
  });

  // Average pairwise cosine similarity
  let totalSim = 0;
  let pairs = 0;
  for (let i = 0; i < hourDists.length; i++) {
    for (let j = i + 1; j < hourDists.length; j++) {
      totalSim += cosineSimilarity(hourDists[i], hourDists[j]);
      pairs++;
    }
  }

  return pairs > 0 ? totalSim / pairs : 0;
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom > 0 ? dot / denom : 0;
}

function estimateSessionCount(events: IEvent[]): number {
  if (events.length === 0) return 0;
  const sorted = [...events].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  let sessions = 1;
  const SESSION_GAP = 30 * 60 * 1000; // 30 minutes
  for (let i = 1; i < sorted.length; i++) {
    const gap =
      new Date(sorted[i].createdAt).getTime() -
      new Date(sorted[i - 1].createdAt).getTime();
    if (gap > SESSION_GAP) sessions++;
  }
  return sessions;
}

function detectSequences(events: IEvent[]): Array<{
  pattern: string[];
  frequency: number;
  confidence: number;
}> {
  // Group by day and extract category sequences
  const dayGroups = groupEventsByDay(events);
  const dailySequences: string[][] = [];

  for (const dayEvents of Object.values(dayGroups)) {
    const sorted = dayEvents.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    dailySequences.push(sorted.map((e) => e.category));
  }

  // Find common subsequences of length 2-4
  const patternCounts: Record<string, number> = {};
  for (const seq of dailySequences) {
    for (let len = 2; len <= Math.min(4, seq.length); len++) {
      for (let i = 0; i <= seq.length - len; i++) {
        const pattern = seq.slice(i, i + len).join(" → ");
        patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
      }
    }
  }

  return Object.entries(patternCounts)
    .filter(([, count]) => count >= 2)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([pattern, frequency]) => ({
      pattern: pattern.split(" → "),
      frequency,
      confidence: Math.min(1, frequency / dailySequences.length),
    }));
}

function getEmptyFeatures(): ExtractedFeatures {
  return {
    temporal: {
      hourDistribution: new Array(24).fill(0),
      dayOfWeekDistribution: new Array(7).fill(0),
      peakHour: 0,
      peakDay: 0,
      nightActivity: 0,
      morningActivity: 0,
      workdayActivity: 0,
      weekendActivity: 0,
      temporalConsistency: 0,
      regularityScore: 0,
    },
    frequency: {
      totalEvents: 0,
      eventsPerDay: 0,
      uniqueCategories: 0,
      uniqueDomainCategories: 0,
      categoryDistribution: {},
      topCategories: [],
      sessionCount: 0,
      avgSessionDuration: 0,
    },
    uniqueness: {
      categoryUniqueness: 0,
      temporalUniqueness: 0,
      behaviorUniqueness: 0,
      rareEventCount: 0,
      distinctPatternCount: 0,
      overallUniqueness: 0,
    },
    behavioral: {
      sequences: [],
      routineStrength: 0,
      predictability: 0,
      volatility: 0,
      interestDiversity: 0,
    },
    crossSource: {
      sourceCount: 0,
      sourceOverlap: 0,
      temporalCorrelation: 0,
      categoryCorrelation: 0,
      overallCorrelation: 0,
    },
    eventCount: 0,
    dateRange: { start: new Date(), end: new Date() },
  };
}
