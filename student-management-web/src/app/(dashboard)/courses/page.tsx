import type { Metadata } from "next"
import { CoursesPage } from "@/components/courses/courses-page"

export const metadata: Metadata = { title: "Courses" }

export default function CoursesRoute() {
  return <CoursesPage />
}
