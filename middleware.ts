import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

function hostOf(url: string | undefined) {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return null;
  }
}

/**
 * Origin check for state-changing API calls. The Origin must match this site's host (the Host header,
 * or NEXT_PUBLIC_SITE_URL when set). A malformed Origin such as "null" is rejected. When Origin is
 * missing, the browser's Sec-Fetch-Site header must not say the request came from another site.
 * Non-browser clients that send neither header are allowed; they don't carry the victim's cookies.
 */
function isSameOrigin(req: Request) {
  const origin = req.headers.get("origin");
  const allowed = new Set(
    [req.headers.get("host"), req.headers.get("x-forwarded-host"), hostOf(process.env.NEXT_PUBLIC_SITE_URL)].filter(
      (h): h is string => Boolean(h),
    ),
  );
  if (origin !== null) {
    const originHost = hostOf(origin);
    return originHost !== null && allowed.has(originHost);
  }
  const site = req.headers.get("sec-fetch-site");
  return site === null || site === "same-origin" || site === "none";
}

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // CSRF defence for our JSON APIs: state-changing requests must come from this origin.
  // (Auth.js protects its own /api/auth routes with a CSRF token.)
  if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth") && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    if (!isSameOrigin(req)) return NextResponse.json({ error: "Cross-site request blocked" }, { status: 403 });
  }

  // First line of defence for admin pages. Every admin API re-checks the role on the server.
  if (pathname.startsWith("/admin") && req.auth?.user?.role !== "ADMIN") {
    const url = new URL("/login", req.nextUrl.origin);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = { matcher: ["/admin/:path*", "/api/:path*"] };
