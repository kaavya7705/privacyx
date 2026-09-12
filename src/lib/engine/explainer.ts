/**
 * Groq AI Explainer — generates human-readable explanations from structured evidence
 */

import { getGroqClient } from "@/lib/groq";
import type { AttackResult } from "@/lib/engine/attacks/types";

export interface ExplanationResult {
  attackNarrative: string;
  evidenceExplanation: string;
  remediation: string;
  summary: string;
}

export async function explainAttackResult(
  attack: AttackResult
): Promise<ExplanationResult> {
  const groq = getGroqClient();

  const structuredEvidence = {
    attack: attack.type,
    confidence: attack.confidence,
    risk: attack.risk,
    attackProfile: attack.adversaryProfile,
    evidence: attack.evidence.map((e) => e.description),
    assumptions: attack.assumptions,
    alternatives: attack.alternatives,
  };

  const prompt = `You are a privacy risk analyst for PrivacyX, a personal data penetration testing platform.

Analyze the following privacy attack result and generate a clear, professional explanation.

IMPORTANT RULES:
- Never state inferences as facts. Use phrases like "likely", "candidate", "may indicate"
- Always reference specific evidence
- Mention the confidence level and what it means
- Include the attacker profile's influence
- Suggest specific privacy-preserving countermeasures
- Keep language accessible but technically accurate
- Do NOT fabricate additional evidence or claims beyond what is provided

ATTACK RESULT:
${JSON.stringify(structuredEvidence, null, 2)}

Respond in this exact JSON format:
{
  "attackNarrative": "A 2-3 sentence narrative of what this attack reveals and how an attacker would use it",
  "evidenceExplanation": "A detailed explanation of the specific evidence supporting this inference, referencing each piece",
  "remediation": "2-3 specific, actionable privacy countermeasures the user can take",
  "summary": "A single sentence summary suitable for a dashboard card"
}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "openai/gpt-oss-20b",
      temperature: 0.3,
      max_tokens: 800,
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (content) {
      return JSON.parse(content) as ExplanationResult;
    }
  } catch (error) {
    console.error("Groq explanation error:", error);
  }

  // Fallback: generate deterministic explanation
  return generateFallbackExplanation(attack);
}

export async function generatePrivacyReport(
  attacks: AttackResult[],
  overallRisk: number
): Promise<string> {
  const groq = getGroqClient();

  const summary = attacks.map((a) => ({
    type: a.type,
    confidence: Math.round(a.confidence * 100),
    risk: a.risk,
    profile: a.adversaryProfile,
    evidenceCount: a.evidence.length,
  }));

  const prompt = `You are a privacy risk analyst for PrivacyX.

Generate a concise privacy risk report from these attack results.

Overall Risk: ${overallRisk}/100
Attacks: ${JSON.stringify(summary, null, 2)}

RULES:
- Use clear, professional language
- Never claim certainty — use "likely", "candidate", "may"
- Highlight the most critical findings
- Recommend specific defenses
- Keep it under 300 words
- Format with markdown headings and bullet points`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "openai/gpt-oss-20b",
      temperature: 0.3,
      max_tokens: 600,
    });

    return completion.choices[0]?.message?.content || "Report generation failed.";
  } catch (error) {
    console.error("Groq report error:", error);
    return `## Privacy Risk Report\n\nOverall Risk: ${overallRisk}/100\n\n${attacks.length} attacks analyzed. ${attacks.filter((a) => a.risk > 60).length} high-risk findings detected.`;
  }
}

function generateFallbackExplanation(attack: AttackResult): ExplanationResult {
  const typeLabels: Record<string, string> = {
    HOME_LOCATION_INFERENCE: "home location inference",
    WORK_LOCATION_INFERENCE: "work/education location inference",
    ROUTINE_INFERENCE: "routine prediction",
    INTEREST_INFERENCE: "interest profiling",
    BEHAVIORAL_FINGERPRINT: "behavioral fingerprinting",
    REIDENTIFICATION: "re-identification risk assessment",
    CROSS_SOURCE_CORRELATION: "cross-source correlation",
    TEMPORAL_INFERENCE: "temporal pattern analysis",
    ANOMALY_EXPLOITATION: "anomaly exploitation",
  };

  const label = typeLabels[attack.type] || attack.type;
  const confidencePct = Math.round(attack.confidence * 100);

  return {
    attackNarrative: `A ${attack.adversaryProfile}-capability attacker performing ${label} achieved ${confidencePct}% confidence based on ${attack.evidence.length} evidence signals. This suggests the user's digital traces contain correlatable patterns.`,
    evidenceExplanation: attack.evidence
      .map((e) => `• ${e.description} (strength: ${Math.round(e.strength * 100)}%)`)
      .join("\n"),
    remediation: `Consider applying timestamp bucketing, category generalization, or noise injection to reduce the effectiveness of this attack. Reducing data precision is the most effective countermeasure.`,
    summary: `${label} — ${confidencePct}% confidence, risk level ${attack.risk}/100 under ${attack.adversaryProfile} attacker model.`,
  };
}
