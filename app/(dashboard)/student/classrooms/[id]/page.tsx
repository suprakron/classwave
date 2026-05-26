import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowLeft, Play, CheckCircle, Clock, Lock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDuration } from "@/lib/utils"

export default async function StudentClassroomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: classroom }, { data: videos }, { data: progresses }] = await Promise.all([
    supabase.from("classrooms")
      .select("*, profiles!classrooms_teacher_id_fkey(name)")
      .eq("id", id)
      .single(),
    supabase.from("videos")
      .select("*, questions(count)")
      .eq("classroom_id", id)
      .eq("published", true)
      .order("created_at"),
    supabase.from("video_progress")
      .select("*")
      .eq("student_id", user.id),
  ])

  if (!classroom) notFound()
  const progressMap = new Map(progresses?.map(p => [p.video_id, p]) || [])
  const teacher = classroom.profiles as { name: string }

  return (
    <div className="p-8 max-w-4xl animate-fade-in">
      <Link href="/student/classrooms" className="flex items-center gap-2 text-sm text-slate-500 hover:text-violet-600 mb-6 transition-colors">
        <ArrowLeft size={16} /> ห้องเรียนของฉัน
      </Link>

      <div className="h-28 rounded-2xl flex items-end p-6 mb-6"
        style={{ background: `linear-gradient(135deg, ${classroom.cover_color || "#7c3aed"}, ${classroom.cover_color || "#7c3aed"}99)` }}>
        <div className="text-white">
          {classroom.subject && <p className="text-white/70 text-sm mb-1">{classroom.subject}</p>}
          <h1 className="text-2xl font-bold">{classroom.name}</h1>
          {teacher && <p className="text-white/70 text-sm mt-1">ครู {teacher.name}</p>}
        </div>
      </div>

      <div className="space-y-4">
        {videos?.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
            <Lock size={36} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500">ยังไม่มีวีดีโอที่เผยแพร่ในห้องนี้</p>
          </div>
        ) : (
          videos?.map(video => {
            const progress = progressMap.get(video.id)
            const qCount = (video.questions as { count: number }[])?.[0]?.count ?? 0
            const pct = progress?.watch_percentage ?? 0
            return (
              <Card key={video.id} hover>
                <Link href={`/student/watch/${video.id}`}>
                  <CardContent className="pt-5">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${classroom.cover_color || "#7c3aed"}22` }}>
                        {progress?.completed
                          ? <CheckCircle size={24} className="text-emerald-500" />
                          : <Play size={24} style={{ color: classroom.cover_color || "#7c3aed" }} className="ml-0.5" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-slate-900 truncate">{video.title}</h3>
                          {progress?.completed && <Badge variant="success">ดูจบแล้ว</Badge>}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          {video.duration && <span>{formatDuration(video.duration)}</span>}
                          <span>{qCount} คำถาม</span>
                          {pct > 0 && !progress?.completed && (
                            <span className="flex items-center gap-1"><Clock size={11} /> ดูไปแล้ว {pct}%</span>
                          )}
                        </div>
                        {pct > 0 && (
                          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-violet-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                          </div>
                        )}
                      </div>
                      <div className="px-4 py-2 bg-violet-600 text-white text-sm font-medium rounded-xl hover:bg-violet-700 transition-colors shrink-0">
                        {progress?.last_position ? "ดูต่อ" : "เริ่มดู"} →
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
