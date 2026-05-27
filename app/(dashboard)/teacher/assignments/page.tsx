import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Plus, Calendar, Users } from "lucide-react"

export default async function TeacherAssignmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "teacher") redirect("/student")

  const { data: classrooms } = await supabase
    .from("classrooms").select("id, name, cover_color").eq("teacher_id", user.id)

  const classroomIds = classrooms?.map(c => c.id) || []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: assignments } = classroomIds.length > 0
    ? await db.from("assignments")
        .select("id, title, description, due_date, classroom_id, classrooms(name, cover_color)")
        .in("classroom_id", classroomIds)
        .order("created_at", { ascending: false })
    : { data: [] }

  const list: {
    id: string; title: string; description?: string; due_date?: string
    classroom_id: string; classrooms: { name: string; cover_color: string }
  }[] = assignments ?? []

  const { data: subs } = list.length > 0
    ? await db.from("assignment_submissions").select("assignment_id").in("assignment_id", list.map(a => a.id))
    : { data: [] }

  const countMap = new Map<string, number>()
  ;(subs as { assignment_id: string }[] ?? []).forEach(s =>
    countMap.set(s.assignment_id, (countMap.get(s.assignment_id) ?? 0) + 1)
  )

  return (
    <div className="flex-1 p-6 overflow-auto" style={{ background: "#FFF0F0" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Assignment</h1>
          <p className="text-sm font-semibold" style={{ color: "#E53935" }}>จัดการใบงานทั้งหมด</p>
        </div>
        <Link
          href="/teacher/assignments/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-bold text-sm hover:opacity-90 transition-opacity"
          style={{ background: "#E53935" }}
        >
          <Plus size={16} /> สร้างใบงาน
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center shadow-sm">
          <span className="text-6xl block mb-4">📋</span>
          <h3 className="text-lg font-black text-slate-800 mb-2">ยังไม่มีใบงาน</h3>
          <p className="text-slate-500 text-sm mb-6">สร้างใบงานแรกให้นักเรียนของคุณ</p>
          <Link href="/teacher/assignments/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold"
            style={{ background: "#E53935" }}>
            <Plus size={16} /> สร้างใบงาน
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {list.map(a => {
            const isOverdue = a.due_date && new Date(a.due_date) < new Date()
            return (
              <Link key={a.id} href={`/teacher/assignments/${a.id}`}
                className="bg-white rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: a.classrooms?.cover_color ? `${a.classrooms.cover_color}22` : "#FFF0F0" }}>
                  📋
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-black text-slate-900 truncate">{a.title}</h3>
                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                    <span>📚 {a.classrooms?.name}</span>
                    {a.due_date && (
                      <span className={`flex items-center gap-1 ${isOverdue ? "text-red-500 font-bold" : ""}`}>
                        <Calendar size={11} />
                        {new Date(a.due_date).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                        {isOverdue && " หมดเวลา"}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users size={11} /> {countMap.get(a.id) ?? 0} ส่งแล้ว
                    </span>
                  </div>
                </div>
                <span className="text-xs px-3 py-1.5 rounded-full font-bold flex-shrink-0"
                  style={{ background: "#FFF0F0", color: "#E53935" }}>
                  ดู →
                </span>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
