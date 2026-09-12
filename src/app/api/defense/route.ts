import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Event } from "@/lib/models/Event";
import { DefenseRun } from "@/lib/models/DefenseRun";
import { RiskSnapshot } from "@/lib/models/RiskSnapshot";
import { getSession } from "@/lib/auth";
import { compareDefenses, applyDefense } from "@/lib/engine/defenses";
import type { IEvent } from "@/lib/models/Event";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { strategy } = await req.json();

    await connectDB();

    const events = await Event.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(1000);

    const lastSnapshot = (await RiskSnapshot.findOne({ userId: session.userId })
      .sort({ createdAt: -1 })
      .lean()) as { overall?: number } | null;

    const currentRisk = lastSnapshot?.overall || 50;

    if (strategy) {
      // Apply specific defense
      const result = applyDefense(events as unknown as IEvent[], strategy, currentRisk);

      const defenseRun = await DefenseRun.create({
        userId: session.userId,
        strategies: [{ name: strategy, ...result }],
        selectedStrategy: strategy,
        riskBefore: currentRisk,
        riskAfter: result.riskAfter,
        utilityRetained: result.utilityRetained,
        privacyImprovement: result.privacyImprovement,
      });

      return NextResponse.json({ defenseRun, result });
    } else {
      // Compare all defenses
      const results = compareDefenses(events as unknown as IEvent[], currentRisk);

      return NextResponse.json({
        comparisons: results.map((r) => ({
          strategy: r.strategy,
          riskBefore: r.riskBefore,
          riskAfter: r.riskAfter,
          utilityRetained: r.utilityRetained,
          privacyImprovement: r.privacyImprovement,
        })),
      });
    }
  } catch (error) {
    console.error("Defense POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
