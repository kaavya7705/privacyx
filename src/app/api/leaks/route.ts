import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Leak } from "@/lib/models/Leak";
import { getSession, verifyApiToken } from "@/lib/auth";

// POST — Store leak events from extension
export async function POST(req: Request) {
  try {
    // Support both session auth and bearer token (for extension)
    let userId: string | null = null;

    const session = await getSession();
    if (session) {
      userId = session.userId;
    } else {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        const tokenSession = await verifyApiToken(token);
        if (tokenSession) userId = tokenSession.userId;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { leaks } = await req.json();
    if (!Array.isArray(leaks) || leaks.length === 0) {
      return NextResponse.json({ error: "No leak data provided" }, { status: 400 });
    }

    await connectDB();

    const leakDocs = leaks.map((leak: Record<string, unknown>) => ({
      userId,
      type: leak.type || "tracker",
      domain: leak.domain || "unknown",
      severity: leak.severity || "medium",
      blocked: leak.blocked || false,
      piiDetail: leak.piiDetail || null,
    }));

    const inserted = await Leak.insertMany(leakDocs);

    return NextResponse.json({
      count: inserted.length,
      message: `Stored ${inserted.length} leak events`,
    });
  } catch (error) {
    console.error("Leaks POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET — Retrieve leak events with stats
export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "100");
    const type = searchParams.get("type");
    const severity = searchParams.get("severity");

    await connectDB();

    // Build query
    const query: Record<string, unknown> = { userId: session.userId };
    if (type) query.type = type;
    if (severity) query.severity = severity;

    // Fetch leaks
    const leaks = await Leak.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    // Compute aggregated stats
    const allLeaks = await Leak.find({ userId: session.userId }).lean();

    const stats = {
      total: allLeaks.length,
      blocked: allLeaks.filter((l) => l.blocked).length,
      byType: {} as Record<string, number>,
      bySeverity: {} as Record<string, number>,
      topDomains: [] as Array<{ domain: string; count: number }>,
      last24h: 0,
      last7d: 0,
    };

    const now = Date.now();
    const domainCounts: Record<string, number> = {};

    for (const leak of allLeaks) {
      // By type
      stats.byType[leak.type] = (stats.byType[leak.type] || 0) + 1;

      // By severity
      stats.bySeverity[leak.severity] = (stats.bySeverity[leak.severity] || 0) + 1;

      // Domain counts
      domainCounts[leak.domain] = (domainCounts[leak.domain] || 0) + 1;

      // Time-based
      const age = now - new Date(leak.createdAt).getTime();
      if (age < 24 * 60 * 60 * 1000) stats.last24h++;
      if (age < 7 * 24 * 60 * 60 * 1000) stats.last7d++;
    }

    stats.topDomains = Object.entries(domainCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([domain, count]) => ({ domain, count }));

    return NextResponse.json({ leaks, stats });
  } catch (error) {
    console.error("Leaks GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
