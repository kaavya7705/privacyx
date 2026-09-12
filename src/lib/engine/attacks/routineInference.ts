/**
 * Attack 3 — Routine Inference
 * Detects predictable daily sequences
 */

import type { ExtractedFeatures } from "@/lib/engine/features";
import type { AttackResult, AttackContext } from "./types";
import { ADVERSARY_MULTIPLIERS } from "./types";

export function runRoutineInference(
  features: ExtractedFeatures,
  context: AttackContext
): AttackResult {
  const evidence: AttackResult["evidence"] = [];
  let baseConfidence = 0;

  // Sequence detection
  if (features.behavioral.sequences.length > 0) {
    const topSequence = features.behavioral.sequences[0];
    evidence.push({
      id: "routine-sequence-detected",
      description: `Recurring sequence detected: ${topSequence.pattern.join(" → ")} (observed ${topSequence.frequency} times)`,
      strength: topSequence.confidence,
    });
    baseConfidence += topSequence.confidence * 0.3;

    if (features.behavioral.sequences.length >= 3) {
      evidence.push({
        id: "routine-multiple-sequences",
        description: `${features.behavioral.sequences.length} distinct recurring patterns identified`,
        strength: Math.min(1, features.behavioral.sequences.length / 5),
      });
      baseConfidence += Math.min(1, features.behavioral.sequences.length / 5) * 0.15;
    }
  }

  // Predictability
  if (features.behavioral.predictability > 0.3) {
    evidence.push({
      id: "routine-predictability",
      description: `Behavioral predictability score: ${(features.behavioral.predictability * 100).toFixed(0)}%`,
      strength: features.behavioral.predictability,
    });
    baseConfidence += features.behavioral.predictability * 0.25;
  }

  // Routine strength
  if (features.behavioral.routineStrength > 0.3) {
    evidence.push({
      id: "routine-strength",
      description: `Strong routine patterns detected (strength: ${(features.behavioral.routineStrength * 100).toFixed(0)}%)`,
      strength: features.behavioral.routineStrength,
    });
    baseConfidence += features.behavioral.routineStrength * 0.2;
  }

  // Temporal regularity
  if (features.temporal.regularityScore > 0.4) {
    evidence.push({
      id: "routine-temporal-regularity",
      description: `Activity occurs at consistent times across days`,
      strength: features.temporal.regularityScore,
    });
    baseConfidence += features.temporal.regularityScore * 0.1;
  }

  const multiplier = ADVERSARY_MULTIPLIERS[context.adversaryProfile];
  const confidence = Math.min(1, baseConfidence * multiplier);

  return {
    type: "ROUTINE_INFERENCE",
    confidence,
    risk: Math.round(confidence * 100),
    evidence,
    assumptions: [
      "Repeated behavioral sequences indicate predictable routines",
      "Temporal regularity strengthens routine predictions",
      "More observed repetitions increase prediction confidence",
    ],
    alternatives: [
      "Apparent routines may include deliberate variation",
      "External events may disrupt detected patterns",
      "Weekday and weekend routines may differ significantly",
    ],
    adversaryProfile: context.adversaryProfile,
    details: {
      sequenceCount: features.behavioral.sequences.length,
      predictability: Math.round(features.behavioral.predictability * 100),
      routineStrength: Math.round(features.behavioral.routineStrength * 100),
    },
  };
}
