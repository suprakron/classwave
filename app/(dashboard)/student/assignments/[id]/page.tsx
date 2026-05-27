import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowLeft, Download, Calendar } from "lucide-react"
import { SubmitForm } from "./submit-form"

export default async function StudentAssignmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: assignment } = await db.from("assignments")
    .select("*, classrooms(name, cover_color)").eq("id", id).single()
  if (!assignment) notFound()

  const { data: submission } = await db.from("assignment_submissions")
    .select("*").eq("assignment_id", id).eq("student_id", user.id).maybeSingle()

  const isOverdue = assignment.due_date && new Date(assignment.due_date) < new Date()

  return (
    <div className="flex-1 p-6 overflow-auto" style={{ background: "#FFF0F0" }}>
      <Link href="/student/assignments"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-rose-500 mb-6 transition-colors">
        <ArrowLeft size={15} /> กลับ
      </Link>

      <div className="max-w-2xl space-y-5">
        {/* Assignment info */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: assignment.classrooms?.cover_color ? `${assignment.classrooms.cover_color}22` : "#FFF0F0" }}>
              📋
            </div>
            <div>
              <p className="text-xs font-bold mb-1" style={{ color: "#E53935" }}>{assignment.classrooms?.name}</p>
              <h1 className="text-xl font-black text-slate-900">{assignment.title}</h1>
            </div>
          </div>

          {assignment.description && (
            <div className="p-4 rounded-2xl text-sm text-slate-700 whitespace-pre-line mb-4"
              style={{ background: "#F8FAFC" }}>
              {assignment.description}
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-slate-500">
            {assignment.due_date && (
              <span className={`flex items-center gap-1.5 font-semibold ${isOverdue ? "text-red-500" : "text-orange-500"}`}>
                <Calendar size={12} />
                กำหนดส่ง: {new Date(assignment.due_date).toLocaleDateString("th-TH", {
                  day: "numeric", month: "long", year: "numeric",
                  hour: "2-digit", minute: "2-digit"
                })}
                {isOverdue && " (หมดเวลาแล้ว)"}
              </span>
            )}
          </div>

          {assignment.file_url && (
            <a href={assignment.file_url} target="_blank" rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold hover:opacity-90 transition-opacity"
              style={{ background: "#E3F2FD", color: "#1565C0" }}>
              <Download size={14} /> {assignment.file_name || "ดาวน์โหลดไฟล์ใบงาน"}
            </a>
          )}
        </div>

        {/* Submission */}
        {submission ? (
          <div className="bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2">
              <span className="text-xl">✅</span> ส่งงานแล้ว
            </h2>
            {submission.note && (
              <div className="p-4 rounded-2xl text-sm text-slate-700 mb-3" style={{ background: "#F8FAFC" }}>
                💬 {submission.note}
              </div>
            )}
            {submission.file_url && (
              <a href={submission.file_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-3"
                style={{ background: "#E3F2FD", color: "#1565C0" }}>
                <Download size={14} /> {submission.file_name || "ไฟล์ที่ส่ง"}
              </a>
            )}
            <p className="text-xs text-slate-400 mb-4">
              ส่งเมื่อ {new Date(submission.submitted_at).toLocaleDateString("th-TH", {
                day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
              })}
            </p>
            {submission.score != null ? (
              <div className="p-4 rounded-2xl" style={{ background: "#E8F5E9" }}>
                <p className="text-xs font-black text-green-700 mb-1">ผลการตรวจ</p>
                <p className="text-3xl font-black" style={{ color: "#2E7D32" }}>{submission.score} คะแนน</p>
                {submission.feedback && (
                  <p className="text-sm text-green-700 mt-2">💬 {submission.feedback}</p>
                )}
              </div>
            ) : (
              <div className="p-3 rounded-2xl text-sm font-semibold" style={{ background: "#FFF9C4", color: "#F57F17" }}>
                ⏳ รอครูตรวจงาน
              </div>
            )}
          </div>
        ) : (
          <SubmitForm assignmentId={id} studentId={user.id} />
        )}
      </div>
    </div>
  )
}
