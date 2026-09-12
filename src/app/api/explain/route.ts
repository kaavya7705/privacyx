import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { explainAttackResult } from "@/lib/engine/explainer";
import type { AttackResult } from "@/lib/engine/attacks/types";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { attack } = await req.json();
    if (!attack) {
      return NextResponse.json({ error: "Attack data required" }, { status: 400 });
    }

    const explanation = await explainAttackResult(attack as AttackResult);
    return NextResponse.json({ explanation });
  } catch (error) {
    console.error("Explain POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
