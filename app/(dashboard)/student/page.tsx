import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { BookOpen, Play, CheckCircle, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDuration } from "@/lib/utils"

export default async function StudentDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (profile?.role !== "student") redirect("/teacher")

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("*, classrooms(id, name, cover_color, subject, teacher_id, profiles!classrooms_teacher_id_fkey(name))")
    .eq("student_id", user.id)

  const classroomIds = enrollments?.map(e => e.classroom_id) || []
  const [{ data: videos }, { data: progresses }] = classroomIds.length > 0
    ? await Promise.all([
      supabase.from("videos").select("*, classrooms(name, cover_color), questions(count)").in("classroom_id", classroomIds).eq("published", true).order("created_at", { ascending: false }).limit(8),
      supabase.from("video_progress").select("*").eq("student_id", user.id),
    ])
    : [{ data: [] }, { data: [] }]

  const progressMap = new Map(progresses?.map(p => [p.video_id, p]) || [])
  const completed = progresses?.filter(p => p.completed).length ?? 0
  const inProgress = progresses?.filter(p => !p.completed && p.last_position > 0).length ?? 0

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "สวัสดีตอนเช้า" : hour < 17 ? "สวัสดีตอนบ่าย" : "สวัสดีตอนเย็น"

  return (
    <div className="p-8 max-w-7xl animate-fade-in">
      <div className="mb-8">
        <p className="text-slate-500 text-sm mb-1">{greeting},</p>
        <h1 className="text-2xl font-bold text-slate-900">{profile?.name} 📚</h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: "ห้องเรียนของฉัน", value: enrollments?.length ?? 0, icon: <BookOpen size={20} />, color: "bg-blue-100 text-blue-600" },
          { label: "ดูจบแล้ว", value: completed, icon: <CheckCircle size={20} />, color: "bg-emerald-100 text-emerald-600" },
          { label: "กำลังดู", value: inProgress, icon: <Clock size={20} />, color: "bg-amber-100 text-amber-600" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
              <p className="text-3xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {enrollments?.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <BookOpen size={48} className="text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">ยังไม่ได้เข้าร่วมห้องเรียน</h3>
          <p className="text-slate-500 mb-6">กรอก Class Code จากครูเพื่อเข้าร่วมห้องเรียน</p>
          <Link href="/student/classrooms"
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors">
            เข้าร่วมห้องเรียน
          </Link>
        </div>
      ) : (
        <>
          <h2 className="font-semibold text-slate-900 mb-4">วีดีโอล่าสุด</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {videos?.map(video => {
              const progress = progressMap.get(video.id)
              const classroom = video.classrooms as { name: string; cover_color: string }
              const qCount = (video.questions as { count: number }[])?.[0]?.count ?? 0
              const pct = progress?.watch_percentage ?? 0
              return (
                <Card key={video.id} hover>
                  <Link href={`/student/watch/${video.id}`}>
                    <div className="h-28 rounded-t-2xl flex items-center justify-center relative overflow-hidden"
                      style={{ background: `linear-gradient(135deg, ${classroom?.cover_color || "#7c3aed"}33, ${classroom?.cover_color || "#7c3aed"}11)` }}>
                      <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center shadow-sm">
                        <Play size={20} fill={classroom?.cover_color || "#7c3aed"} className="ml-0.5" style={{ color: classroom?.cover_color || "#7c3aed" }} />
                      </div>
                      <div className="absolute top-2 right-2">
                        {progress?.completed && <Badge variant="success">✓ ดูจบแล้ว</Badge>}
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-1 bg-slate-100">
                      <div className="h-full bg-violet-400 transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <CardContent className="pt-3 pb-4">
                      <h3 className="font-medium text-slate-900 text-sm truncate">{video.title}</h3>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full" style={{ background: classroom?.cover_color || "#7c3aed" }} />
                          {classroom?.name}
                        </span>
                        <span className="text-xs text-slate-400">{qCount} คำถาม</span>
                      </div>
                      {pct > 0 && !progress?.completed && (
                        <div className="flex items-center gap-1.5 mt-2">
                          <Clock size={12} className="text-slate-400" />
                          <span className="text-xs text-slate-400">ดูไปแล้ว {pct}%</span>
                        </div>
                      )}
                      {video.duration && (
                        <p className="text-xs text-slate-400 mt-1">{formatDuration(video.duration)}</p>
                      )}
                    </CardContent>
                  </Link>
                </Card>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
