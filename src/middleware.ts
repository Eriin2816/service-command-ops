import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { UserRole } from "@/types/technician";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Redirect authenticated users away from /login to their home
    if (pathname === "/login" && token) {
      const home =
        token.role === UserRole.TECHNICIAN ? "/tech/today" : "/dashboard/overview";
      return NextResponse.redirect(new URL(home, req.url));
    }

    // Block technicians from accessing the admin dashboard
    if (pathname.startsWith("/dashboard") && token?.role === UserRole.TECHNICIAN) {
      return NextResponse.redirect(new URL("/tech/today", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized({ req, token }) {
        const { pathname } = req.nextUrl;
        // /login is always accessible (middleware fn handles already-authed redirect)
        if (pathname === "/login") return true;
        // all other matched routes require a valid session token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/tech/:path*", "/login"],
};
