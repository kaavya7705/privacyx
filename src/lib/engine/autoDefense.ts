/**
 * PrivacyX Auto-Defense Engine
 * 
 * Automatically analyzes current vulnerability telemetry and selects optimal
 * privacy-preserving defense configurations tailored to mitigate the highest-impact attack vectors.
 */

import type { IEvent } from "@/lib/models/Event";
import { extractFeatures } from "@/lib/engine/features";
import { runAttackBattery } from "@/lib/engine/attacks";
import { computeRisk } from "@/lib/engine/risk";
import type { AdversaryProfile } from "@/lib/engine/attacks/types";
import {
  DEFENSE_STRATEGIES,
  applyDefense,
  type DefenseResult,
  type AttackComparison,
} from "@/lib/engine/defenses";

export interface AutoDefenseRecommendation {
  recommendedStrategy: string;
  recommendedStrategyName: string;
  rationale: string[];
  threatVector: string;
  expectedRiskReduction: number;
  utilityRetained: number;
  selectedDefenses: string[];
  comparison: DefenseResult;
}

/**
 * Evaluates candidate defenses against current user data and selects
 * the highest efficacy defense with minimal utility sacrifice.
 */
export function evaluateAutoDefense(
  events: IEvent[],
  profile: AdversaryProfile = "moderate"
): AutoDefenseRecommendation {
  if (!events || events.length === 0) {
    const fallbackDefense = applyDefense([], "combined", 0, profile);
    return {
      recommendedStrategy: "combined",
      recommendedStrategyName: "Combined Defense",
      rationale: ["No active events recorded. Combined defense active as protective baseline."],
      threatVector: "baseline_protection",
      expectedRiskReduction: 0,
      utilityRetained: 80,
      selectedDefenses: ["combined"],
      comparison: fallbackDefense,
    };
  }

  // 1. Run attack battery to get baseline vulnerability breakdown
  const features = extractFeatures(events);
  const attackBattery = runAttackBattery(features, profile);
  const baselineRisk = computeRisk(features, attackBattery);

  // 2. Identify top threat vectors
  const sortedAttacks = [...attackBattery.attacks].sort((a, b) => b.risk - a.risk);
  const topAttack = sortedAttacks[0] || { type: "unknown", risk: 0 };

  const rationale: string[] = [];
  const candidateStrategies: string[] = [];

  // Determine candidate strategies based on top attacks
  if (topAttack.type.includes("home") || topAttack.type.includes("work") || topAttack.type.includes("location")) {
    candidateStrategies.push("location_generalization");
    rationale.push(`Critical location exposure detected (${topAttack.type}: ${Math.round(topAttack.risk)}% risk). Location generalization applied.`);
  }

  if (topAttack.type.includes("routine") || topAttack.type.includes("temporal") || topAttack.type.includes("anomaly")) {
    candidateStrategies.push("timestamp_bucketing");
    candidateStrategies.push("k_anonymity");
    rationale.push(`Temporal activity profiling detected (${topAttack.type}: ${Math.round(topAttack.risk)}% risk). Rounding timestamps & k-anonymity applied.`);
  }

  if (topAttack.type.includes("interest") || topAttack.type.includes("fingerprint")) {
    candidateStrategies.push("suppression");
    candidateStrategies.push("aggregation");
    rationale.push(`Behavioral fingerprinting detected (${topAttack.type}: ${Math.round(topAttack.risk)}% risk). Rare category suppression activated.`);
  }

  if (topAttack.type.includes("re_id") || topAttack.type.includes("cross_source")) {
    candidateStrategies.push("differential_privacy");
    candidateStrategies.push("noise");
    rationale.push(`Cross-source re-identification detected (${topAttack.type}: ${Math.round(topAttack.risk)}% risk). Differential privacy noise calibrated.`);
  }

  // Always include combined as a top contender
  candidateStrategies.push("combined");

  // Deduplicate
  const uniqueCandidates = Array.from(new Set(candidateStrategies));

  // 3. Evaluate each candidate dynamically using applyDefense
  let bestStrategy = "combined";
  let bestResult: DefenseResult = applyDefense(events, "combined", baselineRisk.overall, profile);
  let bestScore = -Infinity;

  for (const strategyKey of uniqueCandidates) {
    const result = applyDefense(events, strategyKey, baselineRisk.overall, profile);
    const riskDelta = result.riskBefore - result.riskAfter;
    // Score formula: Reward risk reduction, slightly penalize utility loss
    const score = riskDelta * 1.5 + (result.utilityRetained * 0.2);

    if (score > bestScore) {
      bestScore = score;
      bestStrategy = strategyKey;
      bestResult = result;
    }
  }

  const strategyMeta = DEFENSE_STRATEGIES.find((s) => s.key === bestStrategy);

  if (rationale.length === 0) {
    rationale.push(`Overall risk evaluated at ${Math.round(baselineRisk.overall)}/100. Applied optimal defense to maximize privacy preservation.`);
  }

  return {
    recommendedStrategy: bestStrategy,
    recommendedStrategyName: strategyMeta?.name || bestStrategy,
    rationale,
    threatVector: topAttack.type,
    expectedRiskReduction: Math.max(0, Math.round(bestResult.riskBefore - bestResult.riskAfter)),
    utilityRetained: bestResult.utilityRetained,
    selectedDefenses: [bestStrategy],
    comparison: bestResult,
  };
}
