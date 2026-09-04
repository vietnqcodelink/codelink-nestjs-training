import type { Metadata } from "next"
import { StudentsPage } from "@/components/students/students-page"

export const metadata: Metadata = { title: "Students" }

export default function StudentsRoute() {
  return <StudentsPage />
}
