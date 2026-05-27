import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowLeft, CheckCircle, XCircle } from "lucide-react"
import { formatDuration } from "@/lib/utils"
import { cn } from "@/lib/utils"

export default async function VideoAnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: video } = await supabase
    .from("videos")
    .select("*, classrooms(id, name, cover_color)")
    .eq("id", id)
    .eq("teacher_id", user.id)
    .single()
  if (!video) notFound()

  const classroom = video.classrooms as { id: string; name: string; cover_color: string }

  const { data: questions } = await supabase
    .from("questions")
    .select("*")
    .eq("video_id", id)
    .order("timestamp_seconds")

  const { data: enrolled } = await supabase
    .from("enrollments")
    .select("*, profiles(id, name, email)")
    .eq("classroom_id", classroom.id)

  const { data: progresses } = await supabase
    .from("video_progress")
    .select("*")
    .eq("video_id", id)

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
    const total = questions?.length ?? 0
    return { profile, progress, correct, total, answered: studentResponses.length }
  }) || []

  const avgWatch = progresses?.length
    ? Math.round(progresses.reduce((s, p) => s + (p.watch_percentage ?? 0), 0) / progresses.length)
    : 0
  const completed = progresses?.filter(p => p.completed).length ?? 0

  const questionStats = questions?.map(q => {
    const qR = allResponses?.filter(r => r.question_id === q.id) || []
    const correct = qR.filter(r => r.is_correct).length
    return { q, total: qR.length, correct }
  }) || []

  const avgScore = studentStats.length > 0
    ? Math.round(studentStats.reduce((s, st) => s + (st.total > 0 ? (st.correct / st.total) * 100 : 0), 0) / studentStats.length)
    : 0

  return (
    <div className="min-h-full p-6" style={{ background: "#0F172A" }}>
      {/* Back link */}
      <Link
        href={`/teacher/videos/${id}`}
        className="inline-flex items-center gap-2 text-sm mb-6 transition-colors"
        style={{ color: "#94A3B8" }}
      >
        <ArrowLeft size={15} /> Back to video
      </Link>

      {/* ── Top header ── */}
      <div
        className="rounded-2xl p-5 mb-6 flex items-center gap-4"
        style={{ background: "linear-gradient(135deg, #1E3A5F 0%, #1E293B 100%)" }}
      >
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
          style={{ background: classroom.cover_color ? `${classroom.cover_color}33` : "#312E81" }}
        >
          🎬
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold mb-1" style={{ color: "#60A5FA" }}>{classroom.name}</p>
          <h1 className="text-xl font-black text-white truncate">{video.title}</h1>
          <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>Student Results Overview</p>
        </div>
        {/* Class status pills */}
        <div className="hidden lg:flex gap-3 flex-shrink-0">
          {[
            { label: "Students", value: enrolled?.length ?? 0, color: "#3B82F6" },
            { label: "Watched", value: progresses?.length ?? 0, color: "#10B981" },
            { label: "Completed", value: completed, color: "#8B5CF6" },
            { label: "Avg Watch", value: `${avgWatch}%`, color: "#F59E0B" },
            { label: "Avg Score", value: `${avgScore}%`, color: "#EF4444" },
          ].map(s => (
            <div key={s.label} className="text-center">
              <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[10px] font-semibold" style={{ color: "#94A3B8" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stats cards (mobile) ── */}
      <div className="grid grid-cols-3 lg:hidden gap-3 mb-6">
        {[
          { label: "Students", value: enrolled?.length ?? 0, emoji: "👨‍🎓", color: "#3B82F6" },
          { label: "Completed", value: completed, emoji: "✅", color: "#10B981" },
          { label: "Avg Score", value: `${avgScore}%`, emoji: "🏆", color: "#F59E0B" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: "#1E293B" }}>
            <span className="text-2xl block mb-1">{s.emoji}</span>
            <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
            <p className="text-xs" style={{ color: "#94A3B8" }}>{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* ── Student Monitoring ── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "#1E293B" }}>
          <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #334155" }}>
            <h2 className="font-black text-white flex items-center gap-2">
              <span>👥</span> Student Monitoring
            </h2>
            <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: "#1E3A5F", color: "#60A5FA" }}>
              {studentStats.length} students
            </span>
          </div>
          <div className="p-4">
            {studentStats.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: "#94A3B8" }}>
                ยังไม่มีนักเรียน
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {studentStats.map(({ profile, progress, correct, total, answered }) => {
                  const pct = progress?.watch_percentage ?? 0
                  const scorePct = answered > 0 ? Math.round((correct / answered) * 100) : null
                  const scoreColor = scorePct === null ? "#64748B" : scorePct >= 70 ? "#10B981" : scorePct >= 40 ? "#F59E0B" : "#EF4444"
                  return (
                    <div
                      key={profile.id}
                      className="rounded-2xl p-4 flex items-center gap-3"
                      style={{ background: "#0F172A" }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center font-black text-base flex-shrink-0"
                        style={{ background: "#312E81", color: "#A78BFA" }}
                      >
                        {profile.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{profile.name}</p>
                        {/* Watch progress bar */}
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 h-1.5 rounded-full" style={{ background: "#1E293B" }}>
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${pct}%`, background: "#3B82F6" }}
                            />
                          </div>
                          <span className="text-[10px] font-bold flex-shrink-0" style={{ color: "#60A5FA" }}>
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <span
                          className="text-sm font-black block"
                          style={{ color: scoreColor }}
                        >
                          {scorePct !== null ? `${scorePct}%` : "—"}
                        </span>
                        <span className="text-[10px]" style={{ color: "#64748B" }}>
                          {correct}/{total} ✓
                        </span>
                      </div>
                      {progress?.completed && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full font-bold ml-1 flex-shrink-0"
                          style={{ background: "#064E3B", color: "#34D399" }}
                        >
                          Done
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Quiz Analytics ── */}
        <div className="rounded-2xl overflow-hidden" style={{ background: "#1E293B" }}>
          <div className="px-5 py-4" style={{ borderBottom: "1px solid #334155" }}>
            <h2 className="font-black text-white flex items-center gap-2">
              <span>🧩</span> Quiz Performance
            </h2>
          </div>
          <div className="p-4">
            {questionStats.length === 0 ? (
              <p className="text-center py-8 text-sm" style={{ color: "#94A3B8" }}>
                ยังไม่มีคำถาม
              </p>
            ) : (
              <div className="flex flex-col gap-4">
                {questionStats.map(({ q, total: t, correct: c }, idx) => {
                  const pct = t > 0 ? Math.round((c / t) * 100) : 0
                  const barColor = pct >= 70 ? "#10B981" : pct >= 40 ? "#F59E0B" : "#EF4444"
                  return (
                    <div key={q.id}>
                      <div className="flex items-start gap-2 mb-2">
                        <span
                          className="text-xs font-black px-2 py-0.5 rounded-lg flex-shrink-0"
                          style={{ background: "#0F172A", color: "#60A5FA" }}
                        >
                          Q{idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white font-medium line-clamp-2">{q.question_text}</p>
                          <p className="text-[10px] mt-0.5 font-mono" style={{ color: "#64748B" }}>
                            ⏱ {formatDuration(q.timestamp_seconds)}
                          </p>
                        </div>
                        <span className="text-sm font-black flex-shrink-0" style={{ color: barColor }}>
                          {pct}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full" style={{ background: "#0F172A" }}>
                          <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, background: barColor }}
                          />
                        </div>
                        <div className="flex items-center gap-3 text-[10px] flex-shrink-0">
                          <span className={cn("flex items-center gap-1")} style={{ color: "#34D399" }}>
                            <CheckCircle size={10} /> {c}
                          </span>
                          <span className={cn("flex items-center gap-1")} style={{ color: "#F87171" }}>
                            <XCircle size={10} /> {t - c}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Assignment Control ── */}
      <div className="mt-5 rounded-2xl p-5" style={{ background: "#1E293B" }}>
        <h2 className="font-black text-white flex items-center gap-2 mb-4">
          <span>📋</span> Assignment Control Center
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Questions", value: questions?.length ?? 0, emoji: "❓", color: "#60A5FA" },
            { label: "Total Responses", value: allResponses?.length ?? 0, emoji: "📝", color: "#A78BFA" },
            { label: "Correct Answers", value: allResponses?.filter(r => r.is_correct).length ?? 0, emoji: "✅", color: "#34D399" },
            { label: "Avg Completion", value: `${avgWatch}%`, emoji: "📊", color: "#F59E0B" },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ background: "#0F172A" }}
            >
              <span className="text-2xl">{s.emoji}</span>
              <div>
                <p className="text-xl font-black" style={{ color: s.color }}>{s.value}</p>
                <p className="text-[11px] font-semibold" style={{ color: "#64748B" }}>{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
