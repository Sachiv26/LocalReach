import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ADMIN_PATHS = ["/admin", "/platform"];

/** Route-level auth gating. Fine-grained permissions are enforced server-side in actions/pages. */
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const { pathname } = request.nextUrl;

  const protectedArea =
    pathname.startsWith("/dashboard") ||
    ADMIN_PATHS.some((p) => pathname.startsWith(p));

  if (protectedArea && !token) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // /platform is super-admin only
  if (pathname.startsWith("/platform") && token) {
    const roles = token.roles ?? [];
    if (!roles.includes("SUPER_ADMIN")) {
      return NextResponse.rewrite(new URL("/403", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*", "/platform/:path*"],
};