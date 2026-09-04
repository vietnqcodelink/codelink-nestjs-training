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
import type { Role } from "@/lib/types"

export function RoleFormDialog({
  open,
  onOpenChange,
  role,
  onSaved,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  role?: Role
  onSaved: () => void
}) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEditing = !!role

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    const formData = new FormData(event.currentTarget)
    const description = String(formData.get("description") ?? "").trim()

    try {
      await apiFetch<Role>(isEditing ? `/rbac/roles/${role.id}` : "/rbac/roles", {
        method: isEditing ? "PATCH" : "POST",
        body: JSON.stringify({
          name: formData.get("name"),
          description: description || null,
        }),
      })
      toast.success(isEditing ? "Role updated" : "Role created")
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
          <DialogTitle>{isEditing ? "Edit role" : "Create role"}</DialogTitle>
          <DialogDescription>
            Custom roles can be assigned a focused set of permissions.
          </DialogDescription>
        </DialogHeader>
        <form id="role-form" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="role-name">Role name</FieldLabel>
              <Input
                id="role-name"
                name="name"
                defaultValue={role?.name}
                maxLength={50}
                pattern="[A-Za-z][A-Za-z0-9_]*"
                placeholder="COURSE_EDITOR"
                required
                autoFocus
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="role-description">Description</FieldLabel>
              <Textarea
                id="role-description"
                name="description"
                defaultValue={role?.description ?? ""}
                maxLength={500}
                rows={3}
                placeholder="What can members of this role do?"
              />
            </Field>
            <Field data-invalid={!!error}>
              <FieldError>{error}</FieldError>
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter showCloseButton>
          <Button type="submit" form="role-form" disabled={submitting}>
            {submitting && <Spinner data-icon="inline-start" />}
            {isEditing ? "Save changes" : "Create role"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
