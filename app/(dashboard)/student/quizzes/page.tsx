import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Calendar, CheckCircle } from "lucide-react"

export default async function StudentQuizzesPage() {
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

  const { data: quizzes } = classroomIds.length > 0
    ? await db.from("quizzes")
        .select("id, title, description, due_date, time_limit, classrooms(name, cover_color)")
        .in("classroom_id", classroomIds)
        .eq("published", true)
        .order("created_at", { ascending: false })
    : { data: [] }

  const list: {
    id: string; title: string; description?: string; due_date?: string
    time_limit?: number; classrooms: { name: string; cover_color: string }
  }[] = quizzes ?? []

  const { data: mySubmissions } = list.length > 0
    ? await db.from("quiz_submissions")
        .select("quiz_id, score, max_score, submitted_at")
        .eq("student_id", user.id)
        .in("quiz_id", list.map(q => q.id))
    : { data: [] }

  const subMap = new Map<string, { score: number; max_score: number; submitted_at: string }>()
  ;(mySubmissions as { quiz_id: string; score: number; max_score: number; submitted_at: string }[] ?? [])
    .forEach(s => subMap.set(s.quiz_id, s))

  const pending = list.filter(q => !subMap.has(q.id))
  const done = list.filter(q => subMap.has(q.id))

  return (
    <div className="flex-1 p-6 overflow-auto" style={{ background: "#FFF0F0" }}>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">Test / Quiz</h1>
        <p className="text-sm font-semibold" style={{ color: "#E53935" }}>แบบทดสอบของฉัน</p>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center shadow-sm">
          <span className="text-6xl block mb-4">🧩</span>
          <h3 className="text-lg font-black text-slate-800 mb-2">ยังไม่มีแบบทดสอบ</h3>
          <p className="text-slate-500 text-sm">เมื่อครูเผยแพร่แบบทดสอบ จะปรากฏที่นี่</p>
        </div>
      ) : (
        <div className="space-y-6">
          {pending.length > 0 && (
            <div>
              <h2 className="text-sm font-black text-slate-600 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full" style={{ background: "#E53935" }} />
                รอทำ ({pending.length})
              </h2>
              <div className="grid gap-3">
                {pending.map(q => (
                  <Link key={q.id} href={`/student/quizzes/${q.id}`}
                    className="bg-white rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all border-l-4"
                    style={{ borderLeftColor: "#E53935" }}>
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                      style={{ background: q.classrooms?.cover_color ? `${q.classrooms.cover_color}22` : "#F1F8E9" }}>
                      🧩
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-slate-900 truncate">{q.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                        <span>📚 {q.classrooms?.name}</span>
                        {q.time_limit && <span>⏱ {q.time_limit} นาที</span>}
                        {q.due_date && (
                          <span className="flex items-center gap-1">
                            <Calendar size={10} />
                            {new Date(q.due_date).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="text-xs px-3 py-1.5 rounded-full font-bold text-white flex-shrink-0"
                      style={{ background: "#E53935" }}>เริ่มทำ →</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {done.length > 0 && (
            <div>
              <h2 className="text-sm font-black text-slate-600 mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                ทำแล้ว ({done.length})
              </h2>
              <div className="grid gap-3">
                {done.map(q => {
                  const sub = subMap.get(q.id)!
                  const pct = sub.max_score > 0 ? Math.round((sub.score / sub.max_score) * 100) : 0
                  return (
                    <Link key={q.id} href={`/student/quizzes/${q.id}`}
                      className="bg-white rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all border-l-4 border-green-400">
                      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
                        style={{ background: "#E8F5E9" }}>
                        ✅
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-black text-slate-900 truncate">{q.title}</h3>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="w-32 h-1.5 rounded-full bg-slate-100">
                            <div className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: pct >= 70 ? "#2E7D32" : pct >= 50 ? "#F59E0B" : "#E53935" }} />
                          </div>
                          <span className="text-xs text-slate-500">{sub.score}/{sub.max_score} คะแนน</span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span className="text-2xl font-black"
                          style={{ color: pct >= 70 ? "#2E7D32" : pct >= 50 ? "#F59E0B" : "#E53935" }}>
                          {pct}%
                        </span>
                        <p className="text-[10px] text-slate-400">
                          {new Date(sub.submitted_at).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                        </p>
                      </div>
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
