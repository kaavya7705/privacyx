/**
 * Attack 1 — Home Location Inference
 * Detects likely residential location from night presence, morning departure, temporal consistency
 */

import type { ExtractedFeatures } from "@/lib/engine/features";
import type { AttackResult, AttackContext } from "./types";
import { ADVERSARY_MULTIPLIERS } from "./types";

export function runHomeInference(
  features: ExtractedFeatures,
  context: AttackContext
): AttackResult {
  const evidence: AttackResult["evidence"] = [];
  let baseConfidence = 0;

  // Night presence pattern (22:00-06:00)
  const nightPresence = features.temporal.nightActivity;
  if (nightPresence > 0.15) {
    const strength = Math.min(1, nightPresence * 3);
    evidence.push({
      id: "home-night-presence",
      description: `Frequent nighttime activity detected (${(nightPresence * 100).toFixed(0)}% of events between 22:00–06:00)`,
      strength,
    });
    baseConfidence += strength * 0.3;
  }

  // Morning departure pattern (06:00-10:00 activity drop)
  const morningDeparture = features.temporal.morningActivity;
  if (morningDeparture > 0.1) {
    const strength = Math.min(1, morningDeparture * 4);
    evidence.push({
      id: "home-morning-departure",
      description: `Morning departure pattern observed (${(morningDeparture * 100).toFixed(0)}% activity during 06:00–10:00)`,
      strength,
    });
    baseConfidence += strength * 0.2;
  }

  // Weekday recurrence
  if (features.temporal.workdayActivity > 0.6) {
    const strength = Math.min(1, features.temporal.workdayActivity);
    evidence.push({
      id: "home-weekday-recurrence",
      description: `Consistent weekday activity pattern (${(features.temporal.workdayActivity * 100).toFixed(0)}% on workdays)`,
      strength,
    });
    baseConfidence += strength * 0.15;
  }

  // Temporal consistency
  if (features.temporal.temporalConsistency > 0.3) {
    const strength = features.temporal.temporalConsistency;
    evidence.push({
      id: "home-temporal-consistency",
      description: `High temporal consistency across days (${(strength * 100).toFixed(0)}%)`,
      strength,
    });
    baseConfidence += strength * 0.2;
  }

  // Regularity across days
  if (features.temporal.regularityScore > 0.3) {
    const strength = features.temporal.regularityScore;
    evidence.push({
      id: "home-regularity",
      description: `Regular daily patterns detected (regularity: ${(strength * 100).toFixed(0)}%)`,
      strength,
    });
    baseConfidence += strength * 0.15;
  }

  // Apply adversary multiplier
  const multiplier = ADVERSARY_MULTIPLIERS[context.adversaryProfile];
  const confidence = Math.min(1, baseConfidence * multiplier);
  const risk = Math.round(confidence * 100);

  return {
    type: "HOME_LOCATION_INFERENCE",
    confidence,
    risk,
    evidence,
    assumptions: [
      "Nighttime activity is associated with residential presence",
      "Morning departure times correlate with home location",
      "Consistent temporal patterns strengthen location inference",
    ],
    alternatives: [
      "User may be a shift worker with non-standard schedule",
      "Activity may originate from a secondary residence",
      "Shared device usage could distort individual patterns",
    ],
    adversaryProfile: context.adversaryProfile,
    details: {
      nightPresence: Math.round(nightPresence * 100),
      morningDeparture: Math.round(morningDeparture * 100),
      temporalConsistency: Math.round(features.temporal.temporalConsistency * 100),
      regularity: Math.round(features.temporal.regularityScore * 100),
    },
  };
}
