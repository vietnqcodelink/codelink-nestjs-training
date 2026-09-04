import type { Metadata } from "next"
import { AuthForm } from "@/components/auth/auth-form"

export const metadata: Metadata = { title: "Sign in" }

interface LoginPageProps {
  searchParams: Promise<{ next?: string; expired?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const query = await searchParams
  const nextPath =
    query.next?.startsWith("/") && !query.next.startsWith("//")
      ? query.next
      : undefined

  return (
    <AuthForm
      mode="login"
      nextPath={nextPath}
      sessionExpired={query.expired === "1"}
    />
  )
}
