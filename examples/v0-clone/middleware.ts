import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { guestRegex, isDevelopmentEnvironment } from "./lib/constants";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    /\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|css|js)$/i.test(
      pathname
    )
  ) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/ping")) {
    return new Response("pong", { status: 200 });
  }

  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/billing/webhook")) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/ai-proxy")) {
    return NextResponse.next();
  }

  if (!process.env.AUTH_SECRET) {
    console.error("❌ Missing AUTH_SECRET environment variable");
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET,
    secureCookie: !isDevelopmentEnvironment
  });

  if (pathname.startsWith("/studio")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      const roleResponse = await fetch(
        `${request.nextUrl.origin}/api/user/role`,
        { headers: { Cookie: request.headers.get("cookie") || "" } }
      );

      if (roleResponse.ok) {
        const { role } = await roleResponse.json();
        if (role !== "admin") {
          return NextResponse.redirect(new URL("/", request.url));
        }
      } else {
        return NextResponse.redirect(new URL("/", request.url));
      }
    } catch (error) {
      console.error("Failed to check admin role:", error);
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (!token) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.next();
    }

    // Public pages
    if (
      pathname === "/" ||
      pathname.startsWith("/hub") ||
      pathname.startsWith("/blog")
    ) {
      return NextResponse.next();
    }

    // Protected pages
    if (
      [
        "/chats",
        "/projects",
        "/templates",
        "/billing",
        "/settings",
        "/workspace"
      ].some((path) => pathname.startsWith(path))
    ) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (["/login", "/register"].includes(pathname)) {
      return NextResponse.next();
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }

  const isGuest = guestRegex.test(token?.email ?? "");

  if (token && !isGuest && ["/login", "/register"].includes(pathname)) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot)).*)"
  ]
};
