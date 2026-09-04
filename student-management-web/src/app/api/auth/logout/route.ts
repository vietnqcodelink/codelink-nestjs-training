import { NextResponse } from "next/server"
import {
  ACCESS_TOKEN_COOKIE,
  getSessionCookieOptions,
  SESSION_USER_COOKIE,
} from "@/lib/session"

export function POST() {
  const response = NextResponse.json({ success: true })
  const options = { ...getSessionCookieOptions(), maxAge: 0 }

  response.cookies.set(ACCESS_TOKEN_COOKIE, "", options)
  response.cookies.set(SESSION_USER_COOKIE, "", options)

  return response
}
