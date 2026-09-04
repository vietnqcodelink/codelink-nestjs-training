import type { ApiErrorResponse } from "@/lib/types"

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers)

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const response = await fetch(`/api/backend${path}`, {
    ...init,
    headers,
    cache: "no-store",
  })

  if (response.status === 401 && typeof window !== "undefined") {
    window.location.replace("/login?expired=1")
  }

  if (!response.ok) {
    const error = await readError(response)
    throw new ApiError(error.message, response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

async function readError(response: Response): Promise<ApiErrorResponse> {
  try {
    const body = (await response.json()) as Partial<ApiErrorResponse>
    return {
      statusCode: response.status,
      message: body.message || "Something went wrong",
    }
  } catch {
    return {
      statusCode: response.status,
      message: "Something went wrong",
    }
  }
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong"
}
