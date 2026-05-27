import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Search, BookOpen, Video, Plus } from "lucide-react"

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (profile?.role !== "teacher") redirect("/student")

  const [{ data: classrooms }, { data: recentVideos }] = await Promise.all([
    supabase.from("classrooms").select("*, enrollments(count)").eq("teacher_id", user.id).order("created_at", { ascending: false }).limit(4),
    supabase.from("videos").select("*, classrooms(name)").eq("teacher_id", user.id).order("created_at", { ascending: false }).limit(5),
  ])

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
        <Link
          href="/teacher/classrooms/new"
          className="flex items-center gap-2 px-6 py-2.5 rounded-full text-white text-sm font-semibold shadow-sm transition-opacity hover:opacity-90"
          style={{ background: "#E53935" }}
        >
          <Plus size={14} /> New Class
        </Link>
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

          {/* Classrooms */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-700">My Classrooms</h2>
              <Link href="/teacher/classrooms" className="text-xs text-rose-500 hover:underline">See all</Link>
            </div>
            {classrooms && classrooms.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {classrooms.map(c => (
                  <Link
                    key={c.id}
                    href={`/teacher/classrooms/${c.id}`}
                    className="p-4 rounded-2xl flex items-center gap-3 hover:opacity-90 transition-opacity shadow-sm"
                    style={{ background: c.cover_color ? `${c.cover_color}22` : "#FFF9C4" }}
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ background: c.cover_color || "#E53935" }}
                    >
                      {c.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{c.name}</p>
                      <p className="text-xs text-slate-500">
                        {(c.enrollments as { count: number }[])?.[0]?.count ?? 0} students
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div
                className="rounded-2xl p-6 text-center"
                style={{ background: "#FFFDE7" }}
              >
                <BookOpen size={32} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500 mb-3">ยังไม่มีห้องเรียน</p>
                <Link
                  href="/teacher/classrooms/new"
                  className="inline-block px-4 py-2 rounded-full text-white text-sm font-semibold"
                  style={{ background: "#E53935" }}
                >
                  สร้างห้องเรียน
                </Link>
              </div>
            )}
          </div>

          {/* Recent videos */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-700">Recent Videos</h2>
              <Link href="/teacher/videos" className="text-xs text-rose-500 hover:underline">See all</Link>
            </div>
            {recentVideos && recentVideos.length > 0 ? (
              <div className="flex flex-col gap-2">
                {recentVideos.map(v => (
                  <Link
                    key={v.id}
                    href={`/teacher/videos/${v.id}`}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white shadow-sm hover:opacity-90 transition-opacity"
                  >
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "#FCE4EC" }}
                    >
                      <Video size={16} className="text-rose-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{v.title}</p>
                      <p className="text-xs text-slate-500">{(v.classrooms as { name: string })?.name}</p>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0"
                      style={v.published
                        ? { background: "#E8F5E9", color: "#2E7D32" }
                        : { background: "#FFF9C4", color: "#F57F17" }}
                    >
                      {v.published ? "Published" : "Draft"}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div
                className="rounded-2xl p-6 text-center"
                style={{ background: "#FFFDE7" }}
              >
                <Video size={32} className="text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">ยังไม่มีวีดีโอ</p>
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
