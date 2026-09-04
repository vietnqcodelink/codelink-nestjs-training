"use client"

import Link from "next/link"
import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeftIcon, PencilIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"
import { DeleteConfirmation } from "@/components/common/delete-confirmation"
import { ErrorState, TableLoading } from "@/components/common/list-states"
import { EnrollmentManager } from "@/components/enrollments/enrollment-manager"
import { PageHeader } from "@/components/layout/page-header"
import { StudentFormDialog } from "@/components/students/student-form-dialog"
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
import { formatDate, formatDateOnly } from "@/lib/format"
import type { Student } from "@/lib/types"

export function StudentDetailsPage({ studentId }: { studentId: string }) {
  const router = useRouter()
  const [student, setStudent] = useState<Student | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deletePending, setDeletePending] = useState(false)

  const loadStudent = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      setStudent(await apiFetch<Student>(`/students/${studentId}`))
    } catch (caughtError) {
      setError(getErrorMessage(caughtError))
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    const timer = window.setTimeout(() => void loadStudent(), 0)
    return () => window.clearTimeout(timer)
  }, [loadStudent])

  async function confirmDelete() {
    if (!student) return
    setDeletePending(true)

    try {
      await apiFetch<void>(`/students/${student.id}`, { method: "DELETE" })
      toast.success("Student deleted")
      router.replace("/students")
      router.refresh()
    } catch (caughtError) {
      toast.error(getErrorMessage(caughtError))
      setDeletePending(false)
    }
  }

  if (loading) return <TableLoading columns={2} />

  if (error || !student) {
    return (
      <>
        <PageHeader
          title="Student details"
          description="View the student profile and enrollments."
        />
        <ErrorState message={error ?? "Student not found"} onRetry={loadStudent} />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title={student.name}
        description="Student profile and course enrollments."
        action={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href="/students" />}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Students
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
            <CardTitle>Student information</CardTitle>
            <CardDescription>Profile and record metadata.</CardDescription>
            <CardAction>
              <Badge variant="outline">Student</Badge>
            </CardAction>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2 xl:grid-cols-1">
              <DetailItem label="Email" value={student.email} />
              <DetailItem
                label="Date of birth"
                value={formatDateOnly(student.dateOfBirth)}
              />
              <DetailItem label="Created" value={formatDate(student.createdAt)} />
              <DetailItem label="Updated" value={formatDate(student.updatedAt)} />
              <DetailItem label="Student ID" value={student.id} mono />
            </dl>
          </CardContent>
        </Card>

        <EnrollmentManager subject={{ type: "student", value: student }} />
      </div>

      <StudentFormDialog
        key={student.updatedAt}
        open={editing}
        onOpenChange={setEditing}
        student={student}
        onSaved={loadStudent}
      />
      <DeleteConfirmation
        open={deleting}
        onOpenChange={setDeleting}
        title="Delete student?"
        description={`This will permanently delete ${student.name} and all their enrollments.`}
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
