import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Leak } from "@/lib/models/Leak";
import { getSession, verifyApiToken } from "@/lib/auth";

// Sample data for simulation/testing
const SAMPLE_LEAKS = [
  {
    type: "tracker",
    domain: "google-analytics.com",
    severity: "medium",
    blocked: true,
    piiDetail: { label: "Client ID Tracker", count: 1 },
  },
  {
    type: "tracker",
    domain: "doubleclick.net",
    severity: "medium",
    blocked: true,
    piiDetail: { label: "Ad Profiler Cookie", count: 1 },
  },
  {
    type: "data_broker",
    domain: "spokeo.com",
    severity: "critical",
    blocked: true,
    piiDetail: { label: "Data Broker Identity Lookup", count: 1 },
  },
  {
    type: "pii_in_url",
    domain: "analytics.adpartner.com",
    severity: "high",
    blocked: false,
    piiDetail: { label: "Email Address in Query Param", type: "email", count: 1 },
  },
  {
    type: "pii_in_request",
    domain: "telemetry.trackingservice.io",
    severity: "high",
    blocked: false,
    piiDetail: { label: "Phone Number Pattern in Request URL", type: "phone", count: 1 },
  },
  {
    type: "pii_in_form",
    domain: "checkout-unencrypted.net",
    severity: "critical",
    blocked: false,
    piiDetail: { label: "Credit Card / CVV Field Entry", type: "creditCard", count: 1 },
  },
  {
    type: "tracker",
    domain: "criteo.com",
    severity: "medium",
    blocked: true,
    piiDetail: { label: "Cross-site Retargeting Beacon", count: 1 },
  },
  {
    type: "data_broker",
    domain: "whitepages.com",
    severity: "critical",
    blocked: true,
    piiDetail: { label: "Background Aggregator Beacon", count: 1 },
  },
];

// POST — Store leak events from extension or generate simulation leaks
export async function POST(req: Request) {
  try {
    // Support both session auth and bearer token (for extension)
    let userId: string | null = null;

    const session = await getSession().catch(() => null);
    if (session) {
      userId = session.userId;
    } else {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.slice(7);
        const tokenSession = await verifyApiToken(token).catch(() => null);
        if (tokenSession) userId = tokenSession.userId;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    await connectDB();

    // If simulate requested:
    if (body.simulate) {
      const now = Date.now();
      const simDocs = SAMPLE_LEAKS.map((leak, i) => {
        const createdAt = new Date(now - i * (12 * 60 * 1000 + Math.floor(Math.random() * 60000)));
        return {
          userId,
          type: leak.type,
          domain: leak.domain,
          severity: leak.severity,
          blocked: leak.blocked,
          piiDetail: leak.piiDetail,
          createdAt,
        };
      });

      const inserted = await Leak.insertMany(simDocs);
      return NextResponse.json({
        success: true,
        count: inserted.length,
        message: `Generated ${inserted.length} simulated threat detections and leaks`,
      });
    }

    const { leaks } = body;
    if (!Array.isArray(leaks) || leaks.length === 0) {
      return NextResponse.json({ error: "No leak data provided" }, { status: 400 });
    }

    const leakDocs = leaks.map((leak: Record<string, unknown>) => {
      const createdAt = leak.timestamp
        ? new Date(leak.timestamp as string)
        : leak.createdAt
        ? new Date(leak.createdAt as string)
        : new Date();

      return {
        userId,
        type: leak.type || "tracker",
        domain: leak.domain || "unknown",
        severity: leak.severity || "medium",
        blocked: leak.blocked || false,
        piiDetail: leak.piiDetail || null,
        createdAt,
      };
    });

    const inserted = await Leak.insertMany(leakDocs);

    return NextResponse.json({
      success: true,
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
    const session = await getSession().catch(() => null);
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
      const leakTime = new Date(leak.createdAt).getTime();
      const age = now - leakTime;
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

// DELETE — Clear leaks for testing
export async function DELETE() {
  try {
    const session = await getSession().catch(() => null);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const result = await Leak.deleteMany({ userId: session.userId });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: "Data leaks history cleared",
    });
  } catch (error) {
    console.error("Leaks DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
