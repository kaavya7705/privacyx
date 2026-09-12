/**
 * Attack Types & Adversary Profiles
 */

export type AttackType =
  | "HOME_LOCATION_INFERENCE"
  | "WORK_LOCATION_INFERENCE"
  | "ROUTINE_INFERENCE"
  | "INTEREST_INFERENCE"
  | "BEHAVIORAL_FINGERPRINT"
  | "REIDENTIFICATION"
  | "CROSS_SOURCE_CORRELATION"
  | "TEMPORAL_INFERENCE"
  | "ANOMALY_EXPLOITATION";

export type AdversaryProfile = "weak" | "moderate" | "strong" | "targeted";

export interface AttackResult {
  type: AttackType;
  confidence: number; // 0-1
  risk: number; // 0-100
  evidence: Array<{
    id: string;
    description: string;
    strength: number;
  }>;
  assumptions: string[];
  alternatives: string[];
  adversaryProfile: AdversaryProfile;
  details: Record<string, unknown>;
}

export interface AttackContext {
  adversaryProfile: AdversaryProfile;
  adversaryKnowledge: number; // 0-1, scales with profile
}

// Adversary knowledge multipliers
export const ADVERSARY_MULTIPLIERS: Record<AdversaryProfile, number> = {
  weak: 0.6,
  moderate: 1.0,
  strong: 1.3,
  targeted: 1.6,
};

export const ADVERSARY_DESCRIPTIONS: Record<AdversaryProfile, string> = {
  weak: "Only sees observed telemetry data",
  moderate: "Telemetry + publicly available context",
  strong: "Telemetry + external reference datasets",
  targeted: "Telemetry + prior knowledge about specific individuals",
};

export function getAdversaryContext(profile: AdversaryProfile): AttackContext {
  const knowledgeMap: Record<AdversaryProfile, number> = {
    weak: 0.1,
    moderate: 0.4,
    strong: 0.7,
    targeted: 0.9,
  };
  return {
    adversaryProfile: profile,
    adversaryKnowledge: knowledgeMap[profile],
  };
}
