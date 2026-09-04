"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  BookOpenIcon,
  GraduationCapIcon,
  LogOutIcon,
  ShieldCheckIcon,
  UsersIcon,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { getInitials } from "@/lib/format"
import type { AuthenticatedUser } from "@/lib/types"

const navigation = [
  { href: "/students", label: "Students", icon: UsersIcon },
  { href: "/courses", label: "Courses", icon: BookOpenIcon },
  { href: "/access-control", label: "Access control", icon: ShieldCheckIcon },
]

export function AppSidebar({ user }: { user: AuthenticatedUser }) {
  const pathname = usePathname()
  const router = useRouter()

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.replace("/login")
    router.refresh()
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="Student Management"
              render={<Link href="/students" />}
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <GraduationCapIcon aria-hidden="true" />
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate font-semibold">Student Management</span>
                <span className="truncate text-xs text-muted-foreground">
                  Admin workspace
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigation.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    tooltip={item.label}
                    isActive={
                      pathname === item.href || pathname.startsWith(`${item.href}/`)
                    }
                    render={<Link href={item.href} />}
                  >
                    <item.icon aria-hidden="true" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" tooltip={user.email}>
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  {getInitials(user.email)}
                </AvatarFallback>
              </Avatar>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-medium">{user.email}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.roles.join(", ") || "No role"}
                </span>
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton tooltip="Sign out" onClick={logout}>
              <LogOutIcon aria-hidden="true" />
              <span>Sign out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
