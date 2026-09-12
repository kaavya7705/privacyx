/**
 * Synthetic Data Generator — creates benchmark data for testing and evaluation
 */

import type { IEvent } from "@/lib/models/Event";

export type ProfileType =
  | "student"
  | "software_engineer"
  | "remote_worker"
  | "office_worker"
  | "frequent_traveler"
  | "researcher";

interface ProfileConfig {
  label: string;
  categories: Record<string, number>; // category -> weight
  peakHours: number[]; // typical active hours
  workdays: boolean; // primarily weekday
  nightOwl: boolean;
  locations: string[];
  routineStrength: number; // 0-1
}

const PROFILES: Record<ProfileType, ProfileConfig> = {
  student: {
    label: "Student",
    categories: {
      education: 30, technology: 15, social: 20, entertainment: 15,
      shopping: 5, news: 5, gaming: 10,
    },
    peakHours: [9, 10, 11, 14, 15, 16, 20, 21, 22, 23],
    workdays: true,
    nightOwl: true,
    locations: ["campus", "library", "home", "cafe"],
    routineStrength: 0.6,
  },
  software_engineer: {
    label: "Software Engineer",
    categories: {
      technology: 35, developer_tools: 25, career: 5, education: 10,
      entertainment: 10, social: 5, news: 5, shopping: 5,
    },
    peakHours: [9, 10, 11, 12, 14, 15, 16, 17, 20, 21],
    workdays: true,
    nightOwl: false,
    locations: ["office", "home", "cafe"],
    routineStrength: 0.8,
  },
  remote_worker: {
    label: "Remote Worker",
    categories: {
      technology: 25, developer_tools: 15, career: 5, education: 10,
      entertainment: 15, social: 10, shopping: 10, news: 10,
    },
    peakHours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 19, 20, 21],
    workdays: true,
    nightOwl: false,
    locations: ["home", "cafe", "coworking"],
    routineStrength: 0.5,
  },
  office_worker: {
    label: "Office Worker",
    categories: {
      news: 15, social: 15, finance: 10, shopping: 15,
      entertainment: 15, technology: 10, career: 10, sports: 10,
    },
    peakHours: [7, 8, 12, 13, 18, 19, 20, 21],
    workdays: true,
    nightOwl: false,
    locations: ["office", "home", "gym", "restaurant"],
    routineStrength: 0.85,
  },
  frequent_traveler: {
    label: "Frequent Traveler",
    categories: {
      travel: 25, news: 10, entertainment: 15, social: 10,
      finance: 10, shopping: 10, technology: 10, sports: 10,
    },
    peakHours: [6, 7, 8, 10, 11, 14, 15, 19, 20, 21, 22],
    workdays: false,
    nightOwl: false,
    locations: ["airport", "hotel", "city_center", "tourist_area", "home"],
    routineStrength: 0.3,
  },
  researcher: {
    label: "Researcher",
    categories: {
      education: 30, technology: 20, news: 10, healthcare: 5,
      developer_tools: 10, social: 5, entertainment: 10, finance: 10,
    },
    peakHours: [8, 9, 10, 11, 13, 14, 15, 16, 17, 20, 21, 22],
    workdays: true,
    nightOwl: true,
    locations: ["lab", "library", "office", "home"],
    routineStrength: 0.7,
  },
};

export interface SyntheticDataset {
  events: Partial<IEvent>[];
  groundTruth: {
    profile: ProfileType;
    home: string;
    work: string;
    routineStrength: number;
    interests: string[];
    peakHours: number[];
  };
}

export function generateSyntheticData(
  profileType: ProfileType,
  days: number = 14,
  eventsPerDay: number = 20
): SyntheticDataset {
  const profile = PROFILES[profileType];
  const events: Partial<IEvent>[] = [];
  const now = new Date();

  for (let d = 0; d < days; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() - days + d);
    const dayOfWeek = date.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Fewer events on weekends for weekday-heavy profiles
    const dayEvents = isWeekend && profile.workdays
      ? Math.floor(eventsPerDay * 0.5)
      : eventsPerDay;

    for (let e = 0; e < dayEvents; e++) {
      // Select hour with routine-influenced variation
      const hour = selectHour(profile, isWeekend);
      const minute = Math.floor(Math.random() * 4) * 15;

      // Select category based on weights
      const category = selectCategory(profile.categories);

      // Add routine variation
      const eventDate = new Date(date);
      eventDate.setHours(hour, minute, 0, 0);

      events.push({
        source: Math.random() > 0.8 ? "location" : "browser",
        type: "domain_visit",
        category,
        domainCategory: category,
        timeBucket: `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}-${hour.toString().padStart(2, "0")}:${(minute + 15).toString().padStart(2, "0")}`,
        durationBucket: selectDuration(),
        dayOfWeek,
        hourOfDay: hour,
        sensitivity: getSensitivityScore(category),
        metadata: {
          synthetic: true,
          profile: profileType,
          location: profile.locations[Math.floor(Math.random() * profile.locations.length)],
        },
        createdAt: eventDate,
      });
    }
  }

  return {
    events,
    groundTruth: {
      profile: profileType,
      home: profile.locations[profile.locations.length - 1] || "home",
      work: profile.locations[0],
      routineStrength: profile.routineStrength,
      interests: Object.entries(profile.categories)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([cat]) => cat),
      peakHours: profile.peakHours,
    },
  };
}

function selectHour(profile: ProfileConfig, isWeekend: boolean): number {
  if (isWeekend) {
    // Shift hours later on weekends
    const shifted = profile.peakHours.map((h) => Math.min(23, h + 2));
    return shifted[Math.floor(Math.random() * shifted.length)];
  }

  // Use routine strength to determine how tightly to follow peak hours
  if (Math.random() < profile.routineStrength) {
    return profile.peakHours[Math.floor(Math.random() * profile.peakHours.length)];
  }

  return Math.floor(Math.random() * 24);
}

function selectCategory(weights: Record<string, number>): string {
  const entries = Object.entries(weights);
  const totalWeight = entries.reduce((sum, [, w]) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (const [category, weight] of entries) {
    random -= weight;
    if (random <= 0) return category;
  }

  return entries[0][0];
}

function selectDuration(): string {
  const options = ["<1m", "1-5m", "5-10m", "10-30m", "30-60m", ">60m"];
  const weights = [10, 25, 30, 20, 10, 5];
  const totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < options.length; i++) {
    random -= weights[i];
    if (random <= 0) return options[i];
  }

  return "5-10m";
}

function getSensitivityScore(category: string): number {
  const scores: Record<string, number> = {
    healthcare: 0.9, finance: 0.8, career: 0.7, social: 0.6,
    travel: 0.6, shopping: 0.5, education: 0.3, entertainment: 0.3,
    technology: 0.2, developer_tools: 0.2, news: 0.2, sports: 0.2,
    gaming: 0.2, search: 0.4,
  };
  return scores[category] ?? 0.5;
}

export function getAllProfiles(): Array<{ type: ProfileType; label: string }> {
  return Object.entries(PROFILES).map(([type, config]) => ({
    type: type as ProfileType,
    label: config.label,
  }));
}
