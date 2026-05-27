import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Search, BookOpen } from "lucide-react"

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

  return (
    <div className="flex-1 p-6 overflow-auto" style={{ background: "#FFF0F0" }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1">
          <h1
            className="text-3xl font-black leading-tight"
            style={{ color: "#E53935" }}
          >
            Unlock the power<br />of chemistry
          </h1>
        </div>
        {/* Illustration placeholder */}
        <div className="hidden lg:flex items-end gap-1 text-5xl mr-4">
          <span>👦</span>
          <span className="text-6xl">👧</span>
          <span>👦</span>
        </div>
      </div>

      {/* Search bar */}
      <div className="flex gap-3 mb-6 max-w-2xl">
        <div className="flex-1 flex items-center gap-2 bg-white rounded-full px-4 py-2.5 shadow-sm border border-rose-100">
          <Search size={16} className="text-slate-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            className="flex-1 text-sm outline-none bg-transparent text-slate-700 placeholder:text-slate-400"
          />
        </div>
        <button
          className="px-6 py-2.5 rounded-full text-white text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
          style={{ background: "#E53935" }}
        >
          Find Course
        </button>
      </div>

      <div className="flex gap-6">
        <div className="flex-1 min-w-0">
          {/* Mission section */}
          <div className="mb-6">
            <h2 className="text-sm font-bold text-slate-700 mb-3">Mission</h2>
            <div className="grid grid-cols-3 gap-3">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="h-16 rounded-2xl"
                  style={{ background: "#FFFDE7" }}
                />
              ))}
            </div>
          </div>

          {/* Popular course section */}
          <div>
            <h2 className="text-sm font-bold text-slate-700 mb-3">Popular course</h2>
            {enrollments && enrollments.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {enrollments.slice(0, 4).map(e => {
                  const classroom = e.classrooms as { id: string; name: string; cover_color: string; subject: string } | null
                  if (!classroom) return null
                  return (
                    <Link
                      key={e.id}
                      href={`/student/classrooms/${classroom.id}`}
                      className="p-4 rounded-2xl flex items-center gap-3 hover:opacity-90 transition-opacity shadow-sm"
                      style={{ background: classroom.cover_color ? `${classroom.cover_color}22` : "#FFF9C4" }}
                    >
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                        style={{ background: classroom.cover_color || "#E53935" }}
                      >
                        {classroom.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{classroom.name}</p>
                        <p className="text-xs text-slate-500 truncate">{classroom.subject || "Chemistry"}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div
                className="rounded-2xl p-6 text-center"
                style={{ background: "#FFFDE7" }}
              >
                <BookOpen size={32} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 mb-3">ยังไม่ได้เข้าร่วมห้องเรียน</p>
                <Link
                  href="/student/classrooms"
                  className="inline-block px-4 py-2 rounded-full text-white text-sm font-semibold"
                  style={{ background: "#E53935" }}
                >
                  เข้าร่วมห้องเรียน
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Calendar widget */}
        <div className="hidden xl:block flex-shrink-0">
          <CalendarWidget />
        </div>
      </div>
    </div>
  )
}

function CalendarWidget() {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth()
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"]
  const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = Array(firstDay).fill(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  return (
    <div className="bg-white rounded-3xl shadow-sm p-4 w-56" style={{ border: "2px solid #FCE4EC" }}>
      {/* Tab */}
      <div
        className="rounded-t-xl text-center py-1 mb-3 text-xs font-bold text-white -mx-4 -mt-4 px-4"
        style={{ background: "#E53935" }}
      >
        {monthNames[month]}
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {dayNames.map(d => (
          <div key={d} className="text-[10px] font-bold text-slate-400 py-0.5">{d}</div>
        ))}
        {cells.map((day, i) => {
          const isToday = day === today.getDate()
          const isSunday = (i % 7 === 0) && day !== null
          const isSaturday = (i % 7 === 6) && day !== null
          return (
            <div
              key={i}
              className={
                "text-[11px] py-1 rounded-lg font-medium " +
                (isToday
                  ? "bg-pink-500 text-white"
                  : isSunday || isSaturday
                    ? "text-rose-400"
                    : "text-slate-700")
              }
            >
              {day ?? ""}
            </div>
          )
        })}
      </div>
    </div>
  )
}
