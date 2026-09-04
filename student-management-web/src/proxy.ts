import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { ACCESS_TOKEN_COOKIE, SESSION_USER_COOKIE } from "@/lib/session"

const AUTH_ROUTES = new Set(["/login", "/register"])

export function proxy(request: NextRequest) {
  const hasSession =
    request.cookies.has(ACCESS_TOKEN_COOKIE) &&
    request.cookies.has(SESSION_USER_COOKIE)
  const isAuthRoute = AUTH_ROUTES.has(request.nextUrl.pathname)

  if (!hasSession && !isAuthRoute) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("next", request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  if (hasSession && isAuthRoute) {
    return NextResponse.redirect(new URL("/students", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/students/:path*",
    "/courses/:path*",
    "/access-control/:path*",
    "/login",
    "/register",
  ],
}
