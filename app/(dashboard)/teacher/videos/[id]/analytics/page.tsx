import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowLeft, Users, CheckCircle, XCircle, Clock, TrendingUp, BarChart2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDuration } from "@/lib/utils"
import { cn } from "@/lib/utils"

export default async function VideoAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: video }, { data: questions }, { data: progresses }, { data: responses }, { data: enrollments }] = await Promise.all([
    supabase.from("videos").select("*, classrooms(id, name, cover_color)").eq("id", id).eq("teacher_id", user.id).single(),
    supabase.from("questions").select("*").eq("video_id", id).order("timestamp_seconds"),
    supabase.from("video_progress").select("*, profiles(name, email)").eq("video_id", id),
    supabase.from("question_responses").select("*, profiles(name)").in("question_id", []),
    supabase.from("enrollments").select("*, profiles(id, name, email)").eq("classroom_id", ""),
  ])

  if (!video) notFound()
  const classroom = video.classrooms as { id: string; name: string; cover_color: string }

  // Get enrolled students
  const { data: enrolled } = await supabase
    .from("enrollments")
    .select("*, profiles(id, name, email)")
    .eq("classroom_id", classroom.id)

  const questionIds = questions?.map(q => q.id) || []

  const { data: allResponses } = questionIds.length > 0
    ? await supabase.from("question_responses").select("*").in("question_id", questionIds)
    : { data: [] }

  const progressMap = new Map(progresses?.map(p => [p.student_id, p]) || [])

  const studentStats = enrolled?.map(e => {
    const profile = e.profiles as { id: string; name: string; email: string }
    const progress = progressMap.get(profile.id)
    const studentResponses = allResponses?.filter(r => r.student_id === profile.id) || []
    const correct = studentResponses.filter(r => r.is_correct).length
    return { profile, progress, responses: studentResponses, correct, total: questions?.length ?? 0 }
  }) || []

  const avgWatch = progresses?.length
    ? Math.round(progresses.reduce((s, p) => s + (p.watch_percentage ?? 0), 0) / progresses.length)
    : 0
  const completed = progresses?.filter(p => p.completed).length ?? 0

  // Per-question stats
  const questionStats = questions?.map(q => {
    const qResponses = allResponses?.filter(r => r.question_id === q.id) || []
    const correctCount = qResponses.filter(r => r.is_correct).length
    return { q, total: qResponses.length, correct: correctCount }
  }) || []

  return (
    <div className="p-8 max-w-6xl animate-fade-in">
      <Link href={`/teacher/videos/${id}`} className="flex items-center gap-2 text-sm text-slate-500 hover:text-violet-600 mb-6 transition-colors">
        <ArrowLeft size={16} /> กลับไปแก้ไขวีดีโอ
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${classroom.cover_color || "#7c3aed"}22` }}>
          <BarChart2 size={24} style={{ color: classroom.cover_color || "#7c3aed" }} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Analytics: {video.title}</h1>
          <p className="text-slate-500 text-sm">{classroom.name}</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "นักเรียนทั้งหมด", value: enrolled?.length ?? 0, icon: <Users size={20} />, color: "bg-violet-100 text-violet-600" },
          { label: "ดูแล้ว", value: progresses?.length ?? 0, icon: <TrendingUp size={20} />, color: "bg-blue-100 text-blue-600" },
          { label: "ดูจบแล้ว", value: completed, icon: <CheckCircle size={20} />, color: "bg-emerald-100 text-emerald-600" },
          { label: "เฉลี่ยดูถึง", value: `${avgWatch}%`, icon: <Clock size={20} />, color: "bg-amber-100 text-amber-600" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="pt-5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Per-student table */}
        <Card>
          <div className="px-6 pt-6 pb-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">ความคืบหน้าของนักเรียน</h2>
          </div>
          <CardContent className="pt-4">
            {studentStats.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">ยังไม่มีนักเรียนในห้องเรียนนี้</p>
            ) : (
              <div className="space-y-3">
                {studentStats.map(({ profile, progress, correct, total }) => {
                  const pct = progress?.watch_percentage ?? 0
                  const answered = progress ? (total > 0 ? Math.min(correct + (total - correct), total) : 0) : 0
                  return (
                    <div key={profile.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                      <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-sm shrink-0">
                        {profile.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{profile.name}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-violet-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-slate-400 shrink-0">{pct}%</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {progress ? (
                          <>
                            {progress.completed
                              ? <Badge variant="success">จบแล้ว</Badge>
                              : <Badge variant="warning">กำลังดู</Badge>}
                            {total > 0 && (
                              <p className="text-xs text-slate-400 mt-1">{correct}/{total} ถูก</p>
                            )}
                          </>
                        ) : (
                          <Badge variant="default">ยังไม่เปิด</Badge>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Per-question stats */}
        <Card>
          <div className="px-6 pt-6 pb-3 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">สถิติรายคำถาม</h2>
          </div>
          <CardContent className="pt-4">
            {questionStats.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-6">ยังไม่มีคำถาม</p>
            ) : (
              <div className="space-y-4">
                {questionStats.map(({ q, total: t, correct: c }) => {
                  const pct = t > 0 ? Math.round((c / t) * 100) : 0
                  return (
                    <div key={q.id}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded shrink-0">
                            {formatDuration(q.timestamp_seconds)}
                          </span>
                          <p className="text-sm text-slate-700 line-clamp-2">{q.question_text}</p>
                        </div>
                        <span className={cn("text-xs font-semibold shrink-0", pct >= 70 ? "text-emerald-600" : pct >= 40 ? "text-amber-600" : "text-red-500")}>
                          {pct}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div className={cn("h-full rounded-full transition-all", pct >= 70 ? "bg-emerald-400" : pct >= 40 ? "bg-amber-400" : "bg-red-400")}
                            style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-slate-400">{c}/{t} คน</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-xs text-emerald-600"><CheckCircle size={11} /> {c} ถูก</span>
                        <span className="flex items-center gap-1 text-xs text-red-500"><XCircle size={11} /> {t - c} ผิด</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
