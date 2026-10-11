import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { User } from "@/lib/models/User";
import { getSession, generateApiToken } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession().catch(() => null);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    let token = user.apiToken;
    if (!token) {
      token = await generateApiToken(user._id.toString(), user.email);
      user.apiToken = token;
      await user.save();
    }

    return NextResponse.json({
      success: true,
      token,
      userId: user._id.toString(),
      email: user.email,
    });
  } catch (error) {
    console.error("User token GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const session = await getSession().catch(() => null);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const token = await generateApiToken(user._id.toString(), user.email);
    user.apiToken = token;
    await user.save();

    return NextResponse.json({
      success: true,
      token,
      message: "API token refreshed successfully",
    });
  } catch (error) {
    console.error("User token POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
