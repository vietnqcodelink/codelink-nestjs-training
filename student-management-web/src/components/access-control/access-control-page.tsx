"use client";

import { useCallback, useEffect, useState } from "react";
import {
  KeyRoundIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { toast } from "sonner";
import { RoleFormDialog } from "@/components/access-control/role-form-dialog";
import { RolePermissionsDialog } from "@/components/access-control/role-permissions-dialog";
import { UserRoleAssignment } from "@/components/access-control/user-role-assignment";
import { DeleteConfirmation } from "@/components/common/delete-confirmation";
import {
  EmptyList,
  ErrorState,
  TableLoading,
} from "@/components/common/list-states";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiFetch, getErrorMessage } from "@/lib/api";
import type { Permission, Role } from "@/lib/types";

export function AccessControlPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Role | undefined>();
  const [permissionRole, setPermissionRole] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState<Role | null>(null);
  const [deletePending, setDeletePending] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [roleResponse, permissionResponse] = await Promise.all([
        apiFetch<Role[]>("/rbac/roles"),
        apiFetch<Permission[]>("/rbac/permissions"),
      ]);
      setRoles(roleResponse);
      setPermissions(permissionResponse);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function openCreate() {
    setEditing(undefined);
    setFormOpen(true);
  }

  function openEdit(role: Role) {
    setEditing(role);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeletePending(true);
    try {
      await apiFetch<void>(`/rbac/roles/${deleting.id}`, { method: "DELETE" });
      toast.success("Role deleted");
      setDeleting(null);
      void load();
    } catch (caughtError) {
      toast.error(getErrorMessage(caughtError));
    } finally {
      setDeletePending(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Access control"
        description="Find users, assign roles, and manage role permissions."
        action={
          <Button onClick={openCreate}>
            <PlusIcon data-icon="inline-start" />
            Create role
          </Button>
        }
      />

      {!loading && !error && <UserRoleAssignment roles={roles} />}

      <Card>
        <CardHeader>
          <CardTitle>Role catalog</CardTitle>
          <CardDescription>
            Create roles and review the permissions available to each role.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <TableLoading columns={5} />
          ) : error ? (
            <ErrorState message={error} onRetry={load} />
          ) : roles.length === 0 ? (
            <EmptyList
              title="No roles found"
              description="Create a role to configure access."
              action={<Button onClick={openCreate}>Create role</Button>}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Role</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Permissions</TableHead>
                    <TableHead className="w-12">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{role.name}</span>
                          {role.isSystem && (
                            <Badge variant="secondary">System</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-sm text-muted-foreground">
                        {role.description || "—"}
                      </TableCell>
                      <TableCell>{role.userCount}</TableCell>
                      <TableCell>
                        <div className="flex max-w-sm flex-wrap gap-1">
                          {role.permissions.length ? (
                            role.permissions.map((permission) => (
                              <Badge key={permission.id} variant="outline">
                                {permission.key}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {!role.isSystem && (
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  aria-label={`Actions for ${role.name}`}
                                />
                              }
                            >
                              <MoreHorizontalIcon data-icon="inline-start" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuGroup>
                                <DropdownMenuItem
                                  onClick={() => setPermissionRole(role)}
                                >
                                  <KeyRoundIcon />
                                  Permissions
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openEdit(role)}
                                >
                                  <PencilIcon />
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={() => setDeleting(role)}
                                >
                                  <Trash2Icon />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuGroup>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <RoleFormDialog
        key={editing?.id ?? "new-role"}
        open={formOpen}
        onOpenChange={setFormOpen}
        role={editing}
        onSaved={load}
      />
      {permissionRole && (
        <RolePermissionsDialog
          key={permissionRole.id}
          role={permissionRole}
          permissions={permissions}
          open
          onOpenChange={(open) => !open && setPermissionRole(null)}
          onSaved={load}
        />
      )}
      <DeleteConfirmation
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete role?"
        description={`This will permanently delete ${deleting?.name ?? "this role"}. It must not be assigned to any users.`}
        deleting={deletePending}
        onConfirm={confirmDelete}
      />
    </>
  );
}
