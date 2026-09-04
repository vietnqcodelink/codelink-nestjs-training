"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckIcon, SaveIcon } from "lucide-react";
import { toast } from "sonner";
import { ListPagination } from "@/components/common/list-pagination";
import {
  EmptyList,
  ErrorState,
  TableLoading,
} from "@/components/common/list-states";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { apiFetch, getErrorMessage } from "@/lib/api";
import { formatDate, getInitials } from "@/lib/format";
import type {
  PaginatedResponse,
  PaginationMeta,
  RbacUser,
  Role,
  UserRoles,
} from "@/lib/types";

const initialMeta: PaginationMeta = {
  page: 1,
  limit: 10,
  total: 0,
  totalPages: 0,
};

export function UserRoleAssignment({ roles }: { roles: Role[] }) {
  const [users, setUsers] = useState<RbacUser[]>([]);
  const [meta, setMeta] = useState(initialMeta);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<RbacUser | null>(null);
  const [selectedRoles, setSelectedRoles] = useState(() => new Set<string>());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const hasRoleChanges = selectedUser
    ? selectedRoles.size !== selectedUser.roles.length ||
      selectedUser.roles.some((role) => !selectedRoles.has(role.id))
    : false;

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({
      page: String(page),
      limit: "10",
    });
    if (search) params.set("search", search);

    try {
      const response = await apiFetch<PaginatedResponse<RbacUser>>(
        `/rbac/users?${params}`,
      );
      setUsers(response.data);
      setMeta(response.meta);
    } catch (caughtError) {
      setError(getErrorMessage(caughtError));
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void loadUsers(), 0);
    return () => window.clearTimeout(timer);
  }, [loadUsers]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timer);
  }, [searchInput]);

  function selectUser(user: RbacUser) {
    setSelectedUser(user);
    setSelectedRoles(new Set(user.roles.map((role) => role.id)));
    setSaveError(null);
  }

  function toggleRole(roleId: string, checked: boolean) {
    setSelectedRoles((current) => {
      const next = new Set(current);
      if (checked) next.add(roleId);
      else next.delete(roleId);
      return next;
    });
  }

  async function save() {
    if (!selectedUser) return;
    if (selectedRoles.size === 0) {
      setSaveError("A user must have at least one role");
      return;
    }

    setSaveError(null);
    setSaving(true);
    try {
      const response = await apiFetch<UserRoles>(
        `/rbac/users/${selectedUser.id}/roles`,
        {
          method: "PUT",
          body: JSON.stringify({ roleIds: Array.from(selectedRoles) }),
        },
      );
      const roleSummaries = response.roles.map(({ id, name }) => ({
        id,
        name,
      }));
      const updatedUser = { ...selectedUser, roles: roleSummaries };

      setSelectedUser(updatedUser);
      setUsers((current) =>
        current.map((user) =>
          user.id === updatedUser.id ? updatedUser : user,
        ),
      );
      toast.success("User roles updated");
    } catch (caughtError) {
      setSaveError(getErrorMessage(caughtError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User role assignments</CardTitle>
        <CardDescription>
          Search an account by email, select it, then update its roles.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="grid lg:grid-cols-[minmax(18rem,0.85fr)_minmax(22rem,1.15fr)]">
          <section className="flex min-w-0 flex-col border-b lg:border-r lg:border-b-0">
            <div className="border-y bg-muted/20 p-4 lg:border-t">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="user-search">Find user</FieldLabel>
                  <Input
                    id="user-search"
                    type="search"
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="Search by email..."
                    autoComplete="off"
                  />
                  <FieldDescription>
                    Results update automatically as you type.
                  </FieldDescription>
                </Field>
              </FieldGroup>
            </div>

            {loading ? (
              <TableLoading columns={1} />
            ) : error ? (
              <ErrorState message={error} onRetry={loadUsers} />
            ) : users.length === 0 ? (
              <EmptyList
                title="No users found"
                description="Try another email address."
              />
            ) : (
              <div
                role="listbox"
                aria-label="User search results"
                className="flex flex-col gap-1 p-2"
              >
                {users.map((user) => {
                  const isSelected = selectedUser?.id === user.id;

                  return (
                    <Button
                      key={user.id}
                      variant={isSelected ? "outline" : "ghost"}
                      className="h-auto justify-start px-3 py-3 text-left"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => selectUser(user)}
                    >
                      <Avatar className="size-9">
                        <AvatarFallback>
                          {getInitials(user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex min-w-0 flex-1 flex-col items-start gap-1">
                        <span className="w-full truncate">{user.email}</span>
                        <span className="flex flex-wrap gap-1">
                          {user.roles.length > 0 ? (
                            user.roles.map((role) => (
                              <Badge key={role.id} variant="secondary">
                                {role.name}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              No roles
                            </span>
                          )}
                        </span>
                      </span>
                      {isSelected && <CheckIcon aria-hidden="true" />}
                    </Button>
                  );
                })}
              </div>
            )}

            {!loading && !error && (
              <ListPagination meta={meta} onPageChange={setPage} />
            )}
          </section>

          <section className="min-w-0 p-4">
            {!selectedUser ? (
              <EmptyList
                title="Select a user"
                description="Choose an account from the search results to review and assign roles."
              />
            ) : (
              <div className="flex flex-col gap-6">
                <div className="flex items-start gap-3">
                  <Avatar className="size-10">
                    <AvatarFallback>
                      {getInitials(selectedUser.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <h3 className="truncate font-medium">
                      {selectedUser.email}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Joined {formatDate(selectedUser.createdAt)}
                    </p>
                    <p className="mt-1 break-all font-mono text-xs text-muted-foreground">
                      {selectedUser.id}
                    </p>
                  </div>
                </div>

                <FieldGroup>
                  {roles.map((role) => {
                    const id = `user-role-${selectedUser.id}-${role.id}`;
                    return (
                      <Field key={role.id} orientation="horizontal">
                        <Checkbox
                          id={id}
                          checked={selectedRoles.has(role.id)}
                          onCheckedChange={(checked) =>
                            toggleRole(role.id, checked === true)
                          }
                        />
                        <FieldLabel htmlFor={id}>
                          <FieldContent>
                            <FieldTitle>{role.name}</FieldTitle>
                            <FieldDescription>
                              {role.description || "No description"}
                            </FieldDescription>
                          </FieldContent>
                        </FieldLabel>
                      </Field>
                    );
                  })}
                  <Field data-invalid={!!saveError}>
                    <FieldError>{saveError}</FieldError>
                  </Field>
                  <Button onClick={save} disabled={saving || !hasRoleChanges}>
                    {saving ? (
                      <Spinner data-icon="inline-start" />
                    ) : (
                      <SaveIcon data-icon="inline-start" />
                    )}
                    Save roles
                  </Button>
                </FieldGroup>
              </div>
            )}
          </section>
        </div>
      </CardContent>
    </Card>
  );
}
