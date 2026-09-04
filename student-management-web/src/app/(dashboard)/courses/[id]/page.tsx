import type { Metadata } from "next"
import { CourseDetailsPage } from "@/components/courses/course-details-page"

export const metadata: Metadata = { title: "Course details" }

export default async function CourseDetailsRoute({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return <CourseDetailsPage courseId={id} />
}
