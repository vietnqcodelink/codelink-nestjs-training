import "server-only"

import { cookies } from "next/headers"
import type { AuthenticatedUser } from "@/lib/types"

export const ACCESS_TOKEN_COOKIE = "sms_access_token"
export const SESSION_USER_COOKIE = "sms_session_user"

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
}

export function getSessionCookieOptions() {
  return cookieOptions
}

export function encodeSessionUser(user: AuthenticatedUser): string {
  return Buffer.from(JSON.stringify(user)).toString("base64url")
}

export function decodeSessionUser(value?: string): AuthenticatedUser | null {
  if (!value) return null

  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(value, "base64url").toString("utf8"),
    )
    return isAuthenticatedUser(parsed) ? parsed : null
  } catch {
    return null
  }
}

export async function getSessionUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies()
  return decodeSessionUser(cookieStore.get(SESSION_USER_COOKIE)?.value)
}

function isAuthenticatedUser(value: unknown): value is AuthenticatedUser {
  if (!value || typeof value !== "object") return false

  const user = value as Partial<AuthenticatedUser>
  return (
    typeof user.id === "string" &&
    typeof user.email === "string" &&
    Array.isArray(user.roles) &&
    user.roles.every((role) => typeof role === "string") &&
    typeof user.createdAt === "string" &&
    typeof user.updatedAt === "string"
  )
}
