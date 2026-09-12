/**
 * Attack 4 — Interest Inference
 * Profiles user interests from browsing categories
 */

import type { ExtractedFeatures } from "@/lib/engine/features";
import type { AttackResult, AttackContext } from "./types";
import { ADVERSARY_MULTIPLIERS } from "./types";

export function runInterestInference(
  features: ExtractedFeatures,
  context: AttackContext
): AttackResult {
  const evidence: AttackResult["evidence"] = [];
  let baseConfidence = 0;

  const { topCategories, uniqueCategories, categoryDistribution } = features.frequency;

  // Dominant interest detection
  if (topCategories.length > 0 && topCategories[0].percentage > 20) {
    evidence.push({
      id: "interest-dominant-category",
      description: `Dominant interest area: ${topCategories[0].category} (${topCategories[0].percentage}% of activity)`,
      strength: Math.min(1, topCategories[0].percentage / 50),
    });
    baseConfidence += 0.3;
  }

  // Interest profile breadth
  if (uniqueCategories >= 3) {
    const profileDetail = topCategories
      .map((c) => `${c.category}: ${c.percentage}%`)
      .join(", ");
    evidence.push({
      id: "interest-profile",
      description: `Interest profile constructed: ${profileDetail}`,
      strength: Math.min(1, uniqueCategories / 8),
    });
    baseConfidence += 0.25;
  }

  // Sensitive category detection
  const sensitiveCategories = ["healthcare", "finance", "career"];
  for (const cat of sensitiveCategories) {
    const count = categoryDistribution[cat] || 0;
    if (count > 0) {
      const pct = Math.round((count / features.eventCount) * 100);
      evidence.push({
        id: `interest-sensitive-${cat}`,
        description: `Sensitive category detected: ${cat} (${pct}% of activity)`,
        strength: Math.min(1, pct / 15),
      });
      baseConfidence += 0.1;
    }
  }

  // Low diversity = stronger fingerprint
  if (features.behavioral.interestDiversity < 0.6 && uniqueCategories >= 2) {
    evidence.push({
      id: "interest-low-diversity",
      description: `Concentrated interest pattern — low diversity creates stronger behavioral signature`,
      strength: 1 - features.behavioral.interestDiversity,
    });
    baseConfidence += (1 - features.behavioral.interestDiversity) * 0.15;
  }

  const multiplier = ADVERSARY_MULTIPLIERS[context.adversaryProfile];
  const confidence = Math.min(1, baseConfidence * multiplier);

  return {
    type: "INTEREST_INFERENCE",
    confidence,
    risk: Math.round(confidence * 100),
    evidence,
    assumptions: [
      "Browsing categories reveal user interests and priorities",
      "Concentrated interests create stronger behavioral signatures",
      "Sensitive category visits may reveal private concerns",
    ],
    alternatives: [
      "Professional research may not reflect personal interests",
      "Shared devices could mix multiple users' interests",
      "Category classification may misattribute some visits",
    ],
    adversaryProfile: context.adversaryProfile,
    details: {
      topCategories,
      uniqueCategories,
      interestDiversity: Math.round(features.behavioral.interestDiversity * 100),
    },
  };
}
