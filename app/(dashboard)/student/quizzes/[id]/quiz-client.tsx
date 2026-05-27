"use client"
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Clock, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface Question {
  id: string
  question_text: string
  options: string[]
  correct_answer: string
  explanation?: string
  order_index: number
}

interface Quiz {
  id: string
  title: string
  description?: string
  time_limit?: number
  classrooms: { name: string; cover_color: string }
}

interface Submission {
  score: number; max_score: number
  answers: Record<string, string>; submitted_at: string
}

interface Props {
  quiz: Quiz
  questions: Question[]
  submission: Submission | null
  studentId: string
}

export function QuizClient({ quiz, questions, submission, studentId }: Props) {
  const router = useRouter()
  const [answers, setAnswers] = useState<Record<string, string>>(submission?.answers ?? {})
  const [submitted, setSubmitted] = useState(!!submission)
  const [result, setResult] = useState<{ score: number; max: number; answers: Record<string, string> } | null>(
    submission ? { score: submission.score, max: submission.max_score, answers: submission.answers } : null
  )
  const [loading, setLoading] = useState(false)
  const [timeLeft, setTimeLeft] = useState<number | null>(quiz.time_limit ? quiz.time_limit * 60 : null)

  const handleSubmit = useCallback(async (forced = false) => {
    if (submitted) return
    if (!forced && Object.keys(answers).length < questions.length) {
      const unanswered = questions.length - Object.keys(answers).length
      if (!confirm(`ยังมี ${unanswered} ข้อที่ยังไม่ตอบ ต้องการส่งเลยไหม?`)) return
    }
    setLoading(true)
    const score = questions.filter(q => answers[q.id] === q.correct_answer).length
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createClient() as any
    await db.from("quiz_submissions").insert({
      quiz_id: quiz.id, student_id: studentId,
      answers, score, max_score: questions.length,
    })
    setResult({ score, max: questions.length, answers })
    setSubmitted(true)
    setLoading(false)
  }, [submitted, answers, questions, quiz.id, studentId])

  // Timer
  useEffect(() => {
    if (!quiz.time_limit || submitted) return
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t === null || t <= 0) { clearInterval(interval); handleSubmit(true); return 0 }
        return t - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [quiz.time_limit, submitted, handleSubmit])

  const answered = Object.keys(answers).length
  const progressPct = questions.length > 0 ? (answered / questions.length) * 100 : 0

  // Format time
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`

  // Results screen
  if (submitted && result) {
    const pct = result.max > 0 ? Math.round((result.score / result.max) * 100) : 0
    const grade = pct >= 80 ? { label: "ยอดเยี่ยม! 🏆", color: "#2E7D32" }
      : pct >= 60 ? { label: "ผ่าน! 👍", color: "#F57F17" }
      : { label: "ต้องฝึกเพิ่ม 💪", color: "#E53935" }
    return (
      <div className="flex-1 p-6 overflow-auto" style={{ background: "#FFF0F0" }}>
        <div className="max-w-2xl mx-auto">
          {/* Score card */}
          <div className="bg-white rounded-3xl p-8 shadow-sm mb-5 text-center">
            <span className="text-6xl block mb-4">🧪</span>
            <h1 className="text-2xl font-black text-slate-900 mb-1">{quiz.title}</h1>
            <p className="text-slate-500 text-sm mb-6">{quiz.classrooms?.name}</p>
            <div className="w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-4 border-8"
              style={{ borderColor: grade.color, background: `${grade.color}11` }}>
              <div>
                <p className="text-4xl font-black" style={{ color: grade.color }}>{pct}%</p>
                <p className="text-xs font-bold text-slate-500">{result.score}/{result.max}</p>
              </div>
            </div>
            <p className="text-xl font-black" style={{ color: grade.color }}>{grade.label}</p>
          </div>

          {/* Answer review */}
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden mb-5">
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="font-black text-slate-900">เฉลยคำตอบ</h2>
            </div>
            <div className="divide-y divide-slate-50">
              {questions.map((q, i) => {
                const chosen = result.answers[q.id]
                const correct = chosen === q.correct_answer
                return (
                  <div key={q.id} className="p-5">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={cn("w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5",
                        correct ? "bg-green-100" : "bg-red-100")}>
                        {correct
                          ? <CheckCircle size={16} style={{ color: "#2E7D32" }} />
                          : <XCircle size={16} style={{ color: "#E53935" }} />}
                      </div>
                      <p className="text-sm font-bold text-slate-900 flex-1">
                        <span className="text-slate-400 mr-1">Q{i + 1}.</span>
                        {q.question_text}
                      </p>
                    </div>
                    <div className="ml-10 space-y-1.5">
                      {q.options.map((opt, oi) => {
                        const isChosen = opt === chosen
                        const isCorrect = opt === q.correct_answer
                        return (
                          <div key={oi}
                            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm"
                            style={{
                              background: isCorrect ? "#E8F5E9" : isChosen ? "#FFEBEE" : "#F8FAFC",
                              color: isCorrect ? "#1B5E20" : isChosen ? "#B71C1C" : "#94A3B8",
                            }}>
                            <span className="font-black text-xs" style={{ color: isCorrect ? "#2E7D32" : isChosen ? "#E53935" : "#CBD5E1" }}>
                              {String.fromCharCode(65 + oi)}.
                            </span>
                            {opt}
                            {isCorrect && <CheckCircle size={13} className="ml-auto" style={{ color: "#2E7D32" }} />}
                            {isChosen && !isCorrect && <XCircle size={13} className="ml-auto" style={{ color: "#E53935" }} />}
                          </div>
                        )
                      })}
                      {q.explanation && (
                        <div className="mt-2 px-3 py-2 rounded-xl text-xs" style={{ background: "#E8F5E9", color: "#1B5E20" }}>
                          💡 {q.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <Link href="/student/quizzes"
            className="w-full block text-center py-3 rounded-2xl font-bold text-white hover:opacity-90 transition-opacity"
            style={{ background: "#E53935" }}>
            กลับหน้าแบบทดสอบ
          </Link>
        </div>
      </div>
    )
  }

  // Taking quiz screen
  return (
    <div className="flex-1 overflow-auto" style={{ background: "#FFF0F0" }}>
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white border-b border-rose-100 px-6 py-3 flex items-center gap-4 shadow-sm">
        <Link href="/student/quizzes"
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-rose-500 transition-colors flex-shrink-0">
          <ArrowLeft size={15} /> กลับ
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-500 truncate">{quiz.classrooms?.name}</p>
          <p className="font-black text-slate-900 text-sm truncate">{quiz.title}</p>
        </div>
        {/* Progress */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:block w-24 h-2 rounded-full bg-slate-100">
            <div className="h-full rounded-full transition-all" style={{ width: `${progressPct}%`, background: "#E53935" }} />
          </div>
          <span className="text-xs font-bold text-slate-500">{answered}/{questions.length}</span>
          {timeLeft !== null && (
            <span className={cn("flex items-center gap-1 text-sm font-black px-3 py-1 rounded-full",
              timeLeft < 60 ? "text-red-600 bg-red-100 animate-pulse" : "text-slate-700 bg-slate-100")}>
              <Clock size={14} /> {formatTime(timeLeft)}
            </span>
          )}
        </div>
      </div>

      <div className="p-6 max-w-2xl mx-auto space-y-4">
        {/* Questions */}
        {questions.map((q, i) => {
          const chosen = answers[q.id]
          return (
            <div key={q.id} className="bg-white rounded-3xl shadow-sm overflow-hidden">
              {/* Question header */}
              <div className="px-6 py-4" style={{ background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)" }}>
                <div className="flex items-center gap-2 text-white/70 text-xs mb-1.5">
                  <span>⚗️ คำถามที่ {i + 1}/{questions.length}</span>
                  {chosen && <span className="ml-auto text-green-200">✓ ตอบแล้ว</span>}
                </div>
                <p className="text-white font-bold leading-snug">{q.question_text}</p>
              </div>

              {/* Options */}
              <div className="p-4 space-y-2.5">
                {q.options.map((opt, oi) => {
                  const isChosen = opt === chosen
                  return (
                    <button key={oi} onClick={() => setAnswers(a => ({ ...a, [q.id]: opt }))}
                      className="w-full text-left px-4 py-3 rounded-2xl border-2 text-sm font-medium transition-all"
                      style={{
                        borderColor: isChosen ? "#2E7D32" : "#E5E7EB",
                        background: isChosen ? "#E8F5E9" : "white",
                        color: isChosen ? "#1B5E20" : "#374151",
                      }}>
                      <span className="font-black mr-2"
                        style={{ color: isChosen ? "#2E7D32" : "#9CA3AF" }}>
                        {String.fromCharCode(65 + oi)}.
                      </span>
                      {opt}
                      {isChosen && <CheckCircle size={15} className="inline ml-2" style={{ color: "#2E7D32" }} />}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Submit button */}
        <button onClick={() => handleSubmit(false)} disabled={loading}
          className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 shadow-lg"
          style={{ background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)" }}>
          {loading
            ? <><Loader2 size={18} className="animate-spin" /> กำลังส่ง...</>
            : `🧪 ส่งคำตอบ (${answered}/${questions.length} ข้อ)`}
        </button>
      </div>
    </div>
  )
}
