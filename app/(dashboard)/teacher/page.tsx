import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { BookOpen, Video, Users, TrendingUp, Plus, Eye } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function TeacherDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()
  if (profile?.role !== "teacher") redirect("/student")

  const [{ count: classroomCount }, { count: videoCount }, { data: recentVideos }, { data: recentClassrooms }] = await Promise.all([
    supabase.from("classrooms").select("*", { count: "exact", head: true }).eq("teacher_id", user.id),
    supabase.from("videos").select("*", { count: "exact", head: true }).eq("teacher_id", user.id),
    supabase.from("videos").select("*, classrooms(name)").eq("teacher_id", user.id).order("created_at", { ascending: false }).limit(5),
    supabase.from("classrooms").select("*, enrollments(count)").eq("teacher_id", user.id).order("created_at", { ascending: false }).limit(4),
  ])

  const hour = new Date().getHours()
  const greeting = hour < 12 ? "สวัสดีตอนเช้า" : hour < 17 ? "สวัสดีตอนบ่าย" : "สวัสดีตอนเย็น"

  return (
    <div className="p-8 max-w-7xl animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-slate-500 text-sm mb-1">{greeting},</p>
          <h1 className="text-2xl font-bold text-slate-900">{profile?.name} 👋</h1>
        </div>
        <div className="flex gap-3">
          <Link href="/teacher/classrooms/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 shadow-sm transition-all">
            <Plus size={16} /> สร้างห้องเรียน
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "ห้องเรียน", value: classroomCount ?? 0, icon: <BookOpen size={20} />, color: "bg-violet-100 text-violet-600" },
          { label: "วีดีโอทั้งหมด", value: videoCount ?? 0, icon: <Video size={20} />, color: "bg-blue-100 text-blue-600" },
          { label: "นักเรียนรวม", value: recentClassrooms?.reduce((s, c) => s + ((c.enrollments as { count: number }[])?.[0]?.count ?? 0), 0) ?? 0, icon: <Users size={20} />, color: "bg-emerald-100 text-emerald-600" },
          { label: "วีดีโอที่เผยแพร่", value: recentVideos?.filter(v => v.published).length ?? 0, icon: <TrendingUp size={20} />, color: "bg-amber-100 text-amber-600" },
        ].map((s, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                  {s.icon}
                </div>
              </div>
              <p className="text-3xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent classrooms */}
        <Card>
          <div className="px-6 pt-6 pb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">ห้องเรียนล่าสุด</h2>
            <Link href="/teacher/classrooms" className="text-xs text-violet-600 hover:underline">ดูทั้งหมด</Link>
          </div>
          <CardContent className="pt-2">
            {recentClassrooms?.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen size={40} className="text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">ยังไม่มีห้องเรียน</p>
                <Link href="/teacher/classrooms/new" className="text-sm text-violet-600 hover:underline mt-1 block">
                  + สร้างห้องเรียนแรก
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {recentClassrooms?.map(c => (
                  <Link key={c.id} href={`/teacher/classrooms/${c.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                      style={{ background: c.cover_color || "#7c3aed" }}>
                      {c.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate group-hover:text-violet-600">{c.name}</p>
                      <p className="text-xs text-slate-400">{(c.enrollments as { count: number }[])?.[0]?.count ?? 0} นักเรียน</p>
                    </div>
                    <Badge variant="purple">{c.class_code}</Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent videos */}
        <Card>
          <div className="px-6 pt-6 pb-3 flex items-center justify-between">
            <h2 className="font-semibold text-slate-900">วีดีโอล่าสุด</h2>
            <Link href="/teacher/videos" className="text-xs text-violet-600 hover:underline">ดูทั้งหมด</Link>
          </div>
          <CardContent className="pt-2">
            {recentVideos?.length === 0 ? (
              <div className="text-center py-8">
                <Video size={40} className="text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-400">ยังไม่มีวีดีโอ</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentVideos?.map(v => (
                  <Link key={v.id} href={`/teacher/videos/${v.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
                      <Video size={18} className="text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 text-sm truncate group-hover:text-violet-600">{v.title}</p>
                      <p className="text-xs text-slate-400">{(v.classrooms as { name: string })?.name}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {v.published ? (
                        <Badge variant="success">เผยแพร่แล้ว</Badge>
                      ) : (
                        <Badge variant="warning">ฉบับร่าง</Badge>
                      )}
                      <Link href={`/teacher/videos/${v.id}/analytics`}
                        className="p-1.5 rounded-lg hover:bg-violet-100 text-slate-400 hover:text-violet-600 transition-colors">
                        <Eye size={14} />
                      </Link>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
