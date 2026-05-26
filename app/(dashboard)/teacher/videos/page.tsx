import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { Video, Plus, Play } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatDuration } from "@/lib/utils"

export default async function TeacherVideosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: videos } = await supabase
    .from("videos")
    .select("*, classrooms(name, cover_color), questions(count)")
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="p-8 max-w-7xl animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">วีดีโอทั้งหมด</h1>
          <p className="text-slate-500 text-sm mt-1">{videos?.length ?? 0} วีดีโอ</p>
        </div>
        <Link href="/teacher/videos/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 shadow-sm transition-all">
          <Plus size={16} /> เพิ่มวีดีโอใหม่
        </Link>
      </div>

      {videos?.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Video size={36} className="text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">ยังไม่มีวีดีโอ</h3>
          <p className="text-slate-500 mb-6">อัพโหลดวีดีโอแรกและเพิ่มคำถาม Interactive</p>
          <Link href="/teacher/videos/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors">
            <Plus size={18} /> เพิ่มวีดีโอแรก
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos?.map(video => {
            const classroom = video.classrooms as { name: string; cover_color: string }
            const qCount = (video.questions as { count: number }[])?.[0]?.count ?? 0
            return (
              <Card key={video.id} hover>
                <Link href={`/teacher/videos/${video.id}`}>
                  <div className="h-36 rounded-t-2xl bg-slate-100 flex items-center justify-center relative overflow-hidden"
                    style={classroom?.cover_color ? { background: `linear-gradient(135deg, ${classroom.cover_color}44, ${classroom.cover_color}22)` } : {}}>
                    <div className="w-14 h-14 bg-white/80 rounded-full flex items-center justify-center shadow-sm">
                      <Play size={24} className="text-violet-600 ml-1" fill="#7c3aed" />
                    </div>
                    <div className="absolute top-3 right-3">
                      {video.published ? <Badge variant="success">เผยแพร่แล้ว</Badge> : <Badge variant="warning">ฉบับร่าง</Badge>}
                    </div>
                  </div>
                  <CardContent className="pt-4">
                    <h3 className="font-semibold text-slate-900 truncate mb-2">{video.title}</h3>
                    <div className="flex items-center justify-between text-sm text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full inline-block" style={{ background: classroom?.cover_color || "#7c3aed" }} />
                        {classroom?.name}
                      </span>
                      <span>{qCount} คำถาม</span>
                    </div>
                    {video.duration && (
                      <p className="text-xs text-slate-400 mt-1">{formatDuration(video.duration)}</p>
                    )}
                  </CardContent>
                </Link>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
