import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react"
import { PublishToggle } from "./publish-toggle"

export default async function QuizDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: quiz } = await db.from("quizzes")
    .select("*, classrooms(id, name, cover_color)")
    .eq("id", id).eq("teacher_id", user.id).single()
  if (!quiz) notFound()

  const { data: questions } = await db.from("quiz_questions")
    .select("*").eq("quiz_id", id).order("order_index")

  const { data: enrolled } = await supabase
    .from("enrollments").select("*, profiles(id, name, email)")
    .eq("classroom_id", quiz.classroom_id)

  const { data: submissions } = await db.from("quiz_submissions")
    .select("*").eq("quiz_id", id)

  type Submission = { student_id: string; score: number; max_score: number; submitted_at: string; answers: Record<string, string> }
  const subMap = new Map<string, Submission>()
  ;(submissions as Submission[] ?? []).forEach(s => subMap.set(s.student_id, s))

  const qList: { id: string; question_text: string; options: string[]; correct_answer: string; explanation?: string }[] = questions ?? []

  const avgScore = subMap.size > 0
    ? Math.round([...subMap.values()].reduce((s, sub) => s + (sub.max_score > 0 ? (sub.score / sub.max_score) * 100 : 0), 0) / subMap.size)
    : null

  return (
    <div className="flex-1 p-6 overflow-auto" style={{ background: "#FFF0F0" }}>
      <Link href="/teacher/quizzes"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-rose-500 mb-6 transition-colors">
        <ArrowLeft size={15} /> กลับ
      </Link>

      {/* Header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1 min-w-0">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: quiz.classrooms?.cover_color ? `${quiz.classrooms.cover_color}22` : "#F1F8E9" }}>
              🧩
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold mb-1" style={{ color: "#2E7D32" }}>{quiz.classrooms?.name}</p>
              <h1 className="text-xl font-black text-slate-900">{quiz.title}</h1>
              {quiz.description && <p className="text-sm text-slate-500 mt-1">{quiz.description}</p>}
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                <span>✅ {qList.length} คำถาม</span>
                {quiz.time_limit && <span>⏱ {quiz.time_limit} นาที</span>}
                {quiz.due_date && <span>📅 {new Date(quiz.due_date).toLocaleDateString("th-TH", { day: "numeric", month: "short" })}</span>}
              </div>
            </div>
          </div>
          <PublishToggle quizId={id} published={quiz.published} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "นักเรียนทั้งหมด", value: enrolled?.length ?? 0, emoji: "👨‍🎓", bg: "#E3F2FD", color: "#1565C0" },
          { label: "ทำแล้ว", value: subMap.size, emoji: "✅", bg: "#E8F5E9", color: "#2E7D32" },
          { label: "คะแนนเฉลี่ย", value: avgScore != null ? `${avgScore}%` : "—", emoji: "🏆", bg: "#FFF9C4", color: "#F57F17" },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <span className="text-2xl">{s.emoji}</span>
            <div>
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-slate-500 font-semibold">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Student results */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-black text-slate-900">ผลการทำแบบทดสอบ</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {(enrolled ?? []).map(e => {
              const profile = e.profiles as { id: string; name: string; email: string }
              const sub = subMap.get(profile.id)
              const pct = sub ? Math.round((sub.score / sub.max_score) * 100) : null
              return (
                <div key={profile.id} className="flex items-center gap-3 px-5 py-3.5">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-white text-sm flex-shrink-0"
                    style={{ background: "#1565C0" }}>
                    {profile.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate">{profile.name}</p>
                    {sub && (
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: (pct ?? 0) >= 70 ? "#2E7D32" : (pct ?? 0) >= 50 ? "#F59E0B" : "#E53935" }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{sub.score}/{sub.max_score}</span>
                      </div>
                    )}
                  </div>
                  {sub ? (
                    <span className="text-lg font-black flex-shrink-0"
                      style={{ color: (pct ?? 0) >= 70 ? "#2E7D32" : (pct ?? 0) >= 50 ? "#F59E0B" : "#E53935" }}>
                      {pct}%
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full font-bold flex-shrink-0"
                      style={{ background: "#FFF3E0", color: "#E65100" }}>ยังไม่ทำ</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Question stats */}
        <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="font-black text-slate-900">สถิติรายคำถาม</h2>
          </div>
          <div className="p-5 space-y-4">
            {qList.length === 0 ? (
              <p className="text-center text-slate-400 text-sm py-4">ยังไม่มีคำถาม</p>
            ) : qList.map((q, i) => {
              const responses = [...subMap.values()].map(s => s.answers?.[q.id])
              const correct = responses.filter(a => a === q.correct_answer).length
              const pct = responses.length > 0 ? Math.round((correct / responses.length) * 100) : 0
              const barColor = pct >= 70 ? "#2E7D32" : pct >= 40 ? "#F59E0B" : "#E53935"
              return (
                <div key={q.id}>
                  <div className="flex items-start gap-2 mb-1.5">
                    <span className="w-5 h-5 rounded-full text-[10px] font-black text-white flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: "#E53935" }}>{i + 1}</span>
                    <p className="text-xs text-slate-700 font-medium line-clamp-2 flex-1">{q.question_text}</p>
                    <span className="text-sm font-black flex-shrink-0" style={{ color: barColor }}>{pct}%</span>
                  </div>
                  <div className="flex items-center gap-2 ml-7">
                    <div className="flex-1 h-1.5 rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: barColor }} />
                    </div>
                    <div className="flex gap-2 text-[10px]">
                      <span className="flex items-center gap-0.5" style={{ color: "#2E7D32" }}>
                        <CheckCircle size={10} /> {correct}
                      </span>
                      <span className="flex items-center gap-0.5" style={{ color: "#E53935" }}>
                        <XCircle size={10} /> {responses.length - correct}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
