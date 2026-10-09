import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Event } from "@/lib/models/Event";
import { DefenseRun } from "@/lib/models/DefenseRun";
import { RiskSnapshot } from "@/lib/models/RiskSnapshot";
import { getSession } from "@/lib/auth";
import { evaluateAutoDefense } from "@/lib/engine/autoDefense";
import { applyDefense } from "@/lib/engine/defenses";
import { generateSyntheticData } from "@/lib/engine/synthetic";
import { checkMLHealth, eventsToFeatureVectors, runMLDefensePrediction } from "@/lib/ml-client";
import type { IEvent } from "@/lib/models/Event";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    let events = await Event.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(1000);

    if (events.length === 0) {
      const starter = generateSyntheticData("student", 7, 12);
      const docs = starter.events.map((e) => ({
        ...e,
        userId: session.userId,
      }));
      await Event.insertMany(docs);
      events = await Event.find({ userId: session.userId })
        .sort({ createdAt: -1 })
        .limit(1000);
    }

    const recommendation = evaluateAutoDefense(events as unknown as IEvent[]);

    // Check if defense is already active
    const activeDefense = await DefenseRun.findOne({
      userId: session.userId,
      active: true,
    }).sort({ createdAt: -1 }).lean();

    return NextResponse.json({
      recommendation,
      eventCount: events.length,
      activeDefense: activeDefense || null,
    });
  } catch (error) {
    console.error("Auto-defense GET error:", error);
    return NextResponse.json(
      { error: "Failed to evaluate auto-defense" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    let events = await Event.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(1000);

    if (events.length === 0) {
      const starter = generateSyntheticData("student", 7, 12);
      const docs = starter.events.map((e) => ({
        ...e,
        userId: session.userId,
      }));
      await Event.insertMany(docs);
      events = await Event.find({ userId: session.userId })
        .sort({ createdAt: -1 })
        .limit(1000);
    }

    const lastSnapshot = (await RiskSnapshot.findOne({ userId: session.userId })
      .sort({ createdAt: -1 })
      .lean()) as { overall?: number } | null;

    const currentRisk = lastSnapshot?.overall || 65;

    // 1. Evaluate optimal auto-defense recommendation
    const recommendation = evaluateAutoDefense(events as unknown as IEvent[]);
    const strategy = recommendation.recommendedStrategy;

    // 2. Apply defense transformation with transformation tracking
    const result = applyDefense(events as unknown as IEvent[], strategy, currentRisk);

    // 3. Deactivate old active defenses
    await DefenseRun.updateMany(
      { userId: session.userId, active: true },
      { $set: { active: false, deactivatedAt: new Date() } }
    );

    // 4. ML Defense Prediction
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
        console.warn("ML auto-defense assessment error:", mlErr);
      }
    }

    // 5. Persist transformed events to MongoDB
    if (result.transformedEvents.length > 0) {
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

    // 6. Persist defense run with active = true
    const defenseRun = await DefenseRun.create({
      userId: session.userId,
      strategies: [
        {
          name: result.strategyName,
          strategy: result.strategy,
          riskBefore: result.riskBefore,
          riskAfter: result.riskAfter,
          utilityRetained: result.utilityRetained,
          privacyImprovement: result.privacyImprovement,
        },
      ],
      selectedStrategy: result.strategy,
      riskBefore: result.riskBefore,
      riskAfter: result.riskAfter,
      utilityRetained: result.utilityRetained,
      privacyImprovement: result.privacyImprovement,
      active: true,
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

    // 7. Save a new risk snapshot reflecting post-defense privacy status
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
      success: true,
      recommendation,
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
        mlDefenseResult,
        eventsPersisted: true,
      },
    });
  } catch (error) {
    console.error("Auto-defense POST error:", error);
    return NextResponse.json(
      { error: "Failed to apply auto-defense" },
      { status: 500 }
    );
  }
}
