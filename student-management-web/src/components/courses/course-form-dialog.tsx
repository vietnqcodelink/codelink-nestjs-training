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
import { Textarea } from "@/components/ui/textarea"
import { apiFetch, getErrorMessage } from "@/lib/api"
import type { Course } from "@/lib/types"

export function CourseFormDialog({
  open,
  onOpenChange,
  course,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  course?: Course
  onSaved: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!course

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    const formData = new FormData(event.currentTarget)
    const description = String(formData.get("description") ?? "").trim()

    try {
      await apiFetch<Course>(isEditing ? `/courses/${course.id}` : "/courses", {
        method: isEditing ? "PATCH" : "POST",
        body: JSON.stringify({
          name: formData.get("name"),
          code: formData.get("code"),
          description: description || null,
        }),
      })
      toast.success(isEditing ? "Course updated" : "Course created")
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
          <DialogTitle>{isEditing ? "Edit course" : "Add course"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the course catalog information."
              : "Create a course that students can enroll in."}
          </DialogDescription>
        </DialogHeader>
        <form id="course-form" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="course-name">Course name</FieldLabel>
              <Input
                id="course-name"
                name="name"
                defaultValue={course?.name}
                maxLength={200}
                required
                autoFocus
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="course-code">Course code</FieldLabel>
              <Input
                id="course-code"
                name="code"
                defaultValue={course?.code}
                maxLength={50}
                pattern="[A-Za-z0-9][A-Za-z0-9._-]*"
                placeholder="CS-101"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="course-description">Description</FieldLabel>
              <Textarea
                id="course-description"
                name="description"
                defaultValue={course?.description ?? ""}
                maxLength={5000}
                rows={4}
                placeholder="Optional course description"
              />
            </Field>
            <Field data-invalid={!!error}>
              <FieldError>{error}</FieldError>
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter showCloseButton>
          <Button type="submit" form="course-form" disabled={submitting}>
            {submitting && <Spinner data-icon="inline-start" />}
            {isEditing ? "Save changes" : "Create course"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
