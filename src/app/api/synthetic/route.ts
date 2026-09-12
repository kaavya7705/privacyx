import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { Event } from "@/lib/models/Event";
import { generateSyntheticData, type ProfileType } from "@/lib/engine/synthetic";

// POST — Generate synthetic events for testing
export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { profile = "software_engineer", days = 14, eventsPerDay = 20 } = await req.json();

    const dataset = generateSyntheticData(profile as ProfileType, days, eventsPerDay);

    await connectDB();

    const eventsWithUser = dataset.events.map((e) => ({
      ...e,
      userId: session.userId,
    }));

    const inserted = await Event.insertMany(eventsWithUser);

    return NextResponse.json({
      success: true,
      count: inserted.length,
      profile,
      groundTruth: dataset.groundTruth,
    });
  } catch (error) {
    console.error("Synthetic POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — Clear test/synthetic events and associated attack runs without deleting user account
export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    const { AttackRun } = await import("@/lib/models/AttackRun");
    const { Inference } = await import("@/lib/models/Inference");
    const { RiskSnapshot } = await import("@/lib/models/RiskSnapshot");
    const { GraphNode, GraphEdge } = await import("@/lib/models/Graph");

    const deleteResult = await Event.deleteMany({ userId: session.userId });

    await Promise.all([
      AttackRun.deleteMany({ userId: session.userId }),
      Inference.deleteMany({ userId: session.userId }),
      RiskSnapshot.deleteMany({ userId: session.userId }),
      GraphNode.deleteMany({ userId: session.userId }),
      GraphEdge.deleteMany({ userId: session.userId }),
    ]);

    return NextResponse.json({
      success: true,
      message: "Test data and attack results cleared successfully",
      deletedEvents: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error("Synthetic DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

