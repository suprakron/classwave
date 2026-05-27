"use client"
import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Upload, X, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/toast"

export function SubmitForm({ assignmentId, studentId }: { assignmentId: string; studentId: string }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [note, setNote] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!note.trim() && !file) { toast.error("กรุณาแนบไฟล์หรือเขียนหมายเหตุ"); return }
    setLoading(true)
    try {
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any

      let fileUrl: string | null = null
      let fileName: string | null = null
      if (file) {
        const ext = file.name.split(".").pop()
        const path = `submissions/${studentId}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from("classwave-files").upload(path, file)
        if (upErr) { toast.error("อัปโหลดไฟล์ไม่สำเร็จ: " + upErr.message); setLoading(false); return }
        const { data: urlData } = supabase.storage.from("classwave-files").getPublicUrl(path)
        fileUrl = urlData.publicUrl
        fileName = file.name
      }

      const { error } = await db.from("assignment_submissions").insert({
        assignment_id: assignmentId,
        student_id: studentId,
        note: note.trim() || null,
        file_url: fileUrl,
        file_name: fileName,
      })
      if (error) throw error
      router.refresh()
    } catch (err: unknown) {
      toast.error("เกิดข้อผิดพลาด: " + (err instanceof Error ? err.message : "unknown"))
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 shadow-sm">
      <h2 className="font-black text-slate-900 mb-4 flex items-center gap-2">
        <Upload size={18} className="text-rose-400" /> ส่งงาน
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-black text-slate-600 mb-1.5">หมายเหตุ / คำอธิบาย</label>
          <textarea value={note} onChange={e => setNote(e.target.value)}
            placeholder="เขียนหมายเหตุหรือคำอธิบายงานของคุณ..."
            rows={3}
            className="w-full rounded-2xl border-2 border-rose-100 px-4 py-3 text-sm resize-none focus:outline-none focus:border-rose-400" />
        </div>

        <div>
          <label className="block text-xs font-black text-slate-600 mb-1.5">แนบไฟล์งาน</label>
          <input ref={fileRef} type="file" className="hidden"
            accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
            onChange={e => setFile(e.target.files?.[0] ?? null)} />
          {file ? (
            <div className="flex items-center gap-3 p-3 rounded-2xl border-2 border-rose-200"
              style={{ background: "#FFF0F0" }}>
              <span className="text-xl">📄</span>
              <span className="flex-1 text-sm font-semibold text-slate-700 truncate">{file.name}</span>
              <button type="button" onClick={() => setFile(null)} className="text-slate-400 hover:text-red-500">
                <X size={16} />
              </button>
            </div>
          ) : (
            <button type="button" onClick={() => fileRef.current?.click()}
              className="w-full flex flex-col items-center gap-2 p-5 rounded-2xl border-2 border-dashed border-rose-200 hover:border-rose-400 transition-colors text-slate-500">
              <Upload size={22} className="text-rose-300" />
              <span className="text-sm font-semibold">คลิกเพื่ออัปโหลดไฟล์งาน</span>
              <span className="text-xs text-slate-400">PDF, DOC, PNG, JPG, ZIP</span>
            </button>
          )}
        </div>
      </div>

      <button type="submit" disabled={loading}
        className="w-full mt-5 py-3 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
        style={{ background: "#E53935" }}>
        {loading ? <><Loader2 size={16} className="animate-spin" /> กำลังส่ง...</> : "📤 ส่งงาน"}
      </button>
    </form>
  )
}
