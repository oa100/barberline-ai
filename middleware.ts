import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function middleware(_req: NextRequest) {
  // Clerk middleware is disabled until real API keys are configured.
  // To enable auth:
  // 1. Add real Clerk keys to Vercel environment variables
  // 2. Replace this file with:
  //
  //    import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
  //    const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);
  //    export default clerkMiddleware(async (auth, req) => {
  //      if (isProtectedRoute(req)) await auth.protect();
  //    });
  //
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
