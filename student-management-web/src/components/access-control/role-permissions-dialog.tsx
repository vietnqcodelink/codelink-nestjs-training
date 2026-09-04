"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { apiFetch, getErrorMessage } from "@/lib/api"
import type { Permission, Role } from "@/lib/types"

export function RolePermissionsDialog({
  role,
  permissions,
  open,
  onOpenChange,
  onSaved,
}: {
  role: Role
  permissions: Permission[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}) {
  const [selected, setSelected] = useState(
    () => new Set(role.permissions.map((permission) => permission.id)),
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggle(permissionId: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current)
      if (checked) next.add(permissionId)
      else next.delete(permissionId)
      return next
    })
  }

  async function save() {
    setError(null)
    setSubmitting(true)
    try {
      await apiFetch<Role>(`/rbac/roles/${role.id}/permissions`, {
        method: "PUT",
        body: JSON.stringify({ permissionIds: Array.from(selected) }),
      })
      toast.success("Role permissions updated")
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Permissions for {role.name}</DialogTitle>
          <DialogDescription>
            Replace the complete permission set for this custom role.
          </DialogDescription>
        </DialogHeader>
        <FieldGroup className="max-h-96 overflow-y-auto pr-1">
          {permissions.map((permission) => {
            const id = `permission-${permission.id}`
            return (
              <Field key={permission.id} orientation="horizontal">
                <Checkbox
                  id={id}
                  checked={selected.has(permission.id)}
                  onCheckedChange={(checked) => toggle(permission.id, checked)}
                />
                <FieldLabel htmlFor={id}>
                  <FieldContent>
                    <FieldTitle>{permission.key}</FieldTitle>
                    <FieldDescription>
                      {permission.description || "No description"}
                    </FieldDescription>
                  </FieldContent>
                </FieldLabel>
              </Field>
            )
          })}
          <Field data-invalid={!!error}>
            <FieldError>{error}</FieldError>
          </Field>
        </FieldGroup>
        <DialogFooter showCloseButton>
          <Button onClick={save} disabled={submitting}>
            {submitting && <Spinner data-icon="inline-start" />}
            Save permissions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
