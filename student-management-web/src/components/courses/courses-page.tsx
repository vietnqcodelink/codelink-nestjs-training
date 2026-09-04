"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import {
  EyeIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  RotateCcwIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"
import { CourseFormDialog } from "@/components/courses/course-form-dialog"
import { DeleteConfirmation } from "@/components/common/delete-confirmation"
import { EmptyList, ErrorState, TableLoading } from "@/components/common/list-states"
import { ListPagination } from "@/components/common/list-pagination"
import { PageHeader } from "@/components/layout/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { apiFetch, getErrorMessage } from "@/lib/api"
import { formatDate } from "@/lib/format"
import type { Course, PaginatedResponse, PaginationMeta } from "@/lib/types"

const initialMeta: PaginationMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
}

export function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [meta, setMeta] = useState(initialMeta)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Course | undefined>()
  const [deleting, setDeleting] = useState<Course | null>(null)
  const [deletePending, setDeletePending] = useState(false)

  const loadCourses = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      sortBy,
      sortOrder,
    })
    if (search) params.set("search", search)

    try {
      const response = await apiFetch<PaginatedResponse<Course>>(
        `/courses?${params}`,
      )
      setCourses(response.data)
      setMeta(response.meta)
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setLoading(false)
    }
  }, [page, search, sortBy, sortOrder])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCourses(), 0)
    return () => window.clearTimeout(timer)
  }, [loadCourses])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1)
      setSearch(searchInput.trim())
    }, 300)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  function resetFilters() {
    setPage(1)
    setSearchInput("")
    setSearch("")
    setSortBy("createdAt")
    setSortOrder("desc")
  }

  function openCreate() {
    setEditing(undefined)
    setFormOpen(true)
  }

  function openEdit(course: Course) {
    setEditing(course)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeletePending(true)
    try {
      await apiFetch<void>(`/courses/${deleting.id}`, { method: "DELETE" })
      toast.success("Course deleted")
      setDeleting(null)
      if (courses.length === 1 && page > 1) setPage(page - 1)
      else void loadCourses()
    } catch (caughtError) {
      toast.error(getErrorMessage(caughtError))
    } finally {
      setDeletePending(false)
    }
  }

  const hasCustomFilters =
    searchInput.trim().length > 0 ||
    sortBy !== "createdAt" ||
    sortOrder !== "desc"

  return (
    <>
      <PageHeader
        title="Courses"
        description="Maintain the course catalog and enrollment options."
        action={
          <Button onClick={openCreate}>
            <PlusIcon data-icon="inline-start" />
            Add course
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="border-b bg-muted/20 p-4">
            <FieldGroup className="grid gap-3 md:grid-cols-[minmax(16rem,1fr)_minmax(13rem,0.65fr)_auto]">
              <Field>
                <FieldLabel htmlFor="course-search">Search</FieldLabel>
                <Input
                  id="course-search"
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search name or code..."
                  autoComplete="off"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="course-sort">Sort</FieldLabel>
                <Select
                  value={`${sortBy}:${sortOrder}`}
                  onValueChange={(value) => {
                    if (!value) return
                    const [nextSortBy, nextSortOrder] = value.split(":")
                    setSortBy(nextSortBy)
                    setSortOrder(nextSortOrder)
                    setPage(1)
                  }}
                >
                  <SelectTrigger id="course-sort" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="createdAt:desc">Newest first</SelectItem>
                      <SelectItem value="createdAt:asc">Oldest first</SelectItem>
                      <SelectItem value="name:asc">Name A–Z</SelectItem>
                      <SelectItem value="name:desc">Name Z–A</SelectItem>
                      <SelectItem value="code:asc">Code A–Z</SelectItem>
                      <SelectItem value="code:desc">Code Z–A</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field className="justify-end">
                <FieldLabel className="sr-only">Filter actions</FieldLabel>
                <Button
                  type="button"
                  variant="outline"
                  disabled={!hasCustomFilters}
                  onClick={resetFilters}
                >
                  <RotateCcwIcon data-icon="inline-start" />
                  Reset filters
                </Button>
              </Field>
            </FieldGroup>
            <p className="mt-3 text-xs text-muted-foreground">
              Search updates automatically as you type.
            </p>
          </div>

          {loading ? (
            <TableLoading columns={5} />
          ) : error ? (
            <ErrorState message={error} onRetry={loadCourses} />
          ) : courses.length === 0 ? (
            <EmptyList
              title="No courses found"
              description={
                search
                  ? "Try adjusting your search."
                  : "Create your first course to get started."
              }
              action={!search && <Button onClick={openCreate}>Add course</Button>}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/courses/${course.id}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {course.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{course.code}</Badge>
                      </TableCell>
                      <TableCell className="max-w-sm truncate text-muted-foreground">
                        {course.description || "—"}
                      </TableCell>
                      <TableCell>{formatDate(course.createdAt)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Actions for ${course.name}`}
                              />
                            }
                          >
                            <MoreHorizontalIcon data-icon="inline-start" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                render={<Link href={`/courses/${course.id}`} />}
                              >
                                <EyeIcon />
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(course)}>
                                <PencilIcon />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeleting(course)}
                              >
                                <Trash2Icon />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && !error && (
            <ListPagination meta={meta} onPageChange={setPage} />
          )}
        </CardContent>
      </Card>

      <CourseFormDialog
        key={editing?.id ?? "new-course"}
        open={formOpen}
        onOpenChange={setFormOpen}
        course={editing}
        onSaved={loadCourses}
      />
      <DeleteConfirmation
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete course?"
        description={`This will permanently delete ${deleting?.name ?? "this course"} and its enrollments.`}
        deleting={deletePending}
        onConfirm={confirmDelete}
      />
    </>
  )
}
