import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { GraphNode, GraphEdge } from "@/lib/models/Graph";
import { AttackRun } from "@/lib/models/AttackRun";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    // Get latest attack run
    const latestRun = (await AttackRun.findOne({ userId: session.userId, status: "completed" })
      .sort({ createdAt: -1 })
      .lean()) as { _id: unknown } | null;

    if (!latestRun) {
      return NextResponse.json({ nodes: [], edges: [], message: "No attack run found" });
    }

    const [nodes, edges] = await Promise.all([
      GraphNode.find({ userId: session.userId, attackRunId: latestRun._id }).lean(),
      GraphEdge.find({ userId: session.userId, attackRunId: latestRun._id }).lean(),
    ]);

    return NextResponse.json({ nodes, edges, attackRunId: latestRun._id });
  } catch (error) {
    console.error("Graph GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
