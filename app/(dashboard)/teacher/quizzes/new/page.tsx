"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2, Loader2, ChevronDown, ChevronUp } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/components/ui/toast"

interface QuizQuestion {
  question_text: string
  options: [string, string, string, string]
  correct_answer: string
  explanation: string
}

const blankQuestion = (): QuizQuestion => ({
  question_text: "",
  options: ["", "", "", ""],
  correct_answer: "",
  explanation: "",
})

export default function NewQuizPage() {
  const router = useRouter()
  const [classrooms, setClassrooms] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({ classroom_id: "", title: "", description: "", due_date: "", time_limit: "" })
  const [questions, setQuestions] = useState<QuizQuestion[]>([blankQuestion()])
  const [openIdx, setOpenIdx] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from("classrooms").select("id, name").eq("teacher_id", user.id)
      setClassrooms(data ?? [])
      if (data?.[0]) setForm(f => ({ ...f, classroom_id: data[0].id }))
    }
    load()
  }, [])

  function updateQ(idx: number, patch: Partial<QuizQuestion>) {
    setQuestions(qs => qs.map((q, i) => i === idx ? { ...q, ...patch } : q))
  }

  function updateOption(qIdx: number, optIdx: number, value: string) {
    setQuestions(qs => qs.map((q, i) => {
      if (i !== qIdx) return q
      const opts = [...q.options] as [string, string, string, string]
      opts[optIdx] = value
      return { ...q, options: opts }
    }))
  }

  function addQuestion() {
    setQuestions(qs => [...qs, blankQuestion()])
    setOpenIdx(questions.length)
  }

  function removeQuestion(idx: number) {
    if (questions.length === 1) { toast.error("ต้องมีอย่างน้อย 1 คำถาม"); return }
    setQuestions(qs => qs.filter((_, i) => i !== idx))
    setOpenIdx(Math.max(0, idx - 1))
  }

  async function handleSubmit(e: React.FormEvent, publish: boolean) {
    e.preventDefault()
    if (!form.classroom_id || !form.title.trim()) { toast.error("กรุณาเลือกห้องเรียนและใส่ชื่อ"); return }
    for (const [i, q] of questions.entries()) {
      if (!q.question_text.trim()) { toast.error(`คำถามที่ ${i + 1}: กรุณาใส่ข้อความ`); setOpenIdx(i); return }
      if (q.options.some(o => !o.trim())) { toast.error(`คำถามที่ ${i + 1}: กรุณาใส่ตัวเลือกให้ครบ`); setOpenIdx(i); return }
      if (!q.correct_answer) { toast.error(`คำถามที่ ${i + 1}: กรุณาเลือกคำตอบที่ถูก`); setOpenIdx(i); return }
    }
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const db = supabase as any

      const { data: quiz, error: qErr } = await db.from("quizzes").insert({
        classroom_id: form.classroom_id, teacher_id: user.id,
        title: form.title.trim(),
        description: form.description.trim() || null,
        due_date: form.due_date || null,
        time_limit: form.time_limit ? Number(form.time_limit) : null,
        published: publish,
      }).select().single()
      if (qErr) throw qErr

      const qqs = questions.map((q, i) => ({
        quiz_id: quiz.id,
        question_text: q.question_text.trim(),
        options: q.options,
        correct_answer: q.correct_answer,
        explanation: q.explanation.trim() || null,
        order_index: i,
      }))
      const { error: qqErr } = await db.from("quiz_questions").insert(qqs)
      if (qqErr) throw qqErr

      router.push("/teacher/quizzes")
      router.refresh()
    } catch (err: unknown) {
      toast.error("เกิดข้อผิดพลาด: " + (err instanceof Error ? err.message : "unknown"))
      setLoading(false)
    }
  }

  const optionLabels = ["A", "B", "C", "D"]

  return (
    <div className="flex-1 p-6 overflow-auto" style={{ background: "#FFF0F0" }}>
      <Link href="/teacher/quizzes"
        className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-rose-500 mb-6 transition-colors">
        <ArrowLeft size={15} /> กลับ
      </Link>

      <div className="max-w-3xl">
        <h1 className="text-2xl font-black text-slate-900 mb-1">สร้างแบบทดสอบ</h1>
        <p className="text-sm text-slate-500 mb-6">เพิ่มคำถามเคมีและกำหนดตัวเลือก</p>

        {/* Basic info */}
        <div className="bg-white rounded-3xl p-6 shadow-sm mb-4 space-y-4">
          <h2 className="font-black text-slate-800 flex items-center gap-2">📝 ข้อมูลแบบทดสอบ</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-600 mb-1.5">ห้องเรียน *</label>
              <select value={form.classroom_id} onChange={e => setForm(f => ({ ...f, classroom_id: e.target.value }))} required
                className="w-full rounded-2xl border-2 border-rose-100 px-3 py-2.5 text-sm font-semibold focus:outline-none focus:border-rose-400">
                {classrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-black text-slate-600 mb-1.5">จำกัดเวลา (นาที)</label>
              <input type="number" min="1" placeholder="ไม่จำกัด" value={form.time_limit}
                onChange={e => setForm(f => ({ ...f, time_limit: e.target.value }))}
                className="w-full rounded-2xl border-2 border-rose-100 px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-slate-600 mb-1.5">ชื่อแบบทดสอบ *</label>
            <input type="text" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
              placeholder="เช่น แบบทดสอบ: โมลและมวลโมลาร์"
              className="w-full rounded-2xl border-2 border-rose-100 px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black text-slate-600 mb-1.5">คำอธิบาย</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                rows={2} placeholder="คำอธิบายแบบทดสอบ..."
                className="w-full rounded-2xl border-2 border-rose-100 px-3 py-2.5 text-sm resize-none focus:outline-none focus:border-rose-400" />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-600 mb-1.5">กำหนดทำ</label>
              <input type="datetime-local" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="w-full rounded-2xl border-2 border-rose-100 px-3 py-2.5 text-sm focus:outline-none focus:border-rose-400" />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-3 mb-4">
          {questions.map((q, idx) => (
            <div key={idx} className="bg-white rounded-3xl shadow-sm overflow-hidden">
              {/* Question header */}
              <button type="button" onClick={() => setOpenIdx(openIdx === idx ? -1 : idx)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                    style={{ background: "#E53935" }}>{idx + 1}</span>
                  <span className="text-sm font-bold text-slate-700 truncate">
                    {q.question_text || `คำถามที่ ${idx + 1}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button type="button" onClick={e => { e.stopPropagation(); removeQuestion(idx) }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 size={14} />
                  </button>
                  {openIdx === idx ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </div>
              </button>

              {openIdx === idx && (
                <div className="px-5 pb-5 space-y-4 border-t border-slate-50">
                  {/* Question text */}
                  <div className="pt-4">
                    <label className="block text-xs font-black text-slate-600 mb-1.5">⚗️ โจทย์ / คำถาม *</label>
                    <textarea value={q.question_text} onChange={e => updateQ(idx, { question_text: e.target.value })}
                      rows={2} placeholder="พิมพ์คำถามเคมีที่นี่..."
                      className="w-full rounded-2xl border-2 border-rose-100 px-4 py-3 text-sm resize-none focus:outline-none focus:border-rose-400" />
                  </div>

                  {/* Options */}
                  <div>
                    <label className="block text-xs font-black text-slate-600 mb-2">ตัวเลือก * (เลือกข้อที่ถูก)</label>
                    <div className="space-y-2">
                      {q.options.map((opt, oi) => (
                        <div key={oi} className="flex items-center gap-2">
                          <button type="button" onClick={() => updateQ(idx, { correct_answer: opt || `option_${oi}` })}
                            className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black transition-all ${
                              q.correct_answer === opt && opt
                                ? "text-white shadow-sm"
                                : "border-2 text-slate-500"
                            }`}
                            style={q.correct_answer === opt && opt
                              ? { background: "#2E7D32" }
                              : { borderColor: "#D1D5DB" }}>
                            {optionLabels[oi]}
                          </button>
                          <input value={opt} onChange={e => {
                            const newVal = e.target.value
                            updateOption(idx, oi, newVal)
                            if (q.correct_answer === opt) updateQ(idx, { correct_answer: newVal })
                          }}
                            placeholder={`ตัวเลือก ${optionLabels[oi]}`}
                            className={`flex-1 rounded-xl border-2 px-3 py-2 text-sm focus:outline-none transition-colors ${
                              q.correct_answer === opt && opt
                                ? "border-green-400 bg-green-50 font-semibold"
                                : "border-slate-200 focus:border-rose-300"
                            }`} />
                        </div>
                      ))}
                    </div>
                    {q.correct_answer && (
                      <p className="text-xs mt-2 font-semibold" style={{ color: "#2E7D32" }}>
                        ✅ คำตอบที่ถูก: {q.correct_answer}
                      </p>
                    )}
                  </div>

                  {/* Explanation */}
                  <div>
                    <label className="block text-xs font-black text-slate-600 mb-1.5">💡 คำอธิบายเฉลย (optional)</label>
                    <textarea value={q.explanation} onChange={e => updateQ(idx, { explanation: e.target.value })}
                      rows={2} placeholder="อธิบายคำตอบที่ถูกต้อง..."
                      className="w-full rounded-2xl border-2 border-slate-200 px-4 py-3 text-sm resize-none focus:outline-none focus:border-green-300" />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add question */}
        <button type="button" onClick={addQuestion}
          className="w-full py-3 rounded-2xl border-2 border-dashed border-rose-200 text-rose-400 font-bold text-sm hover:border-rose-400 hover:text-rose-500 hover:bg-rose-50 transition-all flex items-center justify-center gap-2 mb-6">
          <Plus size={16} /> เพิ่มคำถาม ({questions.length} คำถาม)
        </button>

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/teacher/quizzes"
            className="flex-1 py-3 rounded-2xl text-center font-bold text-slate-600 border-2 border-slate-200 hover:bg-slate-50 transition-colors text-sm">
            ยกเลิก
          </Link>
          <button onClick={e => handleSubmit(e, false)} disabled={loading}
            className="flex-1 py-3 rounded-2xl font-bold text-sm border-2 border-yellow-400 text-yellow-600 hover:bg-yellow-50 transition-colors disabled:opacity-60">
            💾 บันทึกฉบับร่าง
          </button>
          <button onClick={e => handleSubmit(e, true)} disabled={loading}
            className="flex-1 py-3 rounded-2xl text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60"
            style={{ background: "#2E7D32" }}>
            {loading ? <><Loader2 size={16} className="animate-spin" /> กำลังบันทึก...</> : "🚀 เผยแพร่"}
          </button>
        </div>
      </div>
    </div>
  )
}
