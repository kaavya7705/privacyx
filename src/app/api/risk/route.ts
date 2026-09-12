import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { RiskSnapshot } from "@/lib/models/RiskSnapshot";
import { getSession } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const snapshot = await RiskSnapshot.findOne({ userId: session.userId })
      .sort({ createdAt: -1 })
      .lean();

    if (!snapshot) {
      return NextResponse.json({
        overall: 0,
        location: 0,
        behavior: 0,
        identity: 0,
        interest: 0,
        reidentification: 0,
        components: {},
        attackProfile: "moderate",
        message: "No risk data yet. Run an attack first.",
      });
    }

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("Risk GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
