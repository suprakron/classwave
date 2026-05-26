import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { BookOpen, Plus, Users, Video } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CopyButton } from "@/components/ui/copy-button"

export default async function TeacherClassroomsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: classrooms } = await supabase
    .from("classrooms")
    .select("*, enrollments(count), videos(count)")
    .eq("teacher_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="p-8 max-w-7xl animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ห้องเรียนทั้งหมด</h1>
          <p className="text-slate-500 text-sm mt-1">จัดการห้องเรียนและนักเรียนของคุณ</p>
        </div>
        <Link href="/teacher/classrooms/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 shadow-sm transition-all">
          <Plus size={16} /> สร้างห้องเรียนใหม่
        </Link>
      </div>

      {classrooms?.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen size={36} className="text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">ยังไม่มีห้องเรียน</h3>
          <p className="text-slate-500 mb-6">สร้างห้องเรียนแรกของคุณและเริ่มสอน</p>
          <Link href="/teacher/classrooms/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-600 text-white rounded-xl font-medium hover:bg-violet-700 transition-colors">
            <Plus size={18} /> สร้างห้องเรียนแรก
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classrooms?.map(classroom => {
            const studentCount = (classroom.enrollments as { count: number }[])?.[0]?.count ?? 0
            const videoCount = (classroom.videos as { count: number }[])?.[0]?.count ?? 0
            return (
              <Card key={classroom.id} hover>
                <Link href={`/teacher/classrooms/${classroom.id}`}>
                  {/* Cover */}
                  <div className="h-24 rounded-t-2xl flex items-end p-4"
                    style={{ background: `linear-gradient(135deg, ${classroom.cover_color || "#7c3aed"}, ${classroom.cover_color || "#7c3aed"}aa)` }}>
                    <div className="text-white">
                      <p className="font-bold text-lg leading-tight">{classroom.name}</p>
                      {classroom.subject && <p className="text-white/80 text-xs">{classroom.subject}</p>}
                    </div>
                  </div>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Users size={15} /> {studentCount} นักเรียน
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <Video size={15} /> {videoCount} วีดีโอ
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">Class Code:</span>
                        <Badge variant="purple" className="font-mono tracking-wider">{classroom.class_code}</Badge>
                      </div>
                      <CopyButton text={classroom.class_code} />
                    </div>
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
