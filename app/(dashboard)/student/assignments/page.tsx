import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Calendar, Upload } from "lucide-react"

export default async function StudentAssignmentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "student") redirect("/teacher")

  const { data: enrollments } = await supabase
    .from("enrollments").select("classroom_id").eq("student_id", user.id)
  const classroomIds = enrollments?.map(e => e.classroom_id) || []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: assignments } = classroomIds.length > 0
    ? await db.from("assignments")
        .select("id, title, description, due_date, file_url, file_name, classrooms(name, cover_color)")
        .in("classroom_id", classroomIds)
        .order("created_at", { ascending: false })
    : { data: [] }

  const list: {
    id: string; title: string; description?: string; due_date?: string
    file_url?: string; classrooms: { name: string; cover_color: string }
  }[] = assignments ?? []

  const { data: mySubmissions } = list.length > 0
    ? await db.from("assignment_submissions")
        .select("assignment_id, score, submitted_at")
        .eq("student_id", user.id)
        .in("assignment_id", list.map(a => a.id))
    : { data: [] }

  const subMap = new Map<string, { score?: number; submitted_at: string }>()
  ;(mySubmissions as { assignment_id: string; score?: number; submitted_at: string }[] ?? [])
    .forEach(s => subMap.set(s.assignment_id, s))

  const now = new Date()
  const pending = list.filter(a => !subMap.has(a.id))
  const submitted = list.filter(a => subMap.has(a.id))

  return (
    <div className="flex-1 p-6 overflow-auto" style={{ background: "#FFF0F0" }}>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">Assignment</h1>
        <p className="text-sm font-semibold" style={{ color: "#E53935" }}>ใบงานของฉัน</p>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center shadow-sm">
          <span className="text-6xl block mb-4">📋</span>
          <h3 className="text-lg font-black text-slate-800 mb-2">ยังไม่มีใบงาน</h3>
          <p className="text-slate-500 text-sm">เมื่อครูมอบหมายงาน จะปรากฏที่นี่</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending */}
          {pending.length > 0 && (
            <div>
              <h2 className="text-sm font-black text-slate-600 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-400" /> รอส่ง ({pending.length})
              </h2>
              <div className="grid gap-3">
                {pending.map(a => {
                  const isOverdue = a.due_date && new Date(a.due_date) < now
                  return (
                    <Link key={a.id} href={`/student/assignments/${a.id}`}
                      className="bg-white rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all border-l-4"
                      style={{ borderLeftColor: isOverdue ? "#EF4444" : "#F59E0B" }}>
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: a.classrooms?.cover_color ? `${a.classrooms.cover_color}22` : "#FFF0F0" }}>
                        📋
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-slate-900 truncate">{a.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span>📚 {a.classrooms?.name}</span>
                          {a.due_date && (
                            <span className={`flex items-center gap-1 font-semibold ${isOverdue ? "text-red-500" : "text-orange-500"}`}>
                              <Calendar size={10} />
                              {new Date(a.due_date).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                              {isOverdue && " หมดเวลา"}
                            </span>
                          )}
                          {a.file_url && <span className="text-blue-500">📎 มีไฟล์แนบ</span>}
                        </div>
                      </div>
                      <span className="text-xs px-3 py-1.5 rounded-full font-bold flex-shrink-0"
                        style={{ background: "#FFF0F0", color: "#E53935" }}>
                        <Upload size={12} className="inline mr-1" />ส่งงาน
                      </span>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}

          {/* Submitted */}
          {submitted.length > 0 && (
            <div>
              <h2 className="text-sm font-black text-slate-600 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" /> ส่งแล้ว ({submitted.length})
              </h2>
              <div className="grid gap-3">
                {submitted.map(a => {
                  const sub = subMap.get(a.id)!
                  return (
                    <Link key={a.id} href={`/student/assignments/${a.id}`}
                      className="bg-white rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all border-l-4 border-green-400">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: "#E8F5E9" }}>
                        ✅
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-slate-900 truncate">{a.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span>📚 {a.classrooms?.name}</span>
                          <span>ส่งเมื่อ {new Date(sub.submitted_at).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</span>
                        </div>
                      </div>
                      {sub.score != null ? (
                        <div className="text-right flex-shrink-0">
                          <span className="text-xl font-black" style={{ color: "#2E7D32" }}>{sub.score}</span>
                          <span className="text-xs text-slate-400 block">คะแนน</span>
                        </div>
                      ) : (
                        <span className="text-xs px-3 py-1.5 rounded-full font-bold flex-shrink-0"
                          style={{ background: "#E8F5E9", color: "#2E7D32" }}>ส่งแล้ว</span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
