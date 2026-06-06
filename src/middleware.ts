import { auth } from "@/auth";
import { NextResponse } from "next/server";

const PROTECTED = [/^\/watchlist(\/|$)/, /^\/portfolio(\/|$)/];

export default auth((req) => {
  const isProtected = PROTECTED.some((re) => re.test(req.nextUrl.pathname));
  if (!isProtected) return NextResponse.next();
  if (!req.auth) {
    const url = new URL("/signin", req.nextUrl);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/|api/auth|favicon.ico).*)"],
};
