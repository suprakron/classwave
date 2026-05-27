import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Plus, Calendar, CheckCircle, Clock } from "lucide-react"

export default async function TeacherQuizzesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
  if (profile?.role !== "teacher") redirect("/student")

  const { data: classrooms } = await supabase
    .from("classrooms").select("id").eq("teacher_id", user.id)
  const classroomIds = classrooms?.map(c => c.id) || []

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: quizzes } = classroomIds.length > 0
    ? await db.from("quizzes")
        .select("id, title, description, due_date, published, created_at, classrooms(name, cover_color)")
        .in("classroom_id", classroomIds)
        .order("created_at", { ascending: false })
    : { data: [] }

  const list: {
    id: string; title: string; description?: string; due_date?: string
    published: boolean; classrooms: { name: string; cover_color: string }
  }[] = quizzes ?? []

  const { data: qCounts } = list.length > 0
    ? await db.from("quiz_questions").select("quiz_id").in("quiz_id", list.map(q => q.id))
    : { data: [] }

  const { data: subCounts } = list.length > 0
    ? await db.from("quiz_submissions").select("quiz_id").in("quiz_id", list.map(q => q.id))
    : { data: [] }

  const qcMap = new Map<string, number>()
  ;(qCounts as { quiz_id: string }[] ?? []).forEach(r => qcMap.set(r.quiz_id, (qcMap.get(r.quiz_id) ?? 0) + 1))
  const scMap = new Map<string, number>()
  ;(subCounts as { quiz_id: string }[] ?? []).forEach(r => scMap.set(r.quiz_id, (scMap.get(r.quiz_id) ?? 0) + 1))

  return (
    <div className="flex-1 p-6 overflow-auto" style={{ background: "#FFF0F0" }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Test / Quiz</h1>
          <p className="text-sm font-semibold" style={{ color: "#E53935" }}>จัดการแบบทดสอบทั้งหมด</p>
        </div>
        <Link href="/teacher/quizzes/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-full text-white font-bold text-sm hover:opacity-90 transition-opacity"
          style={{ background: "#E53935" }}>
          <Plus size={16} /> สร้างแบบทดสอบ
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="bg-white rounded-3xl p-16 text-center shadow-sm">
          <span className="text-6xl block mb-4">🧩</span>
          <h3 className="text-lg font-black text-slate-800 mb-2">ยังไม่มีแบบทดสอบ</h3>
          <p className="text-slate-500 text-sm mb-6">สร้างแบบทดสอบวิชาเคมีให้นักเรียนของคุณ</p>
          <Link href="/teacher/quizzes/new"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-bold"
            style={{ background: "#E53935" }}>
            <Plus size={16} /> สร้างแบบทดสอบ
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {list.map(q => (
            <Link key={q.id} href={`/teacher/quizzes/${q.id}`}
              className="bg-white rounded-3xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: q.classrooms?.cover_color ? `${q.classrooms.cover_color}22` : "#F1F8E9" }}>
                🧩
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h3 className="font-black text-slate-900 truncate">{q.title}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold flex-shrink-0 ${
                    q.published ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {q.published ? "เผยแพร่" : "ฉบับร่าง"}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <span>📚 {q.classrooms?.name}</span>
                  <span className="flex items-center gap-1">
                    <CheckCircle size={11} /> {qcMap.get(q.id) ?? 0} คำถาม
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={11} /> {scMap.get(q.id) ?? 0} ทำแล้ว
                  </span>
                  {q.due_date && (
                    <span className="flex items-center gap-1">
                      <Calendar size={11} />
                      {new Date(q.due_date).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs px-3 py-1.5 rounded-full font-bold flex-shrink-0"
                style={{ background: "#F1F8E9", color: "#2E7D32" }}>ดู →</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
