"use client"

import { useState, type FormEvent } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { apiFetch, getErrorMessage } from "@/lib/api"
import { getTodayDateInputValue } from "@/lib/format"
import type { Student } from "@/lib/types"

export function StudentFormDialog({
  open,
  onOpenChange,
  student,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  student?: Student
  onSaved: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!student

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    const formData = new FormData(event.currentTarget)

    try {
      await apiFetch<Student>(isEditing ? `/students/${student.id}` : "/students", {
        method: isEditing ? "PATCH" : "POST",
        body: JSON.stringify({
          name: formData.get("name"),
          email: formData.get("email"),
          dateOfBirth: formData.get("dateOfBirth"),
        }),
      })
      toast.success(isEditing ? "Student updated" : "Student created")
      onOpenChange(false)
      onSaved()
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit student" : "Add student"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the student's profile information."
              : "Create a student record that can be enrolled in courses."}
          </DialogDescription>
        </DialogHeader>
        <form id="student-form" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="student-name">Full name</FieldLabel>
              <Input
                id="student-name"
                name="name"
                defaultValue={student?.name}
                maxLength={200}
                required
                autoFocus
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="student-email">Email</FieldLabel>
              <Input
                id="student-email"
                name="email"
                type="email"
                defaultValue={student?.email}
                maxLength={320}
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="student-date-of-birth">
                Date of birth
              </FieldLabel>
              <Input
                id="student-date-of-birth"
                name="dateOfBirth"
                type="date"
                defaultValue={student?.dateOfBirth.slice(0, 10)}
                max={getTodayDateInputValue()}
                required
              />
            </Field>
            <Field data-invalid={!!error}>
              <FieldError>{error}</FieldError>
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter showCloseButton>
          <Button type="submit" form="student-form" disabled={submitting}>
            {submitting && <Spinner data-icon="inline-start" />}
            {isEditing ? "Save changes" : "Create student"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
