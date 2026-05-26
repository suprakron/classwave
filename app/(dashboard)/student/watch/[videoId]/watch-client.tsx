"use client"
import { useState } from "react"
import { InteractivePlayer } from "@/components/video/interactive-player"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, MessageSquare } from "lucide-react"
import type { Video, Question, QuestionResponse } from "@/lib/types"
import { cn } from "@/lib/utils"

interface Props {
  video: Video & { classrooms: { id: string; name: string; cover_color: string } }
  questions: Question[]
  studentId: string
  initialProgress: number
  existingResponses: QuestionResponse[]
}

export function WatchClient({ video, questions, studentId, initialProgress, existingResponses }: Props) {
  const [responses, setResponses] = useState<QuestionResponse[]>(existingResponses)
  const [watchPct, setWatchPct] = useState(0)

  const classroom = video.classrooms
  const correct = responses.filter(r => r.is_correct).length
  const total = questions.length
  const answered = responses.length

  function handleResponse(r: QuestionResponse) {
    setResponses(prev => {
      const filtered = prev.filter(x => x.question_id !== r.question_id)
      return [...filtered, r]
    })
  }

  return (
    <div>
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-1">
          <span className="w-3 h-3 rounded-full" style={{ background: classroom.cover_color || "#7c3aed" }} />
          <span className="text-sm text-slate-500">{classroom.name}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{video.title}</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Player */}
        <div className="lg:col-span-2">
          <InteractivePlayer
            video={video}
            questions={questions}
            studentId={studentId}
            initialProgress={initialProgress}
            existingResponses={responses}
            onProgressUpdate={(_, pct) => setWatchPct(pct)}
            onQuestionAnswered={handleResponse}
          />

          {video.description && (
            <div className="mt-4 p-4 bg-white rounded-xl border border-slate-100">
              <p className="text-sm text-slate-600">{video.description}</p>
            </div>
          )}
        </div>

        {/* Sidebar: Progress + Q&A */}
        <div className="space-y-4">
          {/* Watch progress */}
          <div className="bg-white rounded-2xl border border-slate-100 p-5">
            <h3 className="font-semibold text-slate-900 mb-3">ความคืบหน้า</h3>
            <div className="mb-3">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>ดูวีดีโอ</span><span>{watchPct}%</span>
              </div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                <div className="h-full bg-violet-400 rounded-full transition-all" style={{ width: `${watchPct}%` }} />
              </div>
            </div>
            {total > 0 && (
              <div>
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>คำถาม</span><span>{answered}/{total}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${total > 0 ? (answered / total) * 100 : 0}%` }} />
                </div>
                {answered > 0 && (
                  <p className="text-xs text-slate-500 mt-2">
                    ตอบถูก <span className="font-semibold text-emerald-600">{correct}</span> / {answered} ข้อ
                    ({Math.round((correct / answered) * 100)}%)
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Questions list */}
          {questions.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                  <MessageSquare size={16} className="text-violet-500" />
                  คำถาม ({questions.length})
                </h3>
              </div>
              <div className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
                {questions.map((q, i) => {
                  const resp = responses.find(r => r.question_id === q.id)
                  return (
                    <div key={q.id} className="px-5 py-3 flex items-start gap-3">
                      <div className={cn("w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold",
                        !resp ? "bg-slate-100 text-slate-400" :
                        resp.is_correct ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-500"
                      )}>
                        {!resp ? i + 1 : resp.is_correct ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 font-medium line-clamp-2">{q.question_text}</p>
                        {resp && (
                          <p className={cn("text-xs mt-0.5", resp.is_correct ? "text-emerald-600" : "text-red-500")}>
                            {resp.is_correct ? "✓ ถูกต้อง" : `✗ ${resp.answer}`}
                          </p>
                        )}
                        {!resp && <Badge variant="default" className="mt-1">ยังไม่ตอบ</Badge>}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
