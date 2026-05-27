"use client"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Upload, X, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/toast"
import { useEffect } from "react"

export default function NewAssignmentPage() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  const [classrooms, setClassrooms] = useState<{ id: string; name: string; cover_color: string }[]>([])
  const [form, setForm] = useState({
    classroom_id: "", title: "", description: "", due_date: "",
  })
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from("classrooms").select("id, name, cover_color").eq("teacher_id", user.id)
      setClassrooms(data ?? [])
      if (data?.[0]) setForm(f => ({ ...f, classroom_id: data[0].id }))
    }
    load()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.classroom_id || !form.title.trim()) {
      toast.error("กรุณากรอกข้อมูลให้ครบ")
      return
    }
    setLoading(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any

      let fileUrl: string | null = null
      let fileName: string | null = null

      // Upload file if provided
      if (file) {
        const ext = file.name.split(".").pop()
        const path = `assignments/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { error: uploadErr } = await supabase.storage.from("classwave-files").upload(path, file)
        if (uploadErr) {
          toast.error("อัปโหลดไฟล์ไม่สำเร็จ: " + uploadErr.message)
          setLoading(false)
          return
        }
        const { data: urlData } = supabase.storage.from("classwave-files").getPublicUrl(path)
        fileUrl = urlData.publicUrl
        fileName = file.name
      }

      const { error } = await db.from("assignments").insert({
        classroom_id: form.classroom_id,
        teacher_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        due_date: form.due_date || null,
        file_url: fileUrl,
        file_name: fileName,
      })

      if (error) throw error
      toast.error("") // clear
      router.push("/teacher/assignments")
      router.refresh()
    } catch (err: unknown) {
      toast.error("เกิดข้อผิดพลาด: " + (err instanceof Error ? err.message : "unknown"))
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 p-6 overflow-auto" style={{ background: "#FFF0F0" }}>
      <Link href="/teacher/assignments"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-rose-500 mb-6 transition-colors">
        <ArrowLeft size={15} /> กลับ
      </Link>

      <div className="max-w-2xl">
        <h1 className="text-2xl font-black text-slate-900 mb-1">สร้างใบงาน</h1>
        <p className="text-sm text-slate-500 mb-6">มอบหมายงานให้นักเรียนในห้องเรียน</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-sm space-y-5">
          {/* Classroom */}
          <div>
            <label className="block text-sm font-black text-slate-700 mb-2">ห้องเรียน *</label>
            <select
              value={form.classroom_id}
              onChange={e => setForm(f => ({ ...f, classroom_id: e.target.value }))}
              required
              className="w-full rounded-2xl border-2 border-rose-100 px-4 py-3 text-sm font-semibold focus:outline-none focus:border-rose-400 bg-white"
            >
              {classrooms.length === 0 && <option value="">ยังไม่มีห้องเรียน</option>}
              {classrooms.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-black text-slate-700 mb-2">ชื่อใบงาน *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="เช่น ใบงานที่ 1: โมลและมวลโมลาร์"
              required
              className="w-full rounded-2xl border-2 border-rose-100 px-4 py-3 text-sm focus:outline-none focus:border-rose-400"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-black text-slate-700 mb-2">คำอธิบาย / คำสั่ง</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="อธิบายรายละเอียดใบงาน คำสั่ง หรือวิธีส่งงาน..."
              rows={4}
              className="w-full rounded-2xl border-2 border-rose-100 px-4 py-3 text-sm focus:outline-none focus:border-rose-400 resize-none"
            />
          </div>

          {/* Due date */}
          <div>
            <label className="block text-sm font-black text-slate-700 mb-2">กำหนดส่ง</label>
            <input
              type="datetime-local"
              value={form.due_date}
              onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
              className="w-full rounded-2xl border-2 border-rose-100 px-4 py-3 text-sm focus:outline-none focus:border-rose-400"
            />
          </div>

          {/* File attachment */}
          <div>
            <label className="block text-sm font-black text-slate-700 mb-2">แนบไฟล์ใบงาน (optional)</label>
            <input ref={fileRef} type="file" className="hidden"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              onChange={e => setFile(e.target.files?.[0] ?? null)} />
            {file ? (
              <div className="flex items-center gap-3 p-3 rounded-2xl border-2 border-rose-200"
                style={{ background: "#FFF0F0" }}>
                <span className="text-xl">📄</span>
                <span className="flex-1 text-sm font-semibold text-slate-700 truncate">{file.name}</span>
                <button type="button" onClick={() => setFile(null)}
                  className="text-slate-400 hover:text-red-500 transition-colors">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => fileRef.current?.click()}
                className="w-full flex flex-col items-center gap-2 p-6 rounded-2xl border-2 border-dashed border-rose-200 hover:border-rose-400 transition-colors text-slate-500">
                <Upload size={24} className="text-rose-300" />
                <span className="text-sm font-semibold">คลิกเพื่ออัปโหลดไฟล์</span>
                <span className="text-xs text-slate-400">PDF, DOC, PNG, JPG</span>
              </button>
            )}
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <Link href="/teacher/assignments"
              className="flex-1 py-3 rounded-2xl text-center font-bold text-slate-600 border-2 border-slate-200 hover:bg-slate-50 transition-colors text-sm">
              ยกเลิก
            </Link>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ background: "#E53935" }}>
              {loading ? <><Loader2 size={16} className="animate-spin" /> กำลังบันทึก...</> : "📋 สร้างใบงาน"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
