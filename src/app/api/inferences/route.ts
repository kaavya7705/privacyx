import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Inference } from "@/lib/models/Inference";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    await connectDB();
    const inferences = await Inference.find({ userId: session.userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ inferences });
  } catch (error) {
    console.error("Inferences GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
