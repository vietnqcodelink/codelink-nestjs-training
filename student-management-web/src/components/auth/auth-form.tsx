"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, type FormEvent } from "react"
import { GraduationCapIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import type { ApiErrorResponse } from "@/lib/types"

interface AuthFormProps {
  mode: "login" | "register"
  nextPath?: string
  sessionExpired?: boolean
}

export function AuthForm({ mode, nextPath, sessionExpired }: AuthFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const isLogin = mode === "login"

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const formData = new FormData(event.currentTarget)

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.get("email"),
          password: formData.get("password"),
        }),
      })

      if (!response.ok) {
        const body = (await response.json()) as Partial<ApiErrorResponse>
        throw new Error(body.message || "Unable to authenticate")
      }

      router.replace(nextPath || "/students")
      router.refresh()
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Unable to authenticate",
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex items-center justify-center gap-2 font-semibold">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCapIcon aria-hidden="true" />
        </span>
        Student Management
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isLogin ? "Welcome back" : "Create an account"}</CardTitle>
          <CardDescription>
            {isLogin
              ? "Enter your credentials to access the workspace."
              : "Register with your email and a secure password."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form id={`${mode}-form`} onSubmit={handleSubmit}>
            <FieldGroup>
              {sessionExpired && (
                <p className="text-sm text-muted-foreground">
                  Your session expired. Please sign in again.
                </p>
              )}
              <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={320}
                  placeholder="you@example.com"
                  required
                  autoFocus
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Password</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isLogin ? "current-password" : "new-password"}
                  minLength={isLogin ? undefined : 15}
                  maxLength={128}
                  required
                />
                {!isLogin && (
                  <p className="text-sm text-muted-foreground">
                    Use at least 15 characters.
                  </p>
                )}
              </Field>
              <Field data-invalid={!!error}>
                <FieldError>{error}</FieldError>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter className="flex-col items-stretch gap-4">
          <Button form={`${mode}-form`} type="submit" disabled={submitting}>
            {submitting && <Spinner data-icon="inline-start" />}
            {isLogin ? "Sign in" : "Create account"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            {isLogin ? "New to the app?" : "Already have an account?"}{" "}
            <Link
              href={isLogin ? "/register" : "/login"}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              {isLogin ? "Create account" : "Sign in"}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
