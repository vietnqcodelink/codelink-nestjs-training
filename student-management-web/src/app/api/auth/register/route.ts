import { handleAuthRequest } from "@/lib/auth-handler"

export async function POST(request: Request) {
  return handleAuthRequest(request, "register")
}
