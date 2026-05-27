import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Plus } from "lucide-react"

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (profile?.role !== "teacher") redirect("/student")

  const [{ data: classrooms }, { data: recentVideos }, { count: studentCount }] = await Promise.all([
    supabase.from("classrooms").select("*, enrollments(count)").eq("teacher_id", user.id).order("created_at", { ascending: false }).limit(4),
    supabase.from("videos").select("*, classrooms(name)").eq("teacher_id", user.id).order("created_at", { ascending: false }).limit(4),
    supabase.from("enrollments").select("*", { count: "exact", head: true }).in(
      "classroom_id",
      (await supabase.from("classrooms").select("id").eq("teacher_id", user.id)).data?.map(c => c.id) || []
    ),
  ])

  const firstName = profile?.name?.split(" ")[0] || profile?.name || "Teacher"

  const schedules = [
    { label: "Watch & Answer", emoji: "📺", href: "/teacher/videos" },
    { label: "Explore the Lab", emoji: "🧪", href: "/teacher/classrooms" },
    { label: "Solve Problems", emoji: "⚙️", href: "/teacher/classrooms" },
    { label: "Quiz Challenge", emoji: "🧩", href: "/teacher/videos" },
    { label: "Knowledge Boost", emoji: "📖", href: "/teacher/classrooms" },
  ]

  return (
    <div className="flex p-6 gap-5 min-h-full overflow-auto" style={{ background: "#FFF0F0" }}>
      {/* ── Main column ── */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-black text-slate-900">Hi, {firstName}</h1>
            <p className="font-bold" style={{ color: "#E53935" }}>
              Let&apos;s finish your tasks this week !
            </p>
          </div>
          <span className="text-4xl">🔔</span>
        </div>

        {/* Week Task banner */}
        <div
          className="rounded-3xl p-6 mb-5 flex items-center justify-between overflow-hidden relative"
          style={{ background: "#FFFDE7" }}
        >
          <div className="z-10">
            <h2 className="text-2xl font-black" style={{ color: "#E53935" }}>week Task</h2>
            <p className="text-slate-500 text-sm mt-1">Check your daily tasks and schedules</p>
            <Link
              href="/teacher/classrooms"
              className="mt-3 inline-block px-5 py-2 rounded-full text-white text-sm font-bold shadow-sm transition-opacity hover:opacity-90"
              style={{ background: "#F9A8A8" }}
            >
              Week&apos;s schedules
            </Link>
          </div>
          <div className="flex items-end gap-1 text-6xl z-10">
            <span>🧑‍🔬</span>
            <span className="text-7xl">👩‍🔬</span>
          </div>
          <div className="absolute right-24 top-2 text-5xl opacity-20 select-none">⚗️</div>
        </div>

        {/* Progress Dashboard */}
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black" style={{ color: "#1565C0" }}>
              Progress Dashboard
            </h2>
            <Link
              href="/teacher/classrooms/new"
              className="flex items-center gap-1.5 px-4 py-2 rounded-full text-white text-xs font-bold"
              style={{ background: "#E53935" }}
            >
              <Plus size={13} /> New Class
            </Link>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Classrooms", value: classrooms?.length ?? 0, color: "#1565C0", bg: "#E3F2FD", emoji: "🏫" },
              { label: "Students", value: studentCount ?? 0, color: "#2E7D32", bg: "#E8F5E9", emoji: "👨‍🎓" },
              { label: "Videos", value: recentVideos?.length ?? 0, color: "#E65100", bg: "#FFF3E0", emoji: "🎬" },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 flex items-center gap-3" style={{ background: s.bg }}>
                <span className="text-2xl">{s.emoji}</span>
                <div>
                  <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
                  <p className="text-xs text-slate-500 font-semibold">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Classrooms grid */}
          {classrooms && classrooms.length > 0 ? (
            <>
              <h3 className="text-sm font-bold text-slate-600 mb-3">My Classrooms</h3>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {classrooms.map(c => (
                  <Link
                    key={c.id}
                    href={`/teacher/classrooms/${c.id}`}
                    className="flex items-center gap-3 p-4 rounded-2xl hover:opacity-90 transition-opacity"
                    style={{ background: c.cover_color ? `${c.cover_color}18` : "#F3E5F5" }}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                      style={{ background: c.cover_color || "#7B1FA2" }}
                    >
                      {c.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{c.name}</p>
                      <p className="text-xs text-slate-400">
                        {(c.enrollments as { count: number }[])?.[0]?.count ?? 0} students
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8 mb-4">
              <span className="text-5xl mb-3 block">🏫</span>
              <p className="text-slate-500 text-sm mb-3">ยังไม่มีห้องเรียน</p>
              <Link
                href="/teacher/classrooms/new"
                className="inline-block px-5 py-2 rounded-full text-white text-sm font-bold"
                style={{ background: "#E53935" }}
              >
                สร้างห้องเรียน
              </Link>
            </div>
          )}

          {/* Recent Videos */}
          {recentVideos && recentVideos.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-slate-600">Recent Videos</h3>
                <Link href="/teacher/videos" className="text-xs font-bold" style={{ color: "#E53935" }}>See all</Link>
              </div>
              <div className="flex flex-col gap-2">
                {recentVideos.map(v => (
                  <Link
                    key={v.id}
                    href={`/teacher/videos/${v.id}`}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:opacity-90 transition-opacity"
                  >
                    <span className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-xl flex-shrink-0">🎬</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{v.title}</p>
                      <p className="text-xs text-slate-400">{(v.classrooms as { name: string })?.name}</p>
                    </div>
                    <span
                      className="text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0"
                      style={v.published
                        ? { background: "#E8F5E9", color: "#2E7D32" }
                        : { background: "#FFF9C4", color: "#F57F17" }}
                    >
                      {v.published ? "Published" : "Draft"}
                    </span>
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Right panel ── */}
      <div className="w-60 flex-shrink-0">
        <div className="rounded-3xl p-4 sticky top-0" style={{ background: "#EEEEEE" }}>
          <h3 className="font-black text-sm mb-4" style={{ color: "#1B5E20" }}>
            week&apos;s schedules
          </h3>
          <div className="flex flex-col gap-2.5">
            {schedules.map(s => (
              <Link
                key={s.label}
                href={s.href}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl font-bold text-white text-sm transition-opacity hover:opacity-90"
                style={{ background: "#66BB6A" }}
              >
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: "rgba(255,255,255,0.25)" }}
                >
                  {s.emoji}
                </span>
                {s.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
