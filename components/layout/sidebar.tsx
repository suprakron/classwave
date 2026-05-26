"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Play, LayoutDashboard, BookOpen, Video, BarChart3, LogOut, GraduationCap, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Profile } from "@/lib/types"

interface SidebarProps {
  profile: Profile
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const isTeacher = profile.role === "teacher"

  const teacherLinks = [
    { href: "/teacher", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/teacher/classrooms", label: "ห้องเรียน", icon: BookOpen },
    { href: "/teacher/videos", label: "วีดีโอทั้งหมด", icon: Video },
  ]
  const studentLinks = [
    { href: "/student", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/student/classrooms", label: "ห้องเรียนของฉัน", icon: BookOpen },
  ]
  const links = isTeacher ? teacherLinks : studentLinks

  const initial = profile.name?.charAt(0).toUpperCase() || "U"

  return (
    <aside className="w-64 min-h-screen bg-white border-r border-slate-100 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-slate-100">
        <Link href={isTeacher ? "/teacher" : "/student"} className="flex items-center gap-2">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
            <Play size={15} className="text-white ml-0.5" fill="white" />
          </div>
          <span className="font-bold text-violet-700 text-lg">MoleMeUp</span>
        </Link>
      </div>

      {/* Role badge */}
      <div className="px-4 pt-4 pb-2">
        <div className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium",
          isTeacher ? "bg-violet-50 text-violet-700" : "bg-blue-50 text-blue-700"
        )}>
          {isTeacher ? <BookOpen size={14} /> : <GraduationCap size={14} />}
          {isTeacher ? "โหมดครู" : "โหมดนักเรียน"}
        </div>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-4 py-2">
        {links.map(link => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 text-sm font-medium transition-all",
                active
                  ? "bg-violet-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              )}
            >
              <link.icon size={18} />
              {link.label}
              {active && <ChevronRight size={14} className="ml-auto" />}
            </Link>
          )
        })}
      </nav>

      {/* Profile + logout */}
      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-sm">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{profile.name}</p>
            <p className="text-xs text-slate-400 truncate">{profile.email}</p>
          </div>
        </div>
        <Link
          href="/logout"
          className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full"
        >
          <LogOut size={16} />
          ออกจากระบบ
        </Link>
      </div>
    </aside>
  )
}
