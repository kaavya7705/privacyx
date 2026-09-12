import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { Event } from "@/lib/models/Event";
import { Inference } from "@/lib/models/Inference";
import { RiskSnapshot } from "@/lib/models/RiskSnapshot";
import { AttackRun } from "@/lib/models/AttackRun";
import { DefenseRun } from "@/lib/models/DefenseRun";
import { GraphNode, GraphEdge } from "@/lib/models/Graph";
import { MLPrediction } from "@/lib/models/MLPrediction";
import { RegressionTest } from "@/lib/models/RegressionTest";
import { Consent } from "@/lib/models/Consent";
import { ModelEvaluation } from "@/lib/models/ModelEvaluation";
import { getSession, destroySession } from "@/lib/auth";

export async function DELETE() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    // Delete all user data across all collections
    await Promise.all([
      Event.deleteMany({ userId: session.userId }),
      Inference.deleteMany({ userId: session.userId }),
      RiskSnapshot.deleteMany({ userId: session.userId }),
      AttackRun.deleteMany({ userId: session.userId }),
      DefenseRun.deleteMany({ userId: session.userId }),
      GraphNode.deleteMany({ userId: session.userId }),
      GraphEdge.deleteMany({ userId: session.userId }),
      MLPrediction.deleteMany({ userId: session.userId }),
      RegressionTest.deleteMany({ userId: session.userId }),
      Consent.deleteMany({ userId: session.userId }),
      ModelEvaluation.deleteMany({ userId: session.userId }),
      User.findByIdAndDelete(session.userId),
    ]);

    await destroySession();

    return NextResponse.json({ success: true, message: "All data deleted" });
  } catch (error) {
    console.error("User data DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
