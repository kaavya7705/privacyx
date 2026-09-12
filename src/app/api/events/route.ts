import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Event } from "@/lib/models/Event";
import { getSession, verifyApiToken } from "@/lib/auth";

// POST — Receive batched events from extension
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
        const tokenPayload = await verifyApiToken(authHeader.slice(7));
        if (tokenPayload) userId = tokenPayload.userId;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { events } = await req.json();
    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json(
        { error: "Events array is required" },
        { status: 400 }
      );
    }

    await connectDB();

    // Add userId to all events and insert
    const eventsWithUser = events.map((event: Record<string, unknown>) => ({
      ...event,
      userId,
    }));

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
    const session = await getSession();
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
