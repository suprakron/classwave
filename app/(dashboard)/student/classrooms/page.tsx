"use client"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { BookOpen, Plus, Hash, Video, Users } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/toast"

interface Classroom {
  id: string
  name: string
  subject?: string
  cover_color: string
  class_code: string
  profiles?: { name: string }
  enrollments?: { count: number }[]
  videos?: { count: number }[]
}

export default function StudentClassroomsPage() {
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [showJoin, setShowJoin] = useState(false)
  const [code, setCode] = useState("")
  const [joining, setJoining] = useState(false)
  const [loading, setLoading] = useState(true)

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase
      .from("enrollments")
      .select("classrooms(id, name, subject, cover_color, class_code, profiles!classrooms_teacher_id_fkey(name), videos(count), enrollments(count))")
      .eq("student_id", user.id)
    setClassrooms(data?.map(e => e.classrooms as unknown as Classroom).filter(Boolean) || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!code.trim()) return
    setJoining(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setJoining(false); return }

    const { data: classroom } = await supabase
      .from("classrooms")
      .select("id, name, teacher_id")
      .eq("class_code", code.trim().toUpperCase())
      .single()

    if (!classroom) { toast.error("ไม่พบ Class Code นี้"); setJoining(false); return }

    const { data: existing } = await supabase
      .from("enrollments")
      .select("id")
      .eq("classroom_id", classroom.id)
      .eq("student_id", user.id)
      .single()

    if (existing) { toast.error("คุณเข้าร่วมห้องเรียนนี้แล้ว"); setJoining(false); return }

    const { error } = await supabase.from("enrollments").insert({ classroom_id: classroom.id, student_id: user.id })
    if (error) { toast.error("เกิดข้อผิดพลาด"); setJoining(false); return }

    toast.success(`เข้าร่วม "${classroom.name}" สำเร็จ!`)
    setShowJoin(false)
    setCode("")
    load()
    setJoining(false)
  }

  return (
    <div className="p-8 max-w-7xl animate-fade-in">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">ห้องเรียนของฉัน</h1>
          <p className="text-slate-500 text-sm mt-1">{classrooms.length} ห้องเรียน</p>
        </div>
        <Button onClick={() => setShowJoin(true)}>
          <Plus size={16} /> เข้าร่วมห้องเรียน
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full" /></div>
      ) : classrooms.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <BookOpen size={48} className="text-slate-200 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 mb-2">ยังไม่มีห้องเรียน</h3>
          <p className="text-slate-500 mb-6">กรอก Class Code จากครูเพื่อเริ่มเรียน</p>
          <Button onClick={() => setShowJoin(true)}>
            <Hash size={16} /> กรอก Class Code
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classrooms.map(c => {
            const videoCount = (c.videos as { count: number }[])?.[0]?.count ?? 0
            const studentCount = (c.enrollments as { count: number }[])?.[0]?.count ?? 0
            return (
              <Card key={c.id} hover>
                <Link href={`/student/classrooms/${c.id}`}>
                  <div className="h-24 rounded-t-2xl flex items-end p-4"
                    style={{ background: `linear-gradient(135deg, ${c.cover_color || "#7c3aed"}, ${c.cover_color || "#7c3aed"}aa)` }}>
                    <div className="text-white">
                      <p className="font-bold text-lg">{c.name}</p>
                      {c.subject && <p className="text-white/80 text-xs">{c.subject}</p>}
                    </div>
                  </div>
                  <CardContent className="pt-4">
                    {c.profiles?.name && (
                      <p className="text-xs text-slate-500 mb-3">ครู: {c.profiles.name}</p>
                    )}
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-slate-500 flex items-center gap-1"><Video size={13} /> {videoCount} วีดีโอ</span>
                      <span className="text-xs text-slate-500 flex items-center gap-1"><Users size={13} /> {studentCount} คน</span>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            )
          })}
        </div>
      )}

      {/* Join modal */}
      <Modal open={showJoin} onClose={() => setShowJoin(false)} title="เข้าร่วมห้องเรียน">
        <form onSubmit={handleJoin} className="flex flex-col gap-4">
          <div className="bg-violet-50 rounded-xl p-4 text-center">
            <Hash size={32} className="text-violet-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600">ขอ Class Code จากครูของคุณ แล้วกรอกด้านล่าง</p>
          </div>
          <Input
            label="Class Code"
            placeholder="เช่น ABC123"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            className="font-mono text-center text-2xl tracking-widest"
            maxLength={6}
            required
          />
          <div className="flex gap-3">
            <Button variant="outline" type="button" onClick={() => setShowJoin(false)} className="flex-1">ยกเลิก</Button>
            <Button type="submit" loading={joining} className="flex-1">เข้าร่วม</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
