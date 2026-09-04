"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { DeleteConfirmation } from "@/components/common/delete-confirmation"
import { ErrorState, TableLoading } from "@/components/common/list-states"
import { CourseFormDialog } from "@/components/courses/course-form-dialog"
import { EnrollmentManager } from "@/components/enrollments/enrollment-manager"
import { PageHeader } from "@/components/layout/page-header"
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
import { apiFetch, getErrorMessage } from "@/lib/api"
import { formatDate } from "@/lib/format"
import type { Course } from "@/lib/types"

export function CourseDetailsPage({ courseId }: { courseId: string }) {
  const router = useRouter()
  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deletePending, setDeletePending] = useState(false)

  const loadCourse = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      setCourse(await apiFetch<Course>(`/courses/${courseId}`))
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadCourse(), 0)
    return () => window.clearTimeout(timer)
  }, [loadCourse])

  async function confirmDelete() {
    if (!course) return
    setDeletePending(true)

    try {
      await apiFetch<void>(`/courses/${course.id}`, { method: "DELETE" })
      toast.success("Course deleted")
      router.replace("/courses")
      router.refresh()
    } catch (caughtError) {
      toast.error(getErrorMessage(caughtError))
      setDeletePending(false)
    }
  }

  if (loading) return <TableLoading columns={2} />

  if (error || !course) {
    return (
      <>
        <PageHeader
          title="Course details"
          description="View course information and enrolled students."
        />
        <ErrorState message={error ?? "Course not found"} onRetry={loadCourse} />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={course.name}
        description="Course information and student enrollments."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/courses" />}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Courses
            </Button>
            <Button variant="outline" onClick={() => setEditing(true)}>
              <PencilIcon data-icon="inline-start" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setDeleting(true)}>
              <Trash2Icon data-icon="inline-start" />
              Delete
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(18rem,0.7fr)_minmax(0,1.3fr)]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Course information</CardTitle>
            <CardDescription>Catalog details and record metadata.</CardDescription>
            <CardAction>
              <Badge variant="secondary">{course.code}</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
              <DetailItem
                label="Description"
                value={course.description || "No description"}
              />
              <DetailItem label="Created" value={formatDate(course.createdAt)} />
              <DetailItem label="Updated" value={formatDate(course.updatedAt)} />
              <DetailItem label="Course ID" value={course.id} mono />
            </dl>
          </CardContent>
        </Card>

        <EnrollmentManager subject={{ type: "course", value: course }} />
      </div>

      <CourseFormDialog
        key={course.updatedAt}
        open={editing}
        onOpenChange={setEditing}
        course={course}
        onSaved={loadCourse}
      />
      <DeleteConfirmation
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete course?"
        description={`This will permanently delete ${course.name} and all its enrollments.`}
        deleting={deletePending}
        onConfirm={confirmDelete}
      />
    </>
  )
}

function DetailItem({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className={mono ? "break-all font-mono text-xs" : "break-words"}>
        {value}
      </dd>
    </div>
  )
}
