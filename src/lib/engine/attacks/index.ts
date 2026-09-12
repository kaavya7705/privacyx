/**
 * Attack Orchestrator — runs all 9 privacy attack types
 */

import type { ExtractedFeatures } from "@/lib/engine/features";
import type { AttackResult, AdversaryProfile } from "./types";
import { getAdversaryContext } from "./types";
import { runHomeInference } from "./homeInference";
import { runWorkInference } from "./workInference";
import { runRoutineInference } from "./routineInference";
import { runInterestInference } from "./interestInference";
import { runBehavioralFingerprint } from "./behavioralFingerprint";
import { runReidentification } from "./reidentification";
import { runCrossSourceCorrelation } from "./crossSourceCorrelation";
import { runTemporalInference } from "./temporalInference";
import { runAnomalyExploitation } from "./anomalyExploitation";

export interface AttackBatteryResult {
  attacks: AttackResult[];
  overallRisk: number;
  categoryRisks: {
    location: number;
    behavior: number;
    identity: number;
    interest: number;
    reidentification: number;
  };
  adversaryProfile: AdversaryProfile;
  duration: number;
}

export function runAttackBattery(
  features: ExtractedFeatures,
  profile: AdversaryProfile = "moderate"
): AttackBatteryResult {
  const start = Date.now();
  const context = getAdversaryContext(profile);

  const attacks: AttackResult[] = [
    runHomeInference(features, context),
    runWorkInference(features, context),
    runRoutineInference(features, context),
    runInterestInference(features, context),
    runBehavioralFingerprint(features, context),
    runReidentification(features, context),
    runCrossSourceCorrelation(features, context),
    runTemporalInference(features, context),
    runAnomalyExploitation(features, context),
  ];

  // Calculate category risks
  const locationRisk = Math.round(
    (attacks[0].risk + attacks[1].risk) / 2
  );
  const behaviorRisk = Math.round(
    (attacks[2].risk + attacks[7].risk + attacks[8].risk) / 3
  );
  const identityRisk = Math.round(
    (attacks[4].risk + attacks[5].risk) / 2
  );
  const interestRisk = attacks[3].risk;
  const reidentificationRisk = attacks[5].risk;

  // Overall risk (weighted average)
  const overallRisk = Math.round(
    locationRisk * 0.25 +
    behaviorRisk * 0.2 +
    identityRisk * 0.25 +
    interestRisk * 0.15 +
    reidentificationRisk * 0.15
  );

  return {
    attacks,
    overallRisk,
    categoryRisks: {
      location: locationRisk,
      behavior: behaviorRisk,
      identity: identityRisk,
      interest: interestRisk,
      reidentification: reidentificationRisk,
    },
    adversaryProfile: profile,
    duration: Date.now() - start,
  };
}
