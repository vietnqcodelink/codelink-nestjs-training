"use client"

import { usePathname } from "next/navigation"
import { useTheme } from "next-themes"
import { MoonIcon, SunIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"

const titles: Record<string, string> = {
  "/students": "Students",
  "/courses": "Courses",
  "/access-control": "Access control",
}

export function AppHeader() {
  const pathname = usePathname()
  const { resolvedTheme, setTheme } = useTheme()
  const title =
    titles[pathname] ??
    (pathname.startsWith("/students/")
      ? "Student details"
      : pathname.startsWith("/courses/")
        ? "Course details"
        : "Student Management")

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <h1 className="font-medium">{title}</h1>
      <Button
        variant="ghost"
        size="icon-sm"
        className="ml-auto"
        aria-label="Toggle color theme"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      >
        <SunIcon data-icon="inline-start" className="dark:hidden" />
        <MoonIcon data-icon="inline-start" className="hidden dark:block" />
      </Button>
    </header>
  )
}
