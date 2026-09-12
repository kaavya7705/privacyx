import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Event } from "@/lib/models/Event";
import { AttackRun } from "@/lib/models/AttackRun";
import { Inference } from "@/lib/models/Inference";
import { RiskSnapshot } from "@/lib/models/RiskSnapshot";
import { GraphNode, GraphEdge } from "@/lib/models/Graph";
import { MLPrediction } from "@/lib/models/MLPrediction";
import { getSession } from "@/lib/auth";
import { extractFeatures } from "@/lib/engine/features";
import { runAttackBattery } from "@/lib/engine/attacks";
import { computeRisk } from "@/lib/engine/risk";
import { generatePrivacyReport } from "@/lib/engine/explainer";
import {
  eventsToFeatureVectors,
  runMLAnomalyDetection,
  runMLRoutineDetection,
  runMLReidentification,
} from "@/lib/ml-client";
import type { AdversaryProfile } from "@/lib/engine/attacks/types";
import type { IEvent } from "@/lib/models/Event";

// POST — Run full attack battery
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { attackProfile = "moderate" } = await req.json().catch(() => ({}));

    await connectDB();

    // Get latest risk snapshot
    const lastSnapshot = (await RiskSnapshot.findOne({ userId: session.userId })
      .sort({ createdAt: -1 })
      .lean()) as { overall?: number } | null;

    // Create attack run record
    const attackRun = await AttackRun.create({
      userId: session.userId,
      status: "running",
      attackProfile,
      riskBefore: lastSnapshot?.overall || 0,
      startedAt: new Date(),
    });

    // Fetch user events
    const events = await Event.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();

    if (events.length === 0) {
      await AttackRun.findByIdAndUpdate(attackRun._id, {
        status: "completed",
        completedAt: new Date(),
        riskAfter: 0,
      });
      return NextResponse.json({
        attackRunId: attackRun._id,
        message: "No events found. Generate some events first.",
        overallRisk: 0,
        attacks: [],
      });
    }

    // 1. Run heuristic feature extraction + attack battery
    const features = extractFeatures(events as unknown as IEvent[]);
    const attackResults = runAttackBattery(features, attackProfile as AdversaryProfile);
    const riskScore = computeRisk(features, attackResults);

    // 2. Run Python ML Microservice (FastAPI on port 8000)
    const featureVectors = eventsToFeatureVectors(events as unknown as IEvent[]);
    let mlServiceUsed = false;
    let mlStats: Record<string, unknown> | null = null;

    if (featureVectors.length >= 5) {
      try {
        const [anomalies, routines, reid] = await Promise.all([
          runMLAnomalyDetection(featureVectors),
          runMLRoutineDetection(featureVectors),
          runMLReidentification(featureVectors),
        ]);

        if (anomalies || routines || reid) {
          mlServiceUsed = true;
          mlStats = {
            anomalyCount: anomalies?.anomaly_count ?? 0,
            anomalyPercentage: anomalies?.anomaly_percentage ?? 0,
            routineCount: routines?.routine_count ?? 0,
            reidRisk: reid?.risk_score ?? 0,
          };

          // If Isolation Forest detected high anomaly rate, enrich attack battery
          if (anomalies && anomalies.anomaly_count > 0) {
            attackResults.attacks.push({
              type: "ANOMALY_EXPLOITATION",
              adversaryProfile: attackProfile as AdversaryProfile,
              confidence: Math.min(0.95, anomalies.anomaly_percentage / 100 + 0.3),
              risk: Math.min(95, Math.round(anomalies.anomaly_percentage * 5 + 35)),
              evidence: anomalies.anomaly_indices.slice(0, 5).map((idx, i) => ({
                id: `ml-anomaly-${i}`,
                source: "ml-isolation-forest",
                description: `Isolation Forest flagged event #${idx + 1} as outlier privacy anomaly (score: ${anomalies.scores[idx]?.toFixed(3) || "N/A"})`,
                strength: 0.85,
                timestamp: new Date(),
              })),
              assumptions: [
                "Scikit-Learn Isolation Forest trained on user event feature space",
                "Unusual timestamp or category spikes expose high-leakage activities",
              ],
              alternatives: ["Irregular user schedule or intentional non-routine browsing"],
              details: {
                model: "IsolationForest",
                contamination: 0.08,
                totalAnomalies: anomalies.anomaly_count,
              },
            });
          }

          // Save ML prediction in MongoDB
          await MLPrediction.create({
            userId: session.userId,
            model: "FastAPI-Scikit-Learn",
            modelVersion: "1.0",
            prediction: reid?.risk_score ?? riskScore.overall,
            features: {
              sampleCount: featureVectors.length,
              anomalyCount: anomalies?.anomaly_count ?? 0,
              routineCount: routines?.routine_count ?? 0,
            },
            featureImportance: reid?.feature_importance ?? {},
            explanation: {
              isolationForestContamination: 0.08,
              dbscanRoutines: routines?.routine_count,
            },
          });
        }
      } catch (mlErr) {
        console.warn("Python ML processing error:", mlErr);
      }
    }

    // 3. Generate Groq AI Executive Risk Report using openai/gpt-oss-20b
    let aiReport: string | null = null;
    try {
      aiReport = await generatePrivacyReport(attackResults.attacks, riskScore.overall);
    } catch (aiErr) {
      console.warn("Groq AI report error:", aiErr);
    }

    // Save inferences
    const inferences = await Promise.all(
      attackResults.attacks.map((attack) =>
        Inference.create({
          userId: session.userId,
          attackRunId: attackRun._id,
          type: attack.type
            .replace("HOME_LOCATION_INFERENCE", "LIKELY_HOME_AREA")
            .replace("WORK_LOCATION_INFERENCE", "LIKELY_WORK_AREA")
            .replace("ROUTINE_INFERENCE", "PREDICTABLE_ROUTINE")
            .replace("INTEREST_INFERENCE", "INTEREST_PROFILE")
            .replace("BEHAVIORAL_FINGERPRINT", "BEHAVIORAL_FINGERPRINT")
            .replace("REIDENTIFICATION", "REIDENTIFICATION_RISK")
            .replace("CROSS_SOURCE_CORRELATION", "CROSS_SOURCE_CORRELATION")
            .replace("TEMPORAL_INFERENCE", "TEMPORAL_PATTERN")
            .replace("ANOMALY_EXPLOITATION", "ANOMALY_EXPLOITATION"),
          confidence: attack.confidence,
          risk: attack.risk,
          evidence: attack.evidence,
          attackProfile,
          assumptions: attack.assumptions,
          alternatives: attack.alternatives,
        })
      )
    );

    // Save risk snapshot
    await RiskSnapshot.create({
      userId: session.userId,
      ...riskScore,
    });

    // Build evidence graph
    await buildEvidenceGraph(session.userId, attackRun._id.toString(), attackResults.attacks);

    // Update attack run
    await AttackRun.findByIdAndUpdate(attackRun._id, {
      status: "completed",
      completedAt: new Date(),
      duration: attackResults.duration,
      riskAfter: riskScore.overall,
      attacks: attackResults.attacks.map((a) => ({
        type: a.type,
        confidence: a.confidence,
        risk: a.risk,
        evidenceCount: a.evidence.length,
      })),
    });

    return NextResponse.json({
      attackRunId: attackRun._id,
      overallRisk: riskScore.overall,
      categoryRisks: riskScore,
      aiReport,
      mlServiceUsed,
      mlStats,
      attacks: attackResults.attacks.map((a) => ({
        type: a.type,
        confidence: Math.round(a.confidence * 100),
        risk: a.risk,
        evidenceCount: a.evidence.length,
        evidence: a.evidence,
        assumptions: a.assumptions,
        alternatives: a.alternatives,
        details: a.details,
      })),
      duration: attackResults.duration,
      inferenceIds: inferences.map((i) => i._id),
    });
  } catch (error) {
    console.error("Attack POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET — List attack runs
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "20");

    await connectDB();

    const runs = await AttackRun.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ runs });
  } catch (error) {
    console.error("Attack GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper: Build evidence graph
async function buildEvidenceGraph(
  userId: string,
  attackRunId: string,
  attacks: ReturnType<typeof runAttackBattery>["attacks"]
) {
  // Clear previous graph for this run
  await GraphNode.deleteMany({ attackRunId });
  await GraphEdge.deleteMany({ attackRunId });

  // Create user node
  const userNode = { userId, attackRunId, nodeId: "user", type: "user" as const, label: "USER", data: {}, position: { x: 400, y: 0 } };

  // Create signal nodes
  const signalNodes = [
    { nodeId: "signal-browser", type: "signal" as const, label: "Browser Activity", position: { x: 100, y: 150 } },
    { nodeId: "signal-time", type: "signal" as const, label: "Time Patterns", position: { x: 400, y: 150 } },
    { nodeId: "signal-category", type: "signal" as const, label: "Categories", position: { x: 700, y: 150 } },
  ].map((n) => ({ ...n, userId, attackRunId, data: {} }));

  // Create pattern & inference nodes from attacks
  const patternNodes = attacks.map((attack, i) => ({
    userId,
    attackRunId,
    nodeId: `inference-${attack.type}`,
    type: "inference" as const,
    label: attack.type.replace(/_/g, " "),
    data: { confidence: attack.confidence, risk: attack.risk },
    position: { x: 100 + (i % 3) * 300, y: 300 + Math.floor(i / 3) * 120 },
  }));

  await GraphNode.insertMany([userNode, ...signalNodes, ...patternNodes]);

  // Create edges
  const edges = [
    // User -> signals
    ...signalNodes.map((s) => ({
      userId, attackRunId, edgeId: `edge-user-${s.nodeId}`, source: "user", target: s.nodeId, strength: 0.8,
    })),
    // Signals -> inferences
    ...attacks.map((attack) => ({
      userId, attackRunId,
      edgeId: `edge-signal-${attack.type}`,
      source: attack.type.includes("LOCATION") || attack.type.includes("HOME") || attack.type.includes("WORK")
        ? "signal-time" : attack.type.includes("INTEREST") || attack.type.includes("FINGERPRINT")
        ? "signal-category" : "signal-browser",
      target: `inference-${attack.type}`,
      strength: attack.confidence,
      label: `${Math.round(attack.confidence * 100)}%`,
    })),
  ];

  await GraphEdge.insertMany(edges);
}
