"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, BookOpen, Video, LogOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types"

interface SidebarProps {
  profile: Profile
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isTeacher = profile.role === "teacher"

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  const teacherLinks = [
    { href: "/teacher", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/teacher/classrooms", label: "Course", icon: BookOpen },
    { href: "/teacher/videos", label: "Video", icon: Video },
  ]
  const studentLinks = [
    { href: "/student", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/student/classrooms", label: "Course", icon: BookOpen },
  ]
  const links = isTeacher ? teacherLinks : studentLinks

  const initial = profile.name?.charAt(0).toUpperCase() || "U"

  return (
    <aside
      className="w-52 min-h-screen flex flex-col py-6 px-3"
      style={{ background: "#FFCDD2" }}
    >
      {/* Avatar + greeting */}
      <div className="flex flex-col items-center mb-6 px-2">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-white font-black text-2xl shadow-md mb-2"
          style={{ background: "#1565C0" }}
        >
          {initial}
        </div>
        <p className="text-sm font-bold text-slate-800">Hi, {profile.name?.split(" ")[0]}</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 flex flex-col gap-1 px-1">
        {links.map(link => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href)
          const Icon = link.icon
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold transition-all",
                active
                  ? "bg-green-500 text-white shadow-sm"
                  : "text-slate-700 hover:bg-rose-200"
              )}
            >
              <div
                className={cn(
                  "w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0",
                  active ? "bg-white/20" : "bg-white/60"
                )}
              >
                <Icon size={15} className={active ? "text-white" : "text-slate-600"} />
              </div>
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-1 mt-4">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-semibold text-slate-700 hover:bg-red-200 transition-colors w-full"
        >
          <div className="w-7 h-7 rounded-lg bg-white/60 flex items-center justify-center flex-shrink-0">
            <LogOut size={15} className="text-slate-600" />
          </div>
          Logout
        </button>
      </div>
    </aside>
  )
}
