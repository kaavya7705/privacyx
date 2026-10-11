import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Event } from "@/lib/models/Event";
import { getSession, verifyApiToken } from "@/lib/auth";

const SAMPLE_DOMAINS = [
  { domain: "github.com", category: "developer_tools", sensitivity: 0.2 },
  { domain: "stackoverflow.com", category: "technology", sensitivity: 0.2 },
  { domain: "linkedin.com", category: "career", sensitivity: 0.7 },
  { domain: "bloomberg.com", category: "finance", sensitivity: 0.8 },
  { domain: "webmd.com", category: "healthcare", sensitivity: 0.9 },
  { domain: "amazon.com", category: "shopping", sensitivity: 0.5 },
  { domain: "youtube.com", category: "entertainment", sensitivity: 0.3 },
  { domain: "reddit.com", category: "social", sensitivity: 0.6 },
  { domain: "coursera.org", category: "education", sensitivity: 0.3 },
  { domain: "nytimes.com", category: "news", sensitivity: 0.2 },
];

function getTimeBucket(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = Math.floor(date.getMinutes() / 15) * 15;
  const minutesStr = minutes.toString().padStart(2, "0");
  const endMinutes = (minutes + 15) % 60;
  const endHours = endMinutes === 0 ? (date.getHours() + 1) % 24 : date.getHours();
  return `${hours}:${minutesStr}-${endHours.toString().padStart(2, "0")}:${endMinutes.toString().padStart(2, "0")}`;
}

// POST — Receive batched events from extension or generate simulation telemetry
export async function POST(req: Request) {
  try {
    // Try session cookie first, then API token header
    let userId: string | null = null;

    const session = await getSession().catch(() => null);
    if (session) {
      userId = session.userId;
    } else {
      const authHeader = req.headers.get("authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const tokenPayload = await verifyApiToken(authHeader.slice(7)).catch(() => null);
        if (tokenPayload) userId = tokenPayload.userId;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    await connectDB();

    // Simulation generation for Live stream testing
    if (body.simulate) {
      const count = typeof body.count === "number" ? Math.min(body.count, 20) : 5;
      const now = Date.now();
      const simEvents = [];

      for (let i = 0; i < count; i++) {
        const sample = SAMPLE_DOMAINS[Math.floor(Math.random() * SAMPLE_DOMAINS.length)];
        const eventTime = new Date(now - i * (45 * 1000 + Math.floor(Math.random() * 30000)));
        simEvents.push({
          userId,
          source: "browser",
          type: "domain_visit",
          category: sample.category,
          domainCategory: sample.category,
          timeBucket: getTimeBucket(eventTime),
          durationBucket: "<1m",
          dayOfWeek: eventTime.getDay(),
          hourOfDay: eventTime.getHours(),
          sensitivity: sample.sensitivity,
          metadata: {
            domain: sample.domain,
            synthetic: false,
            liveSimulated: true,
          },
          createdAt: eventTime,
        });
      }

      const inserted = await Event.insertMany(simEvents);
      return NextResponse.json({
        success: true,
        count: inserted.length,
        message: `Injected ${inserted.length} live telemetry events`,
      });
    }

    const { events } = body;
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: "Events array is required" },
        { status: 400 }
      );
    }

    const { classifyDomainWithAI } = await import("@/lib/engine/categorizer");

    // Add userId to all events, parse timestamps, classify domains with AI if unknown
    const eventsWithUser = await Promise.all(
      events.map(async (event: Record<string, unknown>) => {
        const createdAt = event.createdAt
          ? new Date(event.createdAt as string)
          : event.timestamp
          ? new Date(event.timestamp as string)
          : new Date();

        const metaDomain =
          event.metadata && typeof (event.metadata as Record<string, unknown>).domain === "string"
            ? ((event.metadata as Record<string, unknown>).domain as string)
            : "";
        const domain: string = typeof event.domain === "string" && event.domain ? event.domain : metaDomain;
        let category = (event.category as string) || "unknown";
        let domainCategory = (event.domainCategory as string) || category;
        let sensitivity = typeof event.sensitivity === "number" ? event.sensitivity : 0.45;

        // Auto-classify domain with AI/ML if category is unknown or if domain is specified
        if (domain && (category === "unknown" || !event.category)) {
          try {
            const aiClass = await classifyDomainWithAI(domain);
            category = aiClass.category;
            domainCategory = aiClass.category;
            sensitivity = aiClass.sensitivity;
          } catch {
            // keep fallback
          }
        }

        // Guarantee category is never "unknown"
        if (category === "unknown" || !category) {
          if (domain) {
            const clean = domain.replace(/^www\./, "").split(".")[0];
            category = clean ? `${clean}_web` : "general_web";
          } else {
            category = "general_web";
          }
          domainCategory = category;
        }

        const metadata = {
          ...(typeof event.metadata === "object" && event.metadata ? event.metadata : {}),
          domain,
        };

        return {
          ...event,
          userId,
          domain,
          category,
          domainCategory,
          sensitivity,
          metadata,
          createdAt,
        };
      })
    );

    const inserted = await Event.insertMany(eventsWithUser);

    return NextResponse.json({
      success: true,
      count: inserted.length,
    });
  } catch (error) {
    console.error("Events POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// GET — List events with pagination
export async function GET(req: Request) {
  try {
    const session = await getSession().catch(() => null);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);
    const page = parseInt(searchParams.get("page") || "1");
    const source = searchParams.get("source");
    const category = searchParams.get("category");

    await connectDB();

    const filter: Record<string, unknown> = { userId: session.userId };
    if (source) filter.source = source;
    if (category) filter.category = category;

    const [events, total] = await Promise.all([
      Event.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Event.countDocuments(filter),
    ]);

    return NextResponse.json({
      events,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("Events GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE — Clear events
export async function DELETE() {
  try {
    const session = await getSession().catch(() => null);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const result = await Event.deleteMany({ userId: session.userId });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
      message: "Telemetry stream cleared",
    });
  } catch (error) {
    console.error("Events DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
