import { cookies } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import { getBackendUrl } from "@/lib/backend"
import {
  ACCESS_TOKEN_COOKIE,
  getSessionCookieOptions,
  SESSION_USER_COOKIE,
} from "@/lib/session"

interface RouteContext {
  params: Promise<{ path: string[] }>
}

const ALLOWED_RESOURCES = new Set([
  "students",
  "courses",
  "enrollments",
  "rbac",
])

async function forward(request: NextRequest, context: RouteContext) {
  const { path } = await context.params

  if (!path[0] || !ALLOWED_RESOURCES.has(path[0])) {
    return NextResponse.json(
      { statusCode: 404, message: "Resource not found" },
      { status: 404 },
    )
  }

  const cookieStore = await cookies()
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value

  if (!token) {
    return NextResponse.json(
      { statusCode: 401, message: "Unauthorized" },
      { status: 401 },
    )
  }

  const encodedPath = path.map(encodeURIComponent).join("/")
  const upstreamUrl = getBackendUrl(encodedPath)
  upstreamUrl.search = request.nextUrl.search

  const headers = new Headers({
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
    "X-Request-Id": crypto.randomUUID(),
  })
  const contentType = request.headers.get("content-type")
  if (contentType) headers.set("Content-Type", contentType)

  try {
    const upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.text(),
      cache: "no-store",
    })
    const response = new NextResponse(
      upstream.status === 204 ? null : await upstream.arrayBuffer(),
      {
        status: upstream.status,
        headers: {
          "Cache-Control": "no-store",
          "Content-Type":
            upstream.headers.get("content-type") ?? "application/json",
        },
      },
    )

    const requestId = upstream.headers.get("x-request-id")
    if (requestId) response.headers.set("X-Request-Id", requestId)

    if (upstream.status === 401) {
      const options = { ...getSessionCookieOptions(), maxAge: 0 }
      response.cookies.set(ACCESS_TOKEN_COOKIE, "", options)
      response.cookies.set(SESSION_USER_COOKIE, "", options)
    }

    return response
  } catch {
    return NextResponse.json(
      { statusCode: 502, message: "Backend service is unavailable" },
      { status: 502 },
    )
  }
}

export const GET = forward
export const POST = forward
export const PUT = forward
export const PATCH = forward
export const DELETE = forward
