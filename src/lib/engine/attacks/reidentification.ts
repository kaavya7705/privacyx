/**
 * Attack 6 — Re-identification Risk
 * Assesses how unique/identifiable the user's data pattern is
 */
import type { ExtractedFeatures } from "@/lib/engine/features";
import type { AttackResult, AttackContext } from "./types";
import { ADVERSARY_MULTIPLIERS } from "./types";

export function runReidentification(
  features: ExtractedFeatures,
  context: AttackContext
): AttackResult {
  const evidence: AttackResult["evidence"] = [];
  let baseConfidence = 0;

  // Uniqueness is the primary factor
  const uniqueness = features.uniqueness.overallUniqueness;
  if (uniqueness > 0.2) {
    evidence.push({
      id: "reid-uniqueness",
      description: `Overall behavioral uniqueness: ${(uniqueness * 100).toFixed(0)}%`,
      strength: uniqueness,
    });
    baseConfidence += uniqueness * 0.25;
  }

  // Cross-source correlation amplifies re-identification
  if (features.crossSource.sourceCount > 1) {
    evidence.push({
      id: "reid-cross-source",
      description: `${features.crossSource.sourceCount} data sources available for correlation (overlap: ${(features.crossSource.sourceOverlap * 100).toFixed(0)}%)`,
      strength: features.crossSource.overallCorrelation,
    });
    baseConfidence += features.crossSource.overallCorrelation * 0.2;
  }

  // Temporal consistency
  if (features.temporal.temporalConsistency > 0.3) {
    evidence.push({
      id: "reid-temporal-consistency",
      description: `Consistent temporal patterns aid identification (${(features.temporal.temporalConsistency * 100).toFixed(0)}%)`,
      strength: features.temporal.temporalConsistency,
    });
    baseConfidence += features.temporal.temporalConsistency * 0.15;
  }

  // Event volume
  const volumeStrength = Math.min(1, features.eventCount / 200);
  if (features.eventCount > 20) {
    evidence.push({
      id: "reid-data-volume",
      description: `${features.eventCount} events provide substantial analysis material`,
      strength: volumeStrength,
    });
    baseConfidence += volumeStrength * 0.15;
  }

  // Distinct pattern count
  if (features.uniqueness.distinctPatternCount > 3) {
    evidence.push({
      id: "reid-distinct-patterns",
      description: `${features.uniqueness.distinctPatternCount} distinct behavioral patterns increase identifiability`,
      strength: Math.min(1, features.uniqueness.distinctPatternCount / 10),
    });
    baseConfidence += Math.min(1, features.uniqueness.distinctPatternCount / 10) * 0.15;
  }

  // Sequence uniqueness
  if (features.behavioral.sequences.length > 0) {
    evidence.push({
      id: "reid-sequences",
      description: `${features.behavioral.sequences.length} recurring sequences serve as behavioral markers`,
      strength: Math.min(1, features.behavioral.sequences.length / 5),
    });
    baseConfidence += Math.min(1, features.behavioral.sequences.length / 5) * 0.1;
  }

  const multiplier = ADVERSARY_MULTIPLIERS[context.adversaryProfile];
  const confidence = Math.min(1, baseConfidence * multiplier);

  return {
    type: "REIDENTIFICATION",
    confidence,
    risk: Math.round(confidence * 100),
    evidence,
    assumptions: [
      "Behavioral uniqueness correlates with re-identification risk",
      "More data sources increase cross-referencing capability",
      "Temporal consistency makes patterns more trackable",
    ],
    alternatives: [
      "Population-level analysis may group user with similar profiles",
      "Privacy-preserving transformations can reduce uniqueness",
      "Limited data volume may limit re-identification accuracy",
    ],
    adversaryProfile: context.adversaryProfile,
    details: {
      uniqueness: Math.round(uniqueness * 100),
      sourceCount: features.crossSource.sourceCount,
      eventCount: features.eventCount,
      patternCount: features.uniqueness.distinctPatternCount,
    },
  };
}
