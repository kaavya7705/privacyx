/**
 * Attack 7 — Cross-Source Correlation
 */
import type { ExtractedFeatures } from "@/lib/engine/features";
import type { AttackResult, AttackContext } from "./types";
import { ADVERSARY_MULTIPLIERS } from "./types";

export function runCrossSourceCorrelation(
  features: ExtractedFeatures,
  context: AttackContext
): AttackResult {
  const evidence: AttackResult["evidence"] = [];
  let baseConfidence = 0;

  const cs = features.crossSource;

  if (cs.sourceCount > 1) {
    evidence.push({
      id: "cross-source-count",
      description: `${cs.sourceCount} distinct data sources available for correlation`,
      strength: Math.min(1, cs.sourceCount / 4),
    });
    baseConfidence += Math.min(1, cs.sourceCount / 4) * 0.25;
  }

  if (cs.temporalCorrelation > 0.2) {
    evidence.push({
      id: "cross-temporal-correlation",
      description: `Temporal overlap between sources: ${(cs.temporalCorrelation * 100).toFixed(0)}%`,
      strength: cs.temporalCorrelation,
    });
    baseConfidence += cs.temporalCorrelation * 0.3;
  }

  if (cs.categoryCorrelation > 0.2) {
    evidence.push({
      id: "cross-category-correlation",
      description: `Category correlation between sources: ${(cs.categoryCorrelation * 100).toFixed(0)}%`,
      strength: cs.categoryCorrelation,
    });
    baseConfidence += cs.categoryCorrelation * 0.25;
  }

  if (cs.overallCorrelation > 0.3) {
    evidence.push({
      id: "cross-overall",
      description: `Overall cross-source correlation strength: ${(cs.overallCorrelation * 100).toFixed(0)}%`,
      strength: cs.overallCorrelation,
    });
    baseConfidence += cs.overallCorrelation * 0.2;
  }

  const multiplier = ADVERSARY_MULTIPLIERS[context.adversaryProfile];
  const confidence = Math.min(1, baseConfidence * multiplier);

  return {
    type: "CROSS_SOURCE_CORRELATION",
    confidence,
    risk: Math.round(confidence * 100),
    evidence,
    assumptions: [
      "Multiple data sources enable cross-referencing and enrichment",
      "Temporal overlap allows event correlation across sources",
      "Correlated sources amplify inference accuracy",
    ],
    alternatives: [
      "Low source overlap limits cross-referencing value",
      "Independent sources may reduce correlation impact",
    ],
    adversaryProfile: context.adversaryProfile,
    details: {
      sourceCount: cs.sourceCount,
      temporalCorrelation: Math.round(cs.temporalCorrelation * 100),
      categoryCorrelation: Math.round(cs.categoryCorrelation * 100),
      overallCorrelation: Math.round(cs.overallCorrelation * 100),
    },
  };
}
