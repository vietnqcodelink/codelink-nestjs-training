"use client"

import Link from "next/link"
import { useCallback, useEffect, useState, type FormEvent } from "react"
import { ExternalLinkIcon, PlusIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { DeleteConfirmation } from "@/components/common/delete-confirmation"
import { ListPagination } from "@/components/common/list-pagination"
import { EmptyList, ErrorState, TableLoading } from "@/components/common/list-states"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
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
import type {
  Course,
  Enrollment,
  EnrollmentDetails,
  PaginatedResponse,
  PaginationMeta,
  Student,
} from "@/lib/types"

type EnrollmentSubject =
  | { type: "student"; value: Student }
  | { type: "course"; value: Course }

const initialMeta: PaginationMeta = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
}

export function EnrollmentManager({ subject }: { subject: EnrollmentSubject }) {
  const [enrollments, setEnrollments] = useState<EnrollmentDetails[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [enrolledTargetIds, setEnrolledTargetIds] = useState(
    () => new Set<string>(),
  )
  const [meta, setMeta] = useState(initialMeta)
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState("")
  const [loading, setLoading] = useState(true)
  const [catalogLoading, setCatalogLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [catalogError, setCatalogError] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [removing, setRemoving] = useState<EnrollmentDetails | null>(null)
  const [removePending, setRemovePending] = useState(false)

  const isStudent = subject.type === "student"
  const subjectId = subject.value.id

  const loadEnrollments = useCallback(async () => {
    setLoading(true)
    setError(null)
    const filter = isStudent ? "studentId" : "courseId"
    const params = new URLSearchParams({
      [filter]: subjectId,
      page: String(page),
      limit: "20",
    })

    try {
      const response = await apiFetch<PaginatedResponse<EnrollmentDetails>>(
        `/enrollments?${params}`,
      )
      setEnrollments(response.data)
      setMeta(response.meta)
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setLoading(false)
    }
  }, [isStudent, page, subjectId])

  const loadCatalog = useCallback(async () => {
    setCatalogLoading(true)
    setCatalogError(null)
    const filter = isStudent ? "studentId" : "courseId"
    const enrollmentUrl = `/enrollments?${filter}=${subjectId}&page=1&limit=100`

    try {
      if (isStudent) {
        const [catalogResponse, enrollmentResponse] = await Promise.all([
          apiFetch<PaginatedResponse<Course>>(
            "/courses?page=1&limit=100&sortBy=name&sortOrder=asc",
          ),
          apiFetch<PaginatedResponse<EnrollmentDetails>>(enrollmentUrl),
        ])
        setCourses(catalogResponse.data)
        setEnrolledTargetIds(
          new Set(enrollmentResponse.data.map((item) => item.courseId)),
        )
      } else {
        const [catalogResponse, enrollmentResponse] = await Promise.all([
          apiFetch<PaginatedResponse<Student>>(
            "/students?page=1&limit=100&sortBy=name&sortOrder=asc",
          ),
          apiFetch<PaginatedResponse<EnrollmentDetails>>(enrollmentUrl),
        ])
        setStudents(catalogResponse.data)
        setEnrolledTargetIds(
          new Set(enrollmentResponse.data.map((item) => item.studentId)),
        )
      }
    } catch (caughtError) {
      setCatalogError(getErrorMessage(caughtError))
    } finally {
      setCatalogLoading(false)
    }
  }, [isStudent, subjectId])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadEnrollments(), 0)
    return () => window.clearTimeout(timer)
  }, [loadEnrollments])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCatalog(), 0)
    return () => window.clearTimeout(timer)
  }, [loadCatalog])

  async function enroll(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)

    if (!selectedId) {
      setFormError(`Choose a ${isStudent ? "course" : "student"}`)
      return
    }

    setSubmitting(true)
    try {
      const enrollment = await apiFetch<Enrollment>("/enrollments", {
        method: "POST",
        body: JSON.stringify({
          studentId: isStudent ? subjectId : selectedId,
          courseId: isStudent ? selectedId : subjectId,
        }),
      })
      toast.success("Enrollment created")
      setEnrolledTargetIds((current) => {
        const next = new Set(current)
        next.add(isStudent ? enrollment.courseId : enrollment.studentId)
        return next
      })
      setSelectedId("")
      if (page === 1) await loadEnrollments()
      else setPage(1)
    } catch (caughtError) {
      setFormError(getErrorMessage(caughtError))
    } finally {
      setSubmitting(false)
    }
  }

  async function confirmRemoval() {
    if (!removing) return
    const removedTargetId = isStudent ? removing.courseId : removing.studentId
    setRemovePending(true)

    try {
      await apiFetch<void>(`/enrollments/${removing.id}`, {
        method: "DELETE",
      })
      toast.success("Enrollment removed")
      setEnrolledTargetIds((current) => {
        const next = new Set(current)
        next.delete(removedTargetId)
        return next
      })
      setRemoving(null)
      if (enrollments.length === 1 && page > 1) setPage(page - 1)
      else await loadEnrollments()
    } catch (caughtError) {
      toast.error(getErrorMessage(caughtError))
    } finally {
      setRemovePending(false)
    }
  }

  const availableCourses = courses.filter(
    (course) => !enrolledTargetIds.has(course.id),
  )
  const availableStudents = students.filter(
    (student) => !enrolledTargetIds.has(student.id),
  )
  const hasOptions = isStudent
    ? availableCourses.length > 0
    : availableStudents.length > 0

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{isStudent ? "Enrolled courses" : "Enrolled students"}</CardTitle>
          <CardDescription>
            {isStudent
              ? "Review courses and manage this student's enrollments."
              : "Review students and manage enrollment in this course."}
          </CardDescription>
          <CardAction>
            <Badge variant="secondary">{meta.total} enrolled</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="p-0">
          <form className="border-y bg-muted/20 p-4" onSubmit={enroll}>
            <FieldGroup className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
              <Field data-invalid={!!formError || !!catalogError}>
                <FieldLabel htmlFor="enrollment-target">
                  {isStudent ? "Add a course" : "Add a student"}
                </FieldLabel>
                <Select
                  value={selectedId}
                  onValueChange={(value) => {
                    setSelectedId(value ?? "")
                    setFormError(null)
                  }}
                  disabled={catalogLoading || !hasOptions}
                >
                  <SelectTrigger
                    id="enrollment-target"
                    className="w-full"
                    aria-invalid={!!formError || !!catalogError}
                  >
                    <SelectValue
                      placeholder={
                        catalogLoading
                          ? "Loading options..."
                          : hasOptions
                            ? `Choose a ${isStudent ? "course" : "student"}`
                            : `No ${isStudent ? "courses" : "students"} available`
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {isStudent
                        ? availableCourses.map((course) => (
                            <SelectItem key={course.id} value={course.id}>
                              {course.code} — {course.name}
                            </SelectItem>
                          ))
                        : availableStudents.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.name} — {student.email}
                            </SelectItem>
                          ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldError>{formError || catalogError}</FieldError>
              </Field>
              <Field className="justify-end">
                <FieldLabel className="sr-only">Enrollment action</FieldLabel>
                <Button
                  type="submit"
                  disabled={submitting || catalogLoading || !hasOptions}
                >
                  {submitting ? (
                    <Spinner data-icon="inline-start" />
                  ) : (
                    <PlusIcon data-icon="inline-start" />
                  )}
                  Enroll
                </Button>
              </Field>
            </FieldGroup>
          </form>

          {loading ? (
            <TableLoading columns={4} />
          ) : error ? (
            <ErrorState message={error} onRetry={loadEnrollments} />
          ) : enrollments.length === 0 ? (
            <EmptyList
              title="No enrollments yet"
              description={`Choose a ${isStudent ? "course" : "student"} above to create the first enrollment.`}
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isStudent ? "Course" : "Student"}</TableHead>
                    <TableHead>{isStudent ? "Code" : "Email"}</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead className="w-24">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map((enrollment) => {
                    const detailHref = isStudent
                      ? `/courses/${enrollment.courseId}`
                      : `/students/${enrollment.studentId}`

                    return (
                      <TableRow key={enrollment.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={detailHref}
                            className="underline-offset-4 hover:underline"
                          >
                            {isStudent
                              ? enrollment.course.name
                              : enrollment.student.name}
                          </Link>
                        </TableCell>
                        <TableCell>
                          {isStudent ? (
                            <Badge variant="secondary">
                              {enrollment.course.code}
                            </Badge>
                          ) : (
                            enrollment.student.email
                          )}
                        </TableCell>
                        <TableCell>{formatDate(enrollment.createdAt)}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              nativeButton={false}
                              render={<Link href={detailHref} />}
                              aria-label={`View ${isStudent ? "course" : "student"} details`}
                            >
                              <ExternalLinkIcon data-icon="inline-start" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Remove enrollment"
                              onClick={() => setRemoving(enrollment)}
                            >
                              <Trash2Icon data-icon="inline-start" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {!loading && !error && (
            <ListPagination meta={meta} onPageChange={setPage} />
          )}
        </CardContent>
      </Card>

      <DeleteConfirmation
        open={!!removing}
        onOpenChange={(open) => !open && setRemoving(null)}
        title="Remove enrollment?"
        description={`Remove ${isStudent ? removing?.course.name ?? "this course" : removing?.student.name ?? "this student"} from this enrollment?`}
        deleting={removePending}
        confirmLabel="Remove"
        onConfirm={confirmRemoval}
      />
    </>
  )
}
