/**
 * Risk Engine v2.0 — computes quantitative privacy risk from attack results + ML predictions
 * 
 * Risk = w1×EvidenceStrength + w2×Uniqueness + w3×TemporalConsistency
 *      + w4×CrossSourceSupport + w5×AdversaryPrior + w6×MLRiskAdjustment
 *      - w7×ContradictionPenalty
 *
 * NEW: When ML service is online, blends ML-based risk scores with heuristic analysis
 * for a more accurate and impactful risk assessment.
 */

import type { ExtractedFeatures } from "@/lib/engine/features";
import type { AttackBatteryResult } from "@/lib/engine/attacks";
import type { AdversaryProfile } from "@/lib/engine/attacks/types";

export interface RiskComponents {
  evidenceStrength: number;
  uniqueness: number;
  temporalConsistency: number;
  crossSourceSupport: number;
  adversaryPrior: number;
  mlRiskAdjustment: number;
  contradictionPenalty: number;
}

export interface RiskScore {
  overall: number;
  location: number;
  behavior: number;
  identity: number;
  interest: number;
  reidentification: number;
  components: RiskComponents;
  attackProfile: AdversaryProfile;
  mlEnhanced: boolean;
}

export interface MLRiskInput {
  risk_score: number;
  method: string;
  components: Record<string, number>;
}

const WEIGHTS = {
  evidenceStrength: 0.22,
  uniqueness: 0.18,
  temporalConsistency: 0.12,
  crossSourceSupport: 0.12,
  adversaryPrior: 0.12,
  mlRiskAdjustment: 0.14, // NEW: ML component weight
  contradictionPenalty: 0.10,
};

// Weights when ML is NOT available (fallback)
const WEIGHTS_NO_ML = {
  evidenceStrength: 0.25,
  uniqueness: 0.2,
  temporalConsistency: 0.15,
  crossSourceSupport: 0.15,
  adversaryPrior: 0.15,
  mlRiskAdjustment: 0,
  contradictionPenalty: 0.1,
};

export function computeRisk(
  features: ExtractedFeatures,
  attackResults: AttackBatteryResult,
  mlRiskInput?: MLRiskInput | null
): RiskScore {
  const mlAvailable = mlRiskInput != null && mlRiskInput.method !== "heuristic_fallback";
  const w = mlAvailable ? WEIGHTS : WEIGHTS_NO_ML;

  // Evidence strength: average confidence across attacks
  const attackCount = attackResults.attacks.length;
  const evidenceStrength =
    attackCount > 0
      ? attackResults.attacks.reduce((sum, a) => sum + (a.confidence || 0), 0) / attackCount
      : 0;

  // Uniqueness from features
  const uniqueness = features.uniqueness.overallUniqueness || 0;

  // Temporal consistency
  const temporalConsistency = features.temporal.temporalConsistency || 0;

  // Cross-source support
  const crossSourceSupport = features.crossSource.overallCorrelation || 0;

  // Adversary prior based on profile
  const adversaryPriorMap: Record<AdversaryProfile, number> = {
    weak: 0.1,
    moderate: 0.3,
    strong: 0.6,
    targeted: 0.85,
  };
  const adversaryPrior = adversaryPriorMap[attackResults.adversaryProfile] || 0.3;

  // ML Risk Adjustment — blended from ML ensemble prediction
  let mlRiskAdjustment = 0;
  if (mlAvailable && mlRiskInput) {
    // ML risk_score is 0-100, normalize to 0-1
    mlRiskAdjustment = (mlRiskInput.risk_score || 0) / 100;
  }

  // Contradiction penalty: if attacks contradict each other
  const contradictionPenalty = computeContradictionPenalty(attackResults);

  // Compute weighted risk
  const rawRisk =
    w.evidenceStrength * evidenceStrength +
    w.uniqueness * uniqueness +
    w.temporalConsistency * temporalConsistency +
    w.crossSourceSupport * crossSourceSupport +
    w.adversaryPrior * adversaryPrior +
    w.mlRiskAdjustment * mlRiskAdjustment -
    w.contradictionPenalty * contradictionPenalty;

  const normalizedRisk = Math.round(Math.max(0, Math.min(100, (isNaN(rawRisk) ? 0 : rawRisk) * 100)));

  return {
    overall: normalizedRisk,
    location: attackResults.categoryRisks?.location || 0,
    behavior: attackResults.categoryRisks?.behavior || 0,
    identity: attackResults.categoryRisks?.identity || 0,
    interest: attackResults.categoryRisks?.interest || 0,
    reidentification: attackResults.categoryRisks?.reidentification || 0,
    components: {
      evidenceStrength: Math.round(evidenceStrength * 100),
      uniqueness: Math.round(uniqueness * 100),
      temporalConsistency: Math.round(temporalConsistency * 100),
      crossSourceSupport: Math.round(crossSourceSupport * 100),
      adversaryPrior: Math.round(adversaryPrior * 100),
      mlRiskAdjustment: Math.round(mlRiskAdjustment * 100),
      contradictionPenalty: Math.round(contradictionPenalty * 100),
    },
    attackProfile: attackResults.adversaryProfile,
    mlEnhanced: mlAvailable,
  };
}

function computeContradictionPenalty(results: AttackBatteryResult): number {
  if (!results.attacks || results.attacks.length === 0) return 0;
  const confidences = results.attacks.map((a) => a.confidence || 0);
  const mean = confidences.reduce((s, v) => s + v, 0) / confidences.length;
  const variance =
    confidences.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / confidences.length;

  return Math.min(1, Math.max(0, variance * 2));
}
