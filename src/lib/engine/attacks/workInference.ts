/**
 * Attack 2 — Work/College Inference
 * Detects likely work or education location from weekday patterns
 */

import type { ExtractedFeatures } from "@/lib/engine/features";
import type { AttackResult, AttackContext } from "./types";
import { ADVERSARY_MULTIPLIERS } from "./types";

export function runWorkInference(
  features: ExtractedFeatures,
  context: AttackContext
): AttackResult {
  const evidence: AttackResult["evidence"] = [];
  let baseConfidence = 0;

  // Weekday 9-5 pattern
  const workHours = features.temporal.hourDistribution
    .slice(9, 17)
    .reduce((a: number, b: number) => a + b, 0);

  if (workHours > 0.3) {
    const strength = Math.min(1, workHours * 1.5);
    evidence.push({
      id: "work-daytime-pattern",
      description: `Strong daytime activity during work hours (${(workHours * 100).toFixed(0)}% between 09:00–17:00)`,
      strength,
    });
    baseConfidence += strength * 0.3;
  }

  // Weekday dominance
  if (features.temporal.workdayActivity > 0.6) {
    const strength = Math.min(1, (features.temporal.workdayActivity - 0.5) * 4);
    evidence.push({
      id: "work-weekday-dominance",
      description: `Activity concentrated on weekdays (${(features.temporal.workdayActivity * 100).toFixed(0)}%)`,
      strength,
    });
    baseConfidence += strength * 0.25;
  }

  // Developer tools / education category presence
  const devActivity = features.frequency.categoryDistribution["developer_tools"] || 0;
  const techActivity = features.frequency.categoryDistribution["technology"] || 0;
  const eduActivity = features.frequency.categoryDistribution["education"] || 0;
  const careerActivity = features.frequency.categoryDistribution["career"] || 0;

  const professionalActivity = (devActivity + techActivity + careerActivity) / Math.max(features.eventCount, 1);
  const educationActivity = eduActivity / Math.max(features.eventCount, 1);

  if (professionalActivity > 0.15) {
    evidence.push({
      id: "work-professional-activity",
      description: `Professional/technical browsing pattern detected (${(professionalActivity * 100).toFixed(0)}% of activity)`,
      strength: Math.min(1, professionalActivity * 3),
    });
    baseConfidence += Math.min(1, professionalActivity * 3) * 0.2;
  }

  if (educationActivity > 0.1) {
    evidence.push({
      id: "work-education-activity",
      description: `Educational browsing pattern detected (${(educationActivity * 100).toFixed(0)}% of activity)`,
      strength: Math.min(1, educationActivity * 4),
    });
    baseConfidence += Math.min(1, educationActivity * 4) * 0.15;
  }

  // Consistency
  if (features.temporal.regularityScore > 0.4) {
    evidence.push({
      id: "work-regularity",
      description: `Consistent daily pattern suggests fixed work/study schedule`,
      strength: features.temporal.regularityScore,
    });
    baseConfidence += features.temporal.regularityScore * 0.1;
  }

  const multiplier = ADVERSARY_MULTIPLIERS[context.adversaryProfile];
  const confidence = Math.min(1, baseConfidence * multiplier);
  const risk = Math.round(confidence * 100);

  return {
    type: "WORK_LOCATION_INFERENCE",
    confidence,
    risk,
    evidence,
    assumptions: [
      "Weekday daytime activity correlates with work/education location",
      "Professional or educational content browsing indicates occupation type",
      "Regular daily patterns suggest a fixed work/study schedule",
    ],
    alternatives: [
      "User may work from home or remotely",
      "Activity could reflect self-directed learning rather than enrollment",
      "Freelance or irregular schedules may produce similar patterns",
    ],
    adversaryProfile: context.adversaryProfile,
    details: {
      workHoursPercentage: Math.round(workHours * 100),
      professionalActivity: Math.round(professionalActivity * 100),
      educationActivity: Math.round(educationActivity * 100),
    },
  };
}
