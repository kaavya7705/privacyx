import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "privacyx_session";
const secretKey = () =>
  new TextEncoder().encode(process.env.AUTH_SECRET || "dev-secret-change-me");

const PROTECTED_ROUTES = [
  "/dashboard",
  "/live",
  "/attack",
  "/inferences",
  "/graph",
  "/defense",
  "/leaks",
  "/regression",
  "/experiments",
  "/history",
  "/settings",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Check if route is protected
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // API routes that need auth (exclude auth endpoints and extension APIs)
  const isProtectedAPI =
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth/") &&
    !pathname.startsWith("/api/events") && // Events API handles its own auth for extension tokens
    !pathname.startsWith("/api/leaks"); // Leaks API handles its own auth for extension tokens

  if (isProtected) {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    try {
      await jwtVerify(token, secretKey());
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  if (isProtectedAPI) {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    const authHeader = req.headers.get("authorization");
    const bearerToken = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    const tokenToVerify = token || bearerToken;
    if (!tokenToVerify) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    try {
      await jwtVerify(tokenToVerify, secretKey());
      return NextResponse.next();
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/live/:path*",
    "/attack/:path*",
    "/inferences/:path*",
    "/graph/:path*",
    "/defense/:path*",
    "/regression/:path*",
    "/experiments/:path*",
    "/history/:path*",
    "/settings/:path*",
    "/api/:path*",
  ],
};
