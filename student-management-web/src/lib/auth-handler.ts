import "server-only"

import { NextResponse } from "next/server"
import { getBackendUrl } from "@/lib/backend"
import {
  ACCESS_TOKEN_COOKIE,
  encodeSessionUser,
  getSessionCookieOptions,
  SESSION_USER_COOKIE,
} from "@/lib/session"
import type { AuthResponse } from "@/lib/types"

export async function handleAuthRequest(
  request: Request,
  endpoint: "login" | "register",
): Promise<NextResponse> {
  try {
    const upstream = await fetch(getBackendUrl(`/auth/${endpoint}`), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: await request.text(),
      cache: "no-store",
    })
    const body: unknown = await upstream.json()
    const isSuccessfulAuth = upstream.ok && isAuthResponse(body)
    const response = NextResponse.json(
      isSuccessfulAuth ? { user: body.user } : body,
      {
        status: upstream.status,
        headers: { "Cache-Control": "no-store" },
      },
    )

    if (isSuccessfulAuth) {
      const options = getSessionCookieOptions()
      response.cookies.set(ACCESS_TOKEN_COOKIE, body.accessToken, options)
      response.cookies.set(
        SESSION_USER_COOKIE,
        encodeSessionUser(body.user),
        options,
      )
    }

    return response
  } catch {
    return NextResponse.json(
      { statusCode: 502, message: "Authentication service is unavailable" },
      { status: 502 },
    )
  }
}

function isAuthResponse(value: unknown): value is AuthResponse {
  if (!value || typeof value !== "object") return false

  const response = value as Partial<AuthResponse>
  return (
    typeof response.accessToken === "string" &&
    response.tokenType === "Bearer" &&
    !!response.user &&
    typeof response.user.id === "string" &&
    typeof response.user.email === "string" &&
    Array.isArray(response.user.roles)
  )
}
