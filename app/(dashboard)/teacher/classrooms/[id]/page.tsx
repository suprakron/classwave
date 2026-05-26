import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { ArrowLeft, Plus, Video, Users, Play } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CopyButton } from "@/components/ui/copy-button"
import { formatDuration } from "@/lib/utils"

export default async function ClassroomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: classroom }, { data: videos }, { data: enrollments }] = await Promise.all([
    supabase.from("classrooms").select("*").eq("id", id).eq("teacher_id", user.id).single(),
    supabase.from("videos").select("*, questions(count)").eq("classroom_id", id).order("created_at", { ascending: false }),
    supabase.from("enrollments").select("*, profiles(name, email)").eq("classroom_id", id).order("joined_at", { ascending: false }),
  ])

  if (!classroom) notFound()

  return (
    <div className="p-8 max-w-7xl animate-fade-in">
      <Link href="/teacher/classrooms" className="flex items-center gap-2 text-sm text-slate-500 hover:text-violet-600 mb-6 transition-colors">
        <ArrowLeft size={16} /> ห้องเรียนทั้งหมด
      </Link>

      {/* Header */}
      <div className="h-32 rounded-2xl flex items-end p-6 mb-6"
        style={{ background: `linear-gradient(135deg, ${classroom.cover_color || "#7c3aed"}, ${classroom.cover_color || "#7c3aed"}99)` }}>
        <div className="text-white flex items-end justify-between w-full">
          <div>
            <p className="text-white/70 text-sm mb-1">{classroom.subject}</p>
            <h1 className="text-3xl font-bold">{classroom.name}</h1>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-xs mb-1">Class Code</p>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-2xl tracking-widest">{classroom.class_code}</span>
              <CopyButton text={classroom.class_code} variant="light" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Videos */}
        <div className="md:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <Video size={18} className="text-violet-600" /> วีดีโอ ({videos?.length ?? 0})
            </h2>
            <Link href={`/teacher/videos/new?classroom=${id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700 transition-colors">
              <Plus size={14} /> เพิ่มวีดีโอ
            </Link>
          </div>

          {videos?.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-10 text-center">
              <Video size={40} className="text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 text-sm mb-4">ยังไม่มีวีดีโอในห้องเรียนนี้</p>
              <Link href={`/teacher/videos/new?classroom=${id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700">
                <Plus size={16} /> อัพโหลดวีดีโอแรก
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {videos?.map(video => {
                const qCount = (video.questions as { count: number }[])?.[0]?.count ?? 0
                return (
                  <Card key={video.id} hover>
                    <CardContent className="pt-4">
                      <Link href={`/teacher/videos/${video.id}`} className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                          <Play size={20} className="text-slate-400 ml-0.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{video.title}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {video.duration && (
                              <span className="text-xs text-slate-400">{formatDuration(video.duration)}</span>
                            )}
                            <span className="text-xs text-slate-400">{qCount} คำถาม</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {video.published ? <Badge variant="success">เผยแพร่แล้ว</Badge> : <Badge variant="warning">ฉบับร่าง</Badge>}
                          <Link href={`/teacher/videos/${video.id}/analytics`}
                            className="px-2 py-1 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-violet-100 hover:text-violet-700 transition-colors"
                            onClick={e => e.stopPropagation()}>
                            ดู Analytics
                          </Link>
                        </div>
                      </Link>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Students */}
        <div>
          <h2 className="font-semibold text-slate-900 flex items-center gap-2 mb-4">
            <Users size={18} className="text-blue-600" /> นักเรียน ({enrollments?.length ?? 0})
          </h2>
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            {enrollments?.length === 0 ? (
              <div className="p-8 text-center">
                <Users size={36} className="text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">ยังไม่มีนักเรียน</p>
                <p className="text-xs text-slate-400 mt-1">แชร์ Class Code <span className="font-mono font-semibold text-violet-600">{classroom.class_code}</span> ให้นักเรียน</p>
              </div>
            ) : (
              <div>
                {enrollments?.map((e, i) => {
                  const profile = e.profiles as { name: string; email: string }
                  return (
                    <div key={e.id} className={`flex items-center gap-3 px-4 py-3 ${i < (enrollments.length - 1) ? "border-b border-slate-50" : ""}`}>
                      <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-sm">
                        {profile?.name?.charAt(0)?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{profile?.name}</p>
                        <p className="text-xs text-slate-400 truncate">{profile?.email}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
