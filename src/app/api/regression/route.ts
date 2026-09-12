import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Event } from "@/lib/models/Event";
import { RiskSnapshot } from "@/lib/models/RiskSnapshot";
import { RegressionTest } from "@/lib/models/RegressionTest";
import { getSession } from "@/lib/auth";
import { extractFeatures } from "@/lib/engine/features";
import { runAttackBattery } from "@/lib/engine/attacks";
import { computeRisk } from "@/lib/engine/risk";
import { generateSyntheticData, type ProfileType } from "@/lib/engine/synthetic";
import type { IEvent } from "@/lib/models/Event";

// POST — Run regression test
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { newDataSource = "location", syntheticProfile } = await req.json().catch(() => ({}));

    await connectDB();

    // Get baseline risk
    const lastSnapshot = (await RiskSnapshot.findOne({ userId: session.userId })
      .sort({ createdAt: -1 })
      .lean()) as Record<string, number> | null;

    const baselineRisks = {
      overall: lastSnapshot?.overall || 0,
      location: lastSnapshot?.location || 0,
      behavior: lastSnapshot?.behavior || 0,
      identity: lastSnapshot?.identity || 0,
      interest: lastSnapshot?.interest || 0,
      reidentification: lastSnapshot?.reidentification || 0,
    };

    // Get existing events
    const existingEvents = await Event.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean();

    // Generate new data source events (synthetic for demo)
    const newEvents = syntheticProfile
      ? generateSyntheticData(syntheticProfile as ProfileType, 7, 15).events
      : generateLocationData(30);

    // Combine and re-analyze
    const allEvents = [...existingEvents, ...newEvents.map((e) => ({ ...e, userId: session.userId, source: newDataSource }))] as unknown as IEvent[];

    const features = extractFeatures(allEvents);
    const attackResults = runAttackBattery(features, "moderate");
    const newRiskScore = computeRisk(features, attackResults);

    const newRisks = {
      overall: newRiskScore.overall,
      location: newRiskScore.location,
      behavior: newRiskScore.behavior,
      identity: newRiskScore.identity,
      interest: newRiskScore.interest,
      reidentification: newRiskScore.reidentification,
    };

    // Calculate regressions
    const categories = ["overall", "location", "behavior", "identity", "interest", "reidentification"] as const;
    const regressions = categories.map((cat) => {
      const before = baselineRisks[cat];
      const after = newRisks[cat];
      const delta = after - before;
      let severity: "none" | "minor" | "major" | "critical" = "none";
      if (delta > 30) severity = "critical";
      else if (delta > 20) severity = "major";
      else if (delta > 10) severity = "minor";

      return {
        category: cat,
        before,
        after,
        delta,
        severity,
        cause: delta > 10 ? `${newDataSource} data correlation with existing signals` : undefined,
      };
    });

    const totalRegression = regressions.reduce((sum, r) => sum + Math.max(0, r.delta), 0);
    const hasRegression = regressions.some((r) => r.severity !== "none");

    const test = await RegressionTest.create({
      userId: session.userId,
      baselineRisks,
      newRisks,
      regressions,
      newDataSource,
      totalRegression,
      hasRegression,
    });

    // Save new risk snapshot
    await RiskSnapshot.create({
      userId: session.userId,
      ...newRiskScore,
    });

    return NextResponse.json({
      testId: test._id,
      baselineRisks,
      newRisks,
      regressions,
      totalRegression,
      hasRegression,
      newDataSource,
    });
  } catch (error) {
    console.error("Regression POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET — List regression tests
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();
    const tests = await RegressionTest.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({ tests });
  } catch (error) {
    console.error("Regression GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

function generateLocationData(count: number) {
  const events = [];
  for (let i = 0; i < count; i++) {
    const hour = Math.floor(Math.random() * 24);
    events.push({
      source: "location",
      type: "location_update",
      category: "location",
      domainCategory: "location",
      timeBucket: `${hour.toString().padStart(2, "0")}:00-${((hour + 1) % 24).toString().padStart(2, "0")}:00`,
      durationBucket: "5-10m",
      dayOfWeek: Math.floor(Math.random() * 7),
      hourOfDay: hour,
      sensitivity: 0.7,
      metadata: { synthetic: true },
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
    });
  }
  return events;
}
