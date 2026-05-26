"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/toast"
import { generateClassCode } from "@/lib/utils"
import { ArrowLeft, BookOpen } from "lucide-react"
import Link from "next/link"

const COLORS = [
  "#7c3aed", "#2563eb", "#059669", "#d97706", "#dc2626",
  "#7c3aed80", "#0891b2", "#65a30d", "#e11d48", "#4f46e5",
]

export default function NewClassroomPage() {
  const router = useRouter()
  const [name, setName] = useState("")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [color, setColor] = useState(COLORS[0])
  const [loading, setLoading] = useState(false)

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error("กรุณาระบุชื่อห้องเรียน"); return }
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    const classCode = generateClassCode()
    const { data, error } = await supabase.from("classrooms").insert({
      teacher_id: user.id,
      name: name.trim(),
      subject: subject.trim() || null,
      description: description.trim() || null,
      class_code: classCode,
      cover_color: color,
    }).select().single()

    if (error) { toast.error("เกิดข้อผิดพลาด: " + error.message); setLoading(false); return }
    toast.success("สร้างห้องเรียนสำเร็จ!")
    router.push(`/teacher/classrooms/${data.id}`)
  }

  return (
    <div className="p-8 max-w-2xl animate-fade-in">
      <Link href="/teacher/classrooms" className="flex items-center gap-2 text-sm text-slate-500 hover:text-violet-600 mb-6 transition-colors">
        <ArrowLeft size={16} /> กลับ
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
          <BookOpen size={24} className="text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">สร้างห้องเรียนใหม่</h1>
          <p className="text-slate-500 text-sm">ตั้งค่าห้องเรียนของคุณ</p>
        </div>
      </div>

      {/* Preview */}
      <div className="h-28 rounded-2xl flex items-end p-5 mb-6 transition-all"
        style={{ background: `linear-gradient(135deg, ${color}, ${color}aa)` }}>
        <div className="text-white">
          <p className="font-bold text-xl">{name || "ชื่อห้องเรียน"}</p>
          {subject && <p className="text-white/80 text-sm">{subject}</p>}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <form onSubmit={handleCreate} className="flex flex-col gap-5">
          <Input label="ชื่อห้องเรียน *" placeholder="เช่น คณิตศาสตร์ ม.4/1" value={name} onChange={e => setName(e.target.value)} required />
          <Input label="วิชา (ไม่บังคับ)" placeholder="เช่น คณิตศาสตร์" value={subject} onChange={e => setSubject(e.target.value)} />
          <Textarea label="คำอธิบาย (ไม่บังคับ)" placeholder="อธิบายห้องเรียนนี้..." value={description} onChange={e => setDescription(e.target.value)} />

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">สีพื้นหลัง</label>
            <div className="flex gap-3 flex-wrap">
              {COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  className={`w-9 h-9 rounded-xl transition-transform hover:scale-110 ${color === c ? "ring-2 ring-offset-2 ring-slate-400 scale-110" : ""}`}
                  style={{ background: c }} />
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Link href="/teacher/classrooms" className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium text-center hover:bg-slate-50 transition-colors">
              ยกเลิก
            </Link>
            <Button type="submit" loading={loading} className="flex-1">
              สร้างห้องเรียน
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
