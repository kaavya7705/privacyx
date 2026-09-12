/**
 * Attack 5 — Behavioral Fingerprinting
 * Identifies unique behavioral signatures
 */
import type { ExtractedFeatures } from "@/lib/engine/features";
import type { AttackResult, AttackContext } from "./types";
import { ADVERSARY_MULTIPLIERS } from "./types";

export function runBehavioralFingerprint(
  features: ExtractedFeatures,
  context: AttackContext
): AttackResult {
  const evidence: AttackResult["evidence"] = [];
  let baseConfidence = 0;

  // Temporal uniqueness
  if (features.uniqueness.temporalUniqueness > 0.3) {
    evidence.push({
      id: "fingerprint-temporal",
      description: `Distinctive temporal activity pattern (uniqueness: ${(features.uniqueness.temporalUniqueness * 100).toFixed(0)}%)`,
      strength: features.uniqueness.temporalUniqueness,
    });
    baseConfidence += features.uniqueness.temporalUniqueness * 0.25;
  }

  // Category uniqueness
  if (features.uniqueness.categoryUniqueness > 0.3) {
    evidence.push({
      id: "fingerprint-category",
      description: `Distinctive category browsing profile (uniqueness: ${(features.uniqueness.categoryUniqueness * 100).toFixed(0)}%)`,
      strength: features.uniqueness.categoryUniqueness,
    });
    baseConfidence += features.uniqueness.categoryUniqueness * 0.25;
  }

  // Overall behavioral uniqueness
  if (features.uniqueness.overallUniqueness > 0.3) {
    evidence.push({
      id: "fingerprint-overall",
      description: `Combined behavioral fingerprint strength: ${(features.uniqueness.overallUniqueness * 100).toFixed(0)}%`,
      strength: features.uniqueness.overallUniqueness,
    });
    baseConfidence += features.uniqueness.overallUniqueness * 0.2;
  }

  // Rare events contribute to fingerprinting
  if (features.uniqueness.rareEventCount > 0) {
    evidence.push({
      id: "fingerprint-rare-events",
      description: `${features.uniqueness.rareEventCount} rare event categories contribute to unique identification`,
      strength: Math.min(1, features.uniqueness.rareEventCount / 5),
    });
    baseConfidence += Math.min(1, features.uniqueness.rareEventCount / 5) * 0.15;
  }

  // Routine patterns add to fingerprint
  if (features.behavioral.routineStrength > 0.4) {
    evidence.push({
      id: "fingerprint-routine",
      description: `Predictable routines strengthen behavioral signature`,
      strength: features.behavioral.routineStrength,
    });
    baseConfidence += features.behavioral.routineStrength * 0.15;
  }

  const multiplier = ADVERSARY_MULTIPLIERS[context.adversaryProfile];
  const confidence = Math.min(1, baseConfidence * multiplier);

  return {
    type: "BEHAVIORAL_FINGERPRINT",
    confidence,
    risk: Math.round(confidence * 100),
    evidence,
    assumptions: [
      "Unique behavioral patterns can distinguish individuals",
      "Rare events significantly increase fingerprint distinctiveness",
      "Combined temporal and categorical uniqueness creates stronger signatures",
    ],
    alternatives: [
      "Similar roles may produce similar behavioral patterns",
      "Behavioral changes over time may reduce fingerprint stability",
      "Shared environments could blur individual patterns",
    ],
    adversaryProfile: context.adversaryProfile,
    details: {
      temporalUniqueness: Math.round(features.uniqueness.temporalUniqueness * 100),
      categoryUniqueness: Math.round(features.uniqueness.categoryUniqueness * 100),
      overallUniqueness: Math.round(features.uniqueness.overallUniqueness * 100),
      rareEvents: features.uniqueness.rareEventCount,
    },
  };
}
