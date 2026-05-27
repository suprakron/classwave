import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { BookOpen } from "lucide-react"

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (profile?.role !== "student") redirect("/teacher")

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("*, classrooms(id, name, cover_color, subject)")
    .eq("student_id", user.id)

  const classroomIds = enrollments?.map(e => e.classroom_id) || []
  const { data: progresses } = classroomIds.length > 0
    ? await supabase.from("video_progress").select("*").eq("student_id", user.id)
    : { data: [] }

  const completed = progresses?.filter(p => p.completed).length ?? 0
  const inProgress = progresses?.filter(p => !p.completed && p.last_position > 0).length ?? 0
  const firstName = profile?.name?.split(" ")[0] || profile?.name || "Student"

  const schedules = [
    { label: "Watch & Answer", emoji: "📺", href: "/student/classrooms" },
    { label: "Explore the Lab", emoji: "🧪", href: "/student/classrooms" },
    { label: "Solve Problems", emoji: "⚙️", href: "/student/classrooms" },
    { label: "Quiz Challenge", emoji: "🧩", href: "/student/classrooms" },
    { label: "Knowledge Boost", emoji: "📖", href: "/student/classrooms" },
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
              href="/student/classrooms"
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
          {/* decorative blobs */}
          <div className="absolute right-24 top-2 text-5xl opacity-20 select-none">⚗️</div>
        </div>

        {/* Progress Dashboard */}
        <div className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black mb-5" style={{ color: "#1565C0" }}>
            Progress Dashboard
          </h2>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[
              { label: "Enrolled", value: enrollments?.length ?? 0, color: "#1565C0", bg: "#E3F2FD", emoji: "📚" },
              { label: "Completed", value: completed, color: "#2E7D32", bg: "#E8F5E9", emoji: "✅" },
              { label: "In Progress", value: inProgress, color: "#E65100", bg: "#FFF3E0", emoji: "▶️" },
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

          {/* Classrooms list */}
          {enrollments && enrollments.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {enrollments.map(e => {
                const cls = e.classrooms as { id: string; name: string; cover_color: string; subject: string } | null
                if (!cls) return null
                return (
                  <Link
                    key={e.id}
                    href={`/student/classrooms/${cls.id}`}
                    className="flex items-center gap-3 p-4 rounded-2xl hover:opacity-90 transition-opacity"
                    style={{ background: cls.cover_color ? `${cls.cover_color}18` : "#F3E5F5" }}
                  >
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-lg flex-shrink-0"
                      style={{ background: cls.cover_color || "#7B1FA2" }}
                    >
                      {cls.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{cls.name}</p>
                      <p className="text-xs text-slate-400">{cls.subject || "Chemistry"}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-10">
              <span className="text-5xl mb-3 block">🧪</span>
              <p className="text-slate-500 text-sm mb-3">ยังไม่ได้เข้าร่วมห้องเรียน</p>
              <Link
                href="/student/classrooms"
                className="inline-block px-5 py-2 rounded-full text-white text-sm font-bold"
                style={{ background: "#E53935" }}
              >
                เข้าร่วมห้องเรียน
              </Link>
            </div>
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
