import { NextResponse } from "next/server";
import { checkMLHealth } from "@/lib/ml-client";

export async function GET() {
  const status = await checkMLHealth();
  return NextResponse.json(status);
}
