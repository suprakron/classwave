import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowLeft, Download, Calendar } from "lucide-react"
import { GradeForm } from "./grade-form"

export default async function AssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: assignment } = await db.from("assignments")
    .select("*, classrooms(id, name, cover_color)")
    .eq("id", id).eq("teacher_id", user.id).single()

  if (!assignment) notFound()

  const { data: enrolled } = await supabase
    .from("enrollments")
    .select("*, profiles(id, name, email)")
    .eq("classroom_id", assignment.classroom_id)

  const { data: submissions } = await db.from("assignment_submissions")
    .select("*").eq("assignment_id", id)

  const subMap = new Map<string, {
    id: string; file_url?: string; file_name?: string; note?: string
    submitted_at: string; score?: number; feedback?: string
  }>()
  type Sub = { id: string; student_id: string; file_url?: string; file_name?: string; note?: string; submitted_at: string; score?: number; feedback?: string }
  ;(submissions as Sub[] ?? []).forEach(s => subMap.set(s.student_id, s))

  const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date()

  return (
    <div className="flex-1 p-6 overflow-auto" style={{ background: "#FFF0F0" }}>
      <Link href="/teacher/assignments"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-rose-500 mb-6 transition-colors">
        <ArrowLeft size={15} /> กลับ
      </Link>

      {/* Assignment header */}
      <div className="bg-white rounded-3xl p-6 shadow-sm mb-5">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: assignment.classrooms?.cover_color ? `${assignment.classrooms.cover_color}22` : "#FFF0F0" }}>
            📋
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold mb-1" style={{ color: "#E53935" }}>{assignment.classrooms?.name}</p>
            <h1 className="text-xl font-black text-slate-900">{assignment.title}</h1>
            {assignment.description && (
              <p className="text-sm text-slate-600 mt-2 whitespace-pre-line">{assignment.description}</p>
            )}
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
              {assignment.due_date && (
                <span className={`flex items-center gap-1 font-semibold ${isOverdue ? "text-red-500" : ""}`}>
                  <Calendar size={11} />
                  กำหนดส่ง: {new Date(assignment.due_date).toLocaleDateString("th-TH", {
                    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                  })}
                  {isOverdue && " (หมดเวลา)"}
                </span>
              )}
            </div>
          </div>
        </div>

        {assignment.file_url && (
          <a href={assignment.file_url} target="_blank" rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
            style={{ background: "#E3F2FD", color: "#1565C0" }}>
            <Download size={14} /> {assignment.file_name || "ดาวน์โหลดไฟล์ใบงาน"}
          </a>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: "นักเรียนทั้งหมด", value: enrolled?.length ?? 0, emoji: "👨‍🎓", bg: "#E3F2FD", color: "#1565C0" },
          { label: "ส่งงานแล้ว", value: subMap.size, emoji: "✅", bg: "#E8F5E9", color: "#2E7D32" },
          { label: "ยังไม่ส่ง", value: (enrolled?.length ?? 0) - subMap.size, emoji: "⏳", bg: "#FFF3E0", color: "#E65100" },
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

      {/* Student submissions */}
      <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="font-black text-slate-900">รายชื่อนักเรียน & การส่งงาน</h2>
        </div>
        <div className="divide-y divide-slate-50">
          {(enrolled ?? []).map(e => {
            const profile = e.profiles as { id: string; name: string; email: string }
            const sub = subMap.get(profile.id)
            return (
              <div key={profile.id} className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center font-black text-white flex-shrink-0"
                    style={{ background: "#1565C0" }}>
                    {profile.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-slate-900">{profile.name}</p>
                    <p className="text-xs text-slate-400">{profile.email}</p>
                    {sub ? (
                      <div className="mt-2 space-y-2">
                        {sub.note && (
                          <div className="p-3 rounded-2xl text-sm text-slate-700" style={{ background: "#F8FAFC" }}>
                            💬 {sub.note}
                          </div>
                        )}
                        {sub.file_url && (
                          <a href={sub.file_url} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold"
                            style={{ background: "#E3F2FD", color: "#1565C0" }}>
                            <Download size={12} /> {sub.file_name || "ดาวน์โหลดงาน"}
                          </a>
                        )}
                        <p className="text-xs text-slate-400">
                          ส่งเมื่อ {new Date(sub.submitted_at).toLocaleDateString("th-TH", {
                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                          })}
                        </p>
                        <GradeForm
                          submissionId={sub.id}
                          currentScore={sub.score}
                          currentFeedback={sub.feedback}
                        />
                      </div>
                    ) : (
                      <span className="mt-2 inline-block text-xs px-3 py-1 rounded-full font-bold"
                        style={{ background: "#FFF3E0", color: "#E65100" }}>
                        ยังไม่ส่ง
                      </span>
                    )}
                  </div>
                  {sub && (
                    <div className="text-right flex-shrink-0">
                      {sub.score != null ? (
                        <span className="text-2xl font-black" style={{ color: "#2E7D32" }}>{sub.score}</span>
                      ) : (
                        <span className="text-xs text-slate-400">ยังไม่ตรวจ</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
