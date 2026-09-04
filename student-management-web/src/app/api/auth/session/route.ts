import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/session"

export async function GET() {
  const user = await getSessionUser()

  if (!user) {
    return NextResponse.json(
      { statusCode: 401, message: "Unauthorized" },
      { status: 401 },
    )
  }

  return NextResponse.json(
    { user },
    { headers: { "Cache-Control": "no-store" } },
  )
}
