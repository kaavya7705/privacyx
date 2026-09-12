/**
 * Attack 8 — Temporal Inference
 */
import type { ExtractedFeatures } from "@/lib/engine/features";
import type { AttackResult, AttackContext } from "./types";
import { ADVERSARY_MULTIPLIERS } from "./types";

export function runTemporalInference(
  features: ExtractedFeatures,
  context: AttackContext
): AttackResult {
  const evidence: AttackResult["evidence"] = [];
  let baseConfidence = 0;

  // Peak activity time identification
  evidence.push({
    id: "temporal-peak-hour",
    description: `Peak activity hour identified: ${features.temporal.peakHour}:00`,
    strength: 0.5,
  });
  baseConfidence += 0.15;

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  evidence.push({
    id: "temporal-peak-day",
    description: `Most active day: ${dayNames[features.temporal.peakDay]}`,
    strength: 0.4,
  });
  baseConfidence += 0.1;

  // Work/leisure partition
  if (Math.abs(features.temporal.workdayActivity - features.temporal.weekendActivity) > 0.3) {
    evidence.push({
      id: "temporal-work-leisure",
      description: `Clear work/leisure temporal partition detected (weekday: ${(features.temporal.workdayActivity * 100).toFixed(0)}%, weekend: ${(features.temporal.weekendActivity * 100).toFixed(0)}%)`,
      strength: 0.7,
    });
    baseConfidence += 0.25;
  }

  // Night owl / early bird
  if (features.temporal.nightActivity > 0.2) {
    evidence.push({
      id: "temporal-night-owl",
      description: `Significant nighttime activity (${(features.temporal.nightActivity * 100).toFixed(0)}%) — night owl behavioral indicator`,
      strength: features.temporal.nightActivity,
    });
    baseConfidence += features.temporal.nightActivity * 0.15;
  } else if (features.temporal.morningActivity > 0.15) {
    evidence.push({
      id: "temporal-early-bird",
      description: `Morning-heavy activity pattern (${(features.temporal.morningActivity * 100).toFixed(0)}%) — early riser indicator`,
      strength: features.temporal.morningActivity,
    });
    baseConfidence += features.temporal.morningActivity * 0.15;
  }

  // Temporal predictability
  if (features.temporal.temporalConsistency > 0.4) {
    evidence.push({
      id: "temporal-predictability",
      description: `Activity timing is highly predictable (consistency: ${(features.temporal.temporalConsistency * 100).toFixed(0)}%)`,
      strength: features.temporal.temporalConsistency,
    });
    baseConfidence += features.temporal.temporalConsistency * 0.2;
  }

  const multiplier = ADVERSARY_MULTIPLIERS[context.adversaryProfile];
  const confidence = Math.min(1, baseConfidence * multiplier);

  return {
    type: "TEMPORAL_INFERENCE",
    confidence,
    risk: Math.round(confidence * 100),
    evidence,
    assumptions: [
      "Activity timing reveals lifestyle and schedule information",
      "Work/leisure temporal partitions indicate employment status",
      "Sleep-wake patterns can be inferred from activity gaps",
    ],
    alternatives: [
      "Automated processes may generate activity at unusual times",
      "Time zone differences could shift apparent patterns",
    ],
    adversaryProfile: context.adversaryProfile,
    details: {
      peakHour: features.temporal.peakHour,
      peakDay: dayNames[features.temporal.peakDay],
      nightActivity: Math.round(features.temporal.nightActivity * 100),
      morningActivity: Math.round(features.temporal.morningActivity * 100),
    },
  };
}
