"use client"

import { ErrorState } from "@/components/common/list-states"

export default function AppError({ reset }: { reset: () => void }) {
  return (
    <ErrorState
      message="An unexpected error occurred while rendering this page."
      onRetry={reset}
    />
  )
}
