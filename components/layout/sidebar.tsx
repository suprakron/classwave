"use client"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import type { Profile } from "@/lib/types"

interface SidebarProps {
  profile: Profile
}

const teacherLinks = [
  { href: "/teacher", label: "Dashboard", emoji: "🏠", exact: true },
  { href: "/teacher/classrooms", label: "Course", emoji: "📚" },
  { href: "/teacher/videos", label: "Videos", emoji: "🎬" },
]

const studentLinks = [
  { href: "/student", label: "Dashboard", emoji: "🏠", exact: true },
  { href: "/student/classrooms", label: "Course", emoji: "📚" },
]

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const isTeacher = profile.role === "teacher"
  const links = isTeacher ? teacherLinks : studentLinks
  const initial = profile.name?.charAt(0).toUpperCase() || "U"

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/login")
  }

  return (
    <aside
      className="w-52 min-h-screen flex flex-col py-6 px-3 flex-shrink-0"
      style={{ background: "linear-gradient(180deg, #FFCDD2 0%, #F8BBD0 100%)" }}
    >
      {/* Avatar + brand */}
      <div className="flex flex-col items-center mb-5 px-2">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center text-white font-black text-3xl shadow-lg mb-2 border-4 border-white"
          style={{ background: "#1565C0" }}
        >
          {initial}
        </div>
        <p className="text-sm font-black text-slate-800">MoleMeUp</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 flex flex-col gap-1.5 px-1">
        {links.map(link => {
          const active = link.exact ? pathname === link.href : pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-bold transition-all",
                active ? "bg-white text-slate-800 shadow-sm" : "text-slate-700 hover:bg-rose-200"
              )}
            >
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-base flex-shrink-0"
                style={{ background: active ? "#F43F5E" : "rgba(255,255,255,0.7)" }}
              >
                {link.emoji}
              </span>
              {link.label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-1 mt-2">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm font-bold text-slate-700 hover:bg-red-200 transition-colors w-full"
        >
          <span className="w-8 h-8 rounded-full bg-white/70 flex items-center justify-center text-base flex-shrink-0">
            🚪
          </span>
          Logout
        </button>
      </div>
    </aside>
  )
}
