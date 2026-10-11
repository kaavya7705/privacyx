import { NextResponse } from "next/server";
import { classifyDomainWithAI, getSensitivity } from "@/lib/engine/categorizer";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get("domain");

    if (!domain) {
      return NextResponse.json({ error: "Domain parameter required" }, { status: 400 });
    }

    const result = await classifyDomainWithAI(domain);
    return NextResponse.json({
      success: true,
      domain,
      ...result,
    });
  } catch (error) {
    console.error("Classify GET error:", error);
    return NextResponse.json({ error: "Classification error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { domain, domains } = body;

    if (domains && Array.isArray(domains)) {
      const results = await Promise.all(
        domains.slice(0, 30).map(async (d: string) => {
          const res = await classifyDomainWithAI(d);
          return { domain: d, ...res };
        })
      );
      return NextResponse.json({ success: true, results });
    }

    if (!domain || typeof domain !== "string") {
      return NextResponse.json({ error: "Domain string required" }, { status: 400 });
    }

    const result = await classifyDomainWithAI(domain);
    return NextResponse.json({
      success: true,
      domain,
      ...result,
    });
  } catch (error) {
    console.error("Classify POST error:", error);
    return NextResponse.json({ error: "Classification error" }, { status: 500 });
  }
}
