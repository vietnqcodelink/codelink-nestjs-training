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
import { DeleteConfirmation } from "@/components/common/delete-confirmation"
import {
  EmptyList,
  ErrorState,
  TableLoading,
} from "@/components/common/list-states"
import { ListPagination } from "@/components/common/list-pagination"
import { PageHeader } from "@/components/layout/page-header"
import { StudentFormDialog } from "@/components/students/student-form-dialog"
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
import { formatDate, formatDateOnly } from "@/lib/format"
import type {
  Course,
  PaginatedResponse,
  PaginationMeta,
  Student,
} from "@/lib/types"

const initialMeta: PaginationMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
}

export function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [meta, setMeta] = useState(initialMeta)
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")
  const [courseId, setCourseId] = useState("all")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Student | undefined>()
  const [deleting, setDeleting] = useState<Student | null>(null)
  const [deletePending, setDeletePending] = useState(false)

  const loadStudents = useCallback(async () => {
    setLoading(true)
    setError(null)
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      sortBy,
      sortOrder,
    })
    if (search) params.set("search", search)
    if (courseId !== "all") params.set("courseId", courseId)

    try {
      const response = await apiFetch<PaginatedResponse<Student>>(
        `/students?${params}`,
      )
      setStudents(response.data)
      setMeta(response.meta)
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setLoading(false)
    }
  }, [courseId, page, search, sortBy, sortOrder])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadStudents(), 0)
    return () => window.clearTimeout(timer)
  }, [loadStudents])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPage(1)
      setSearch(searchInput.trim())
    }, 300)

    return () => window.clearTimeout(timer)
  }, [searchInput])

  useEffect(() => {
    void apiFetch<PaginatedResponse<Course>>("/courses?page=1&limit=100")
      .then((response) => setCourses(response.data))
      .catch(() => setCourses([]))
  }, [])

  function resetFilters() {
    setPage(1)
    setSearchInput("")
    setSearch("")
    setCourseId("all")
    setSortBy("createdAt")
    setSortOrder("desc")
  }

  function openCreate() {
    setEditing(undefined)
    setFormOpen(true)
  }

  function openEdit(student: Student) {
    setEditing(student)
    setFormOpen(true)
  }

  async function confirmDelete() {
    if (!deleting) return
    setDeletePending(true)
    try {
      await apiFetch<void>(`/students/${deleting.id}`, { method: "DELETE" })
      toast.success("Student deleted")
      setDeleting(null)
      if (students.length === 1 && page > 1) setPage(page - 1)
      else void loadStudents()
    } catch (caughtError) {
      toast.error(getErrorMessage(caughtError))
    } finally {
      setDeletePending(false)
    }
  }

  const hasCustomFilters =
    searchInput.trim().length > 0 ||
    courseId !== "all" ||
    sortBy !== "createdAt" ||
    sortOrder !== "desc"

  return (
    <>
      <PageHeader
        title="Students"
        description="Create, find, and manage student records."
        action={
          <Button onClick={openCreate}>
            <PlusIcon data-icon="inline-start" />
            Add student
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          <div className="border-b bg-muted/20 p-4">
            <FieldGroup className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(16rem,1fr)_minmax(12rem,0.65fr)_minmax(13rem,0.65fr)_auto]">
              <Field>
                <FieldLabel htmlFor="student-search">Search</FieldLabel>
                <Input
                  id="student-search"
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Search name or email..."
                  autoComplete="off"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="student-course-filter">Course</FieldLabel>
                <Select
                  value={courseId}
                  onValueChange={(value) => {
                    setCourseId(value ?? "all")
                    setPage(1)
                  }}
                >
                  <SelectTrigger id="student-course-filter" className="w-full">
                    <SelectValue placeholder="All courses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="all">All courses</SelectItem>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.code}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <FieldLabel htmlFor="student-sort">Sort</FieldLabel>
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
                  <SelectTrigger id="student-sort" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="createdAt:desc">Newest first</SelectItem>
                      <SelectItem value="createdAt:asc">Oldest first</SelectItem>
                      <SelectItem value="name:asc">Name A–Z</SelectItem>
                      <SelectItem value="name:desc">Name Z–A</SelectItem>
                      <SelectItem value="email:asc">Email A–Z</SelectItem>
                      <SelectItem value="email:desc">Email Z–A</SelectItem>
                      <SelectItem value="dateOfBirth:desc">
                        Birth date: newest
                      </SelectItem>
                      <SelectItem value="dateOfBirth:asc">
                        Birth date: oldest
                      </SelectItem>
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
            <ErrorState message={error} onRetry={loadStudents} />
          ) : students.length === 0 ? (
            <EmptyList
              title="No students found"
              description={
                search || courseId !== "all"
                  ? "Try adjusting your search or filters."
                  : "Create your first student to get started."
              }
              action={!search && courseId === "all" && (
                <Button onClick={openCreate}>Add student</Button>
              )}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Date of birth</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/students/${student.id}`}
                          className="underline-offset-4 hover:underline"
                        >
                          {student.name}
                        </Link>
                      </TableCell>
                      <TableCell>{student.email}</TableCell>
                      <TableCell>{formatDateOnly(student.dateOfBirth)}</TableCell>
                      <TableCell>{formatDate(student.createdAt)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Actions for ${student.name}`}
                              />
                            }
                          >
                            <MoreHorizontalIcon data-icon="inline-start" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuGroup>
                              <DropdownMenuItem
                                render={<Link href={`/students/${student.id}`} />}
                              >
                                <EyeIcon />
                                View details
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEdit(student)}>
                                <PencilIcon />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => setDeleting(student)}
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

      <StudentFormDialog
        key={editing?.id ?? "new-student"}
        open={formOpen}
        onOpenChange={setFormOpen}
        student={editing}
        onSaved={loadStudents}
      />
      <DeleteConfirmation
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete student?"
        description={`This will permanently delete ${deleting?.name ?? "this student"} and their enrollments.`}
        deleting={deletePending}
        onConfirm={confirmDelete}
      />
    </>
  )
}
