"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/toast"
import { Loader2 } from "lucide-react"

interface Props {
  submissionId: string
  currentScore?: number
  currentFeedback?: string
}

export function GradeForm({ submissionId, currentScore, currentFeedback }: Props) {
  const [score, setScore] = useState(currentScore?.toString() ?? "")
  const [feedback, setFeedback] = useState(currentFeedback ?? "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createClient() as any
    const { error } = await db.from("assignment_submissions").update({
      score: score === "" ? null : Number(score),
      feedback: feedback.trim() || null,
      graded_at: new Date().toISOString(),
    }).eq("id", submissionId)
    setSaving(false)
    if (error) { toast.error("บันทึกไม่สำเร็จ"); return }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="mt-3 p-4 rounded-2xl border-2 border-rose-100" style={{ background: "#FFFDE7" }}>
      <p className="text-xs font-black text-slate-600 mb-2">ตรวจงาน</p>
      <div className="flex gap-2 mb-2">
        <input
          type="number" min="0" max="100" placeholder="คะแนน"
          value={score} onChange={e => setScore(e.target.value)}
          className="w-24 rounded-xl border-2 border-yellow-200 px-3 py-1.5 text-sm font-bold focus:outline-none focus:border-yellow-400"
        />
        <span className="text-xs text-slate-400 self-center">/ 100</span>
      </div>
      <textarea
        value={feedback} onChange={e => setFeedback(e.target.value)}
        placeholder="ความคิดเห็น / Feedback (optional)..."
        rows={2}
        className="w-full rounded-xl border-2 border-yellow-200 px-3 py-2 text-sm resize-none focus:outline-none focus:border-yellow-400 mb-2"
      />
      <button onClick={save} disabled={saving}
        className="px-4 py-1.5 rounded-full text-white text-xs font-bold flex items-center gap-1.5 hover:opacity-90 transition-opacity disabled:opacity-60"
        style={{ background: saving ? "#9CA3AF" : saved ? "#2E7D32" : "#F59E0B" }}>
        {saving ? <><Loader2 size={12} className="animate-spin" /> กำลังบันทึก...</>
          : saved ? "✅ บันทึกแล้ว"
          : "💾 บันทึกคะแนน"}
      </button>
    </div>
  )
}
