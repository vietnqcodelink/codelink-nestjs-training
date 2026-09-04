import type { Metadata } from "next"
import { StudentDetailsPage } from "@/components/students/student-details-page"

export const metadata: Metadata = { title: "Student details" }

export default async function StudentDetailsRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <StudentDetailsPage studentId={id} />
}
