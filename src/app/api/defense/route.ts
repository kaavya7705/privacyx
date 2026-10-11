import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Event } from "@/lib/models/Event";
import { DefenseRun } from "@/lib/models/DefenseRun";
import { RiskSnapshot } from "@/lib/models/RiskSnapshot";
import { getSession } from "@/lib/auth";
import { compareDefenses, applyDefense } from "@/lib/engine/defenses";
import {
  eventsToFeatureVectors,
  runMLDefensePrediction,
  checkMLHealth,
} from "@/lib/ml-client";
import type { IEvent } from "@/lib/models/Event";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { strategy, action } = body;

    await connectDB();

    let events = await Event.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(1000);


    const lastSnapshot = (await RiskSnapshot.findOne({ userId: session.userId })
      .sort({ createdAt: -1 })
      .lean()) as { overall?: number } | null;

    const currentRisk = lastSnapshot?.overall || 50;

    // Reset defense / restore un-defended baseline telemetry
    if (body.action === "reset" || strategy === "none") {
      await DefenseRun.updateMany(
        { userId: session.userId, active: true },
        { $set: { active: false, deactivatedAt: new Date() } }
      );

      // Clean up injected synthetic defense noise, but keep real user events
      await Event.deleteMany({ userId: session.userId, "metadata.defenseNoise": true });

      // Recompute baseline risk from remaining authentic events
      const remainingEvents = await Event.find({ userId: session.userId }).sort({ createdAt: -1 }).limit(1000).lean();
      let restoredRisk = 50;
      if (remainingEvents.length > 0) {
        const { extractFeatures } = await import("@/lib/engine/features");
        const { runAttackBattery } = await import("@/lib/engine/attacks");
        const { computeRisk } = await import("@/lib/engine/risk");
        const feats = extractFeatures(remainingEvents as unknown as IEvent[]);
        const attacks = runAttackBattery(feats);
        const rScore = computeRisk(feats, attacks);
        restoredRisk = rScore.overall;
      }

      await RiskSnapshot.create({
        userId: session.userId,
        overall: restoredRisk,
        breakdown: {
          location: restoredRisk,
          temporal: restoredRisk,
          behavioral: restoredRisk,
          identity: restoredRisk,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Defense deactivated. Unprotected baseline telemetry restored.",
        activeDefense: null,
      });
    }

    if (strategy) {
      // ===== APPLY SPECIFIC DEFENSE =====

      // Step 1: Run the defense transformation + re-attack
      const result = applyDefense(events as unknown as IEvent[], strategy, currentRisk);

      // Step 2: Deactivate any previously active defenses for this user
      await DefenseRun.updateMany(
        { userId: session.userId, active: true },
        { $set: { active: false, deactivatedAt: new Date() } }
      );

      // Step 3: Call ML Service to evaluate defense effectiveness
      let mlAssessment: Array<{
        modelName: string;
        modelType: string;
        riskBefore: number;
        riskAfter: number;
        reduction: number;
        effective: boolean;
      }> = [];
      let mlRiskBefore = 0;
      let mlRiskAfter = 0;
      let mlRiskReduction = 0;
      let mlModelsUsed: string[] = [];
      let mlDefenseResult = null;

      const mlHealth = await checkMLHealth();
      if (mlHealth.online) {
        try {
          const preFeatures = eventsToFeatureVectors(events as unknown as IEvent[]);
          const postFeatures = eventsToFeatureVectors(result.transformedEvents as unknown as IEvent[]);

          mlDefenseResult = await runMLDefensePrediction(
            preFeatures,
            postFeatures,
            strategy,
            session.userId
          );

          if (mlDefenseResult) {
            mlRiskBefore = mlDefenseResult.risk_before;
            mlRiskAfter = mlDefenseResult.risk_after;
            mlRiskReduction = mlDefenseResult.ml_risk_reduction;
            mlModelsUsed = mlDefenseResult.models_used || [];

            mlAssessment = Object.entries(mlDefenseResult.model_assessments || {}).map(
              ([name, assessment]) => ({
                modelName: name,
                modelType: (assessment as { model_type?: string }).model_type || name,
                riskBefore: (assessment as { risk_before?: number }).risk_before || 0,
                riskAfter: (assessment as { risk_after?: number }).risk_after || 0,
                reduction: (assessment as { reduction?: number }).reduction || 0,
                effective: (assessment as { effective?: boolean }).effective || false,
              })
            );
          }
        } catch (mlErr) {
          console.warn("ML defense assessment error:", mlErr);
        }
      }

      // Step 4: PERSIST the transformed events to the database
      // Delete old events and insert transformed ones
      if (strategy !== "none" && result.transformedEvents.length > 0) {
        await Event.deleteMany({ userId: session.userId });
        const transformedDocs = result.transformedEvents.map((e) => {
          const plain = (e && typeof (e as { toObject?: () => Record<string, unknown> }).toObject === "function")
            ? (e as { toObject: () => Record<string, unknown> }).toObject()
            : { ...(e as unknown as Record<string, unknown>) };
          delete plain._id;
          delete plain.__v;
          return {
            ...plain,
            userId: session.userId,
            createdAt: plain.createdAt ? new Date(plain.createdAt as string | number | Date) : new Date(),
          };
        });
        await Event.insertMany(transformedDocs);
      }

      // Step 5: Save defense run with full details
      const defenseRun = await DefenseRun.create({
        userId: session.userId,
        strategies: [{
          name: result.strategyName,
          strategy: result.strategy,
          riskBefore: result.riskBefore,
          riskAfter: result.riskAfter,
          utilityRetained: result.utilityRetained,
          privacyImprovement: result.privacyImprovement,
        }],
        selectedStrategy: strategy,
        riskBefore: result.riskBefore,
        riskAfter: result.riskAfter,
        utilityRetained: result.utilityRetained,
        privacyImprovement: result.privacyImprovement,
        active: strategy !== "none",
        transformationLog: result.transformationLog,
        mlAssessment,
        mlRiskBefore,
        mlRiskAfter,
        mlRiskReduction,
        mlModelsUsed,
        eventsModified: result.transformationLog.reduce((sum, t) => sum + t.eventCount, 0),
        eventsBefore: result.eventCountBefore,
        eventsAfter: result.eventCountAfter,
      });

      // Step 6: Save risk snapshot reflecting post-defense state
      await RiskSnapshot.create({
        userId: session.userId,
        overall: Math.round(result.riskAfter),
        breakdown: {
          location: Math.round(result.riskAfter * 0.9),
          temporal: Math.round(result.riskAfter * 0.85),
          behavioral: Math.round(result.riskAfter * 0.95),
          identity: Math.round(result.riskAfter * 0.8),
        },
      });

      return NextResponse.json({
        defenseRun,
        result: {
          strategy: result.strategy,
          strategyName: result.strategyName,
          strategyDescription: result.strategyDescription,
          riskBefore: result.riskBefore,
          riskAfter: result.riskAfter,
          utilityRetained: result.utilityRetained,
          privacyImprovement: result.privacyImprovement,
          attackComparisons: result.attackComparisons,
          eventCountBefore: result.eventCountBefore,
          eventCountAfter: result.eventCountAfter,
          transformationLog: result.transformationLog,
          // ML assessment data
          mlServiceUsed: mlHealth.online,
          mlDefenseResult: mlDefenseResult ? {
            defenseEffective: mlDefenseResult.defense_effective,
            riskBefore: mlDefenseResult.risk_before,
            riskAfter: mlDefenseResult.risk_after,
            mlRiskReduction: mlDefenseResult.ml_risk_reduction,
            modelAssessments: mlDefenseResult.model_assessments,
            modelsUsed: mlDefenseResult.models_used,
          } : null,
          eventsPersisted: strategy !== "none",
        },
      });
    } else {
      // ===== COMPARE ALL DEFENSES =====
      const results = compareDefenses(events as unknown as IEvent[], currentRisk);

      // Check for active defense
      const activeDefense = await DefenseRun.findOne({
        userId: session.userId,
        active: true,
      }).sort({ createdAt: -1 }).lean();

      return NextResponse.json({
        comparisons: results.map((r) => ({
          strategy: r.strategy,
          strategyName: r.strategyName,
          strategyDescription: r.strategyDescription,
          riskBefore: r.riskBefore,
          riskAfter: r.riskAfter,
          utilityRetained: r.utilityRetained,
          privacyImprovement: r.privacyImprovement,
          attackComparisons: r.attackComparisons,
          eventCountBefore: r.eventCountBefore,
          eventCountAfter: r.eventCountAfter,
          transformationLog: r.transformationLog,
        })),
        activeDefense: activeDefense ? {
          strategy: (activeDefense as { selectedStrategy?: string }).selectedStrategy,
          appliedAt: (activeDefense as { createdAt?: Date }).createdAt,
        } : null,
      });
    }
  } catch (error) {
    console.error("Defense POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET — Check active defense status
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const activeDefense = await DefenseRun.findOne({
      userId: session.userId,
      active: true,
    }).sort({ createdAt: -1 }).lean();

    const recentDefenses = await DefenseRun.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return NextResponse.json({
      activeDefense: activeDefense || null,
      recentDefenses,
    });
  } catch (error) {
    console.error("Defense GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — Deactivate defense and restore un-defended baseline telemetry
export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    await DefenseRun.updateMany(
      { userId: session.userId, active: true },
      { $set: { active: false, deactivatedAt: new Date() } }
    );

    // Clean up injected synthetic defense noise, but keep real user events
    await Event.deleteMany({ userId: session.userId, "metadata.defenseNoise": true });

    const remainingEvents = await Event.find({ userId: session.userId }).sort({ createdAt: -1 }).limit(1000).lean();
    let restoredRisk = 50;
    if (remainingEvents.length > 0) {
      const { extractFeatures } = await import("@/lib/engine/features");
      const { runAttackBattery } = await import("@/lib/engine/attacks");
      const { computeRisk } = await import("@/lib/engine/risk");
      const feats = extractFeatures(remainingEvents as unknown as IEvent[]);
      const attacks = runAttackBattery(feats);
      const rScore = computeRisk(feats, attacks);
      restoredRisk = rScore.overall;
    }

    await RiskSnapshot.create({
      userId: session.userId,
      overall: restoredRisk,
      breakdown: {
        location: restoredRisk,
        temporal: restoredRisk,
        behavioral: restoredRisk,
        identity: restoredRisk,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Defense deactivated. Unprotected baseline telemetry restored.",
    });
  } catch (error) {
    console.error("Defense DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

