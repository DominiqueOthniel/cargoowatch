import { type NextRequest, NextResponse } from "next/server";
import { adminCookie, readSessionToken } from "@/lib/admin-auth";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isAdminArea = path.startsWith("/admin") && path !== "/admin/login";
  if (!isAdminArea) return NextResponse.next();

  const session = await readSessionToken(request.cookies.get(adminCookie.name)?.value);
  if (session) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/admin/login";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
