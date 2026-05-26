"use client"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Modal } from "@/components/ui/modal"
import { toast } from "@/components/ui/toast"
import { Plus, Trash2, Edit3, Play, Clock, CheckCircle, Upload, FileText } from "lucide-react"
import { getYouTubeId, formatDuration } from "@/lib/utils"
import type { Video, Question } from "@/lib/types"
import Link from "next/link"
import { QuestionImporter } from "@/components/video/question-importer"

interface Props {
  video: Video & { classrooms: { id: string; name: string; cover_color: string } }
  initialQuestions: Question[]
}

const emptyQuestion = (): Partial<Question> => ({
  timestamp_seconds: 0,
  question_text: "",
  question_type: "multiple_choice",
  options: ["", "", "", ""],
  correct_answer: "",
  explanation: "",
})

export function VideoEditClient({ video, initialQuestions }: Props) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions)
  const [published, setPublished] = useState(video.published)
  const [saving, setSaving] = useState(false)
  const [showQModal, setShowQModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [editingQ, setEditingQ] = useState<Partial<Question>>(emptyQuestion())
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  const ytId = video.video_type === "youtube" && video.video_url ? getYouTubeId(video.video_url) : null

  async function togglePublish() {
    setSaving(true)
    const supabase = createClient()
    const newVal = !published
    const { error } = await supabase.from("videos").update({ published: newVal }).eq("id", video.id)
    if (error) { toast.error("เกิดข้อผิดพลาด"); setSaving(false); return }
    setPublished(newVal)
    toast.success(newVal ? "เผยแพร่วีดีโอแล้ว!" : "ยกเลิกการเผยแพร่แล้ว")
    setSaving(false)
  }

  function openNewQuestion() {
    setEditingQ(emptyQuestion())
    setEditingIndex(null)
    setShowQModal(true)
  }

  function openEditQuestion(q: Question, idx: number) {
    setEditingQ({ ...q })
    setEditingIndex(idx)
    setShowQModal(true)
  }

  function parseTimeInput(val: string): number {
    const parts = val.split(":").map(Number)
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2]
    if (parts.length === 2) return parts[0] * 60 + parts[1]
    return Number(val) || 0
  }

  async function saveQuestion() {
    if (!editingQ.question_text?.trim()) { toast.error("กรุณาระบุข้อคำถาม"); return }
    if (!editingQ.correct_answer?.trim()) { toast.error("กรุณาระบุคำตอบที่ถูก"); return }
    if (editingQ.question_type === "multiple_choice") {
      const filled = editingQ.options?.filter(o => o.trim()) || []
      if (filled.length < 2) { toast.error("กรุณาระบุตัวเลือกอย่างน้อย 2 ข้อ"); return }
      if (!editingQ.options?.includes(editingQ.correct_answer || "")) { toast.error("คำตอบที่ถูกต้องต้องตรงกับตัวเลือกที่มี"); return }
    }

    const supabase = createClient()
    const payload = {
      video_id: video.id,
      timestamp_seconds: editingQ.timestamp_seconds ?? 0,
      question_text: editingQ.question_text!.trim(),
      question_type: editingQ.question_type!,
      options: editingQ.question_type === "true_false" ? ["ถูก", "ผิด"] : (editingQ.options?.filter(o => o.trim()) || []),
      correct_answer: editingQ.correct_answer!.trim(),
      order_index: editingIndex !== null ? questions[editingIndex].order_index : questions.length,
      explanation: editingQ.explanation?.trim() || undefined,
    }

    if (editingIndex !== null) {
      const { error } = await supabase.from("questions").update(payload).eq("id", questions[editingIndex].id)
      if (error) { toast.error("แก้ไขคำถามไม่สำเร็จ"); return }
      const updated = [...questions]
      updated[editingIndex] = { ...questions[editingIndex], ...payload }
      setQuestions(updated)
      toast.success("แก้ไขคำถามสำเร็จ")
    } else {
      const { data, error } = await supabase.from("questions").insert(payload).select().single()
      if (error) { toast.error("เพิ่มคำถามไม่สำเร็จ"); return }
      setQuestions(prev => [...prev, data].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds))
      toast.success("เพิ่มคำถามสำเร็จ")
    }
    setShowQModal(false)
  }

  async function deleteQuestion(q: Question) {
    if (!confirm("ลบคำถามนี้?")) return
    const supabase = createClient()
    await supabase.from("questions").delete().eq("id", q.id)
    setQuestions(prev => prev.filter(x => x.id !== q.id))
    toast.success("ลบคำถามแล้ว")
  }

  function handleImported(imported: Omit<Question, "id" | "video_id">[]) {
    setShowImportModal(false)
    // Reload questions after import
    const supabase = createClient()
    supabase.from("questions").select("*").eq("video_id", video.id).order("timestamp_seconds")
      .then(({ data }) => { if (data) setQuestions(data) })
    toast.success(`นำเข้า ${imported.length} คำถามสำเร็จ!`)
  }

  return (
    <div>
      {/* Video header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-slate-900">{video.title}</h1>
            {published ? <Badge variant="success">เผยแพร่แล้ว</Badge> : <Badge variant="warning">ฉบับร่าง</Badge>}
          </div>
          <p className="text-slate-500 text-sm flex items-center gap-2">
            <span className="w-3 h-3 rounded-full inline-block" style={{ background: video.classrooms?.cover_color || "#7c3aed" }} />
            {video.classrooms?.name}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={`/teacher/videos/${video.id}/analytics`}
            className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-50 transition-colors">
            Analytics
          </Link>
          <Button variant={published ? "outline" : "primary"} onClick={togglePublish} loading={saving}>
            {published ? "ยกเลิกการเผยแพร่" : "เผยแพร่วีดีโอ"}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        {/* Video preview */}
        <div className="lg:col-span-3">
          <div className="bg-black rounded-2xl overflow-hidden aspect-video">
            {ytId ? (
              <iframe src={`https://www.youtube.com/embed/${ytId}`} className="w-full h-full" allowFullScreen />
            ) : video.video_url ? (
              <video src={video.video_url} controls className="w-full h-full" />
            ) : (
              <div className="flex items-center justify-center h-full text-slate-500">
                <Play size={48} className="opacity-30" />
              </div>
            )}
          </div>

          {video.description && (
            <div className="mt-4 p-4 bg-white rounded-xl border border-slate-100">
              <p className="text-sm text-slate-600">{video.description}</p>
            </div>
          )}
        </div>

        {/* Questions panel */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900">คำถาม ({questions.length})</h2>
              <div className="flex gap-2">
                <button onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 transition-colors">
                  <Upload size={13} /> นำเข้าไฟล์
                </button>
                <button onClick={openNewQuestion}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-colors">
                  <Plus size={13} /> เพิ่มคำถาม
                </button>
              </div>
            </div>

            {questions.length === 0 ? (
              <div className="p-8 text-center">
                <FileText size={36} className="text-slate-200 mx-auto mb-3" />
                <p className="text-sm text-slate-500 mb-1">ยังไม่มีคำถาม</p>
                <p className="text-xs text-slate-400">เพิ่มคำถามหรือนำเข้าจาก Word/PDF</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-50 max-h-96 overflow-y-auto">
                {questions.map((q, i) => (
                  <div key={q.id} className="px-5 py-3 flex items-start gap-3 group hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-lg shrink-0 font-mono">
                      <Clock size={11} />{formatDuration(q.timestamp_seconds)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 font-medium line-clamp-2">{q.question_text}</p>
                      <p className="text-xs text-emerald-600 mt-0.5 flex items-center gap-1">
                        <CheckCircle size={11} /> {q.correct_answer}
                      </p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <button onClick={() => openEditQuestion(q, i)} className="p-1.5 rounded-lg hover:bg-violet-100 text-slate-400 hover:text-violet-600">
                        <Edit3 size={14} />
                      </button>
                      <button onClick={() => deleteQuestion(q)} className="p-1.5 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Question modal */}
      <Modal open={showQModal} onClose={() => setShowQModal(false)} title={editingIndex !== null ? "แก้ไขคำถาม" : "เพิ่มคำถามใหม่"} size="lg">
        <div className="flex flex-col gap-4 max-h-[70vh] overflow-y-auto pr-1">
          {/* Timestamp */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-1.5 block">
              เวลาที่จะแสดงคำถาม (นาที:วินาที หรือ ชม:นาที:วินาที)
            </label>
            <input
              type="text"
              placeholder="เช่น 1:30 หรือ 90 (วินาที)"
              defaultValue={editingQ.timestamp_seconds ? formatDuration(editingQ.timestamp_seconds) : ""}
              onBlur={e => setEditingQ(q => ({ ...q, timestamp_seconds: parseTimeInput(e.target.value) }))}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent font-mono"
            />
          </div>

          {/* Question type */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">ประเภทคำถาม</label>
            <div className="flex gap-3">
              {[
                { value: "multiple_choice" as const, label: "หลายตัวเลือก" },
                { value: "true_false" as const, label: "ถูก/ผิด" },
              ].map(t => (
                <button key={t.value} type="button"
                  onClick={() => setEditingQ(q => ({ ...q, question_type: t.value, options: t.value === "true_false" ? ["ถูก", "ผิด"] : ["", "", "", ""] }))}
                  className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${editingQ.question_type === t.value ? "border-violet-500 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-500"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <Textarea
            label="ข้อคำถาม *"
            placeholder="พิมพ์คำถามที่นี่..."
            value={editingQ.question_text || ""}
            onChange={e => setEditingQ(q => ({ ...q, question_text: e.target.value }))}
          />

          {/* Options */}
          {editingQ.question_type === "multiple_choice" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-slate-700">ตัวเลือก</label>
                {(editingQ.options?.length || 0) < 6 && (
                  <button type="button" onClick={() => setEditingQ(q => ({ ...q, options: [...(q.options || []), ""] }))}
                    className="text-xs text-violet-600 hover:underline">+ เพิ่มตัวเลือก</button>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {(editingQ.options || []).map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-400 w-5 shrink-0">{String.fromCharCode(65 + oi)}.</span>
                    <input
                      type="text"
                      placeholder={`ตัวเลือก ${String.fromCharCode(65 + oi)}`}
                      value={opt}
                      onChange={e => {
                        const opts = [...(editingQ.options || [])]
                        opts[oi] = e.target.value
                        setEditingQ(q => ({ ...q, options: opts }))
                      }}
                      className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                    />
                    <button type="button" onClick={() => {
                      const opts = editingQ.options?.filter((_, i) => i !== oi) || []
                      setEditingQ(q => ({ ...q, options: opts }))
                    }} className="p-1.5 text-slate-300 hover:text-red-400 rounded-lg hover:bg-red-50">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Correct answer */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">คำตอบที่ถูกต้อง *</label>
            {editingQ.question_type === "multiple_choice" ? (
              <div className="flex flex-col gap-1.5">
                {(editingQ.options || []).filter(o => o.trim()).map((opt, oi) => (
                  <label key={oi} className={`flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer transition-colors ${editingQ.correct_answer === opt ? "bg-emerald-50 border-2 border-emerald-400" : "bg-slate-50 border-2 border-transparent hover:border-slate-200"}`}>
                    <input type="radio" name="correct" checked={editingQ.correct_answer === opt}
                      onChange={() => setEditingQ(q => ({ ...q, correct_answer: opt }))} className="accent-emerald-500" />
                    <span className="text-sm text-slate-700">{opt}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="flex gap-3">
                {["ถูก", "ผิด"].map(v => (
                  <label key={v} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl cursor-pointer transition-colors ${editingQ.correct_answer === v ? "bg-emerald-50 border-2 border-emerald-400 text-emerald-700 font-medium" : "bg-slate-50 border-2 border-transparent text-slate-600 hover:border-slate-200"}`}>
                    <input type="radio" name="correct" checked={editingQ.correct_answer === v}
                      onChange={() => setEditingQ(q => ({ ...q, correct_answer: v }))} className="accent-emerald-500" />
                    {v}
                  </label>
                ))}
              </div>
            )}
          </div>

          <Textarea
            label="คำอธิบายเฉลย (ไม่บังคับ)"
            placeholder="อธิบายเหตุผลของคำตอบที่ถูกต้อง..."
            value={editingQ.explanation || ""}
            onChange={e => setEditingQ(q => ({ ...q, explanation: e.target.value }))}
          />

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowQModal(false)} className="flex-1">ยกเลิก</Button>
            <Button onClick={saveQuestion} className="flex-1">บันทึกคำถาม</Button>
          </div>
        </div>
      </Modal>

      {/* Import modal */}
      <Modal open={showImportModal} onClose={() => setShowImportModal(false)} title="นำเข้าคำถามจากไฟล์" size="xl">
        <QuestionImporter videoId={video.id} onImported={handleImported} onClose={() => setShowImportModal(false)} />
      </Modal>
    </div>
  )
}
