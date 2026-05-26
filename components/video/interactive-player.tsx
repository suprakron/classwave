"use client"
import { useState, useRef, useCallback, useEffect } from "react"
import dynamic from "next/dynamic"
import { Play, Pause, Volume2, VolumeX, Maximize, CheckCircle, XCircle, Lightbulb } from "lucide-react"
import { formatDuration, cn } from "@/lib/utils"
import type { Question, Video, QuestionResponse } from "@/lib/types"
import { createClient } from "@/lib/supabase/client"

// Dynamic import เพื่อหลีกเลี่ยง SSR issue
const ReactPlayer = dynamic(() => import("react-player/lazy"), { ssr: false })

interface Props {
  video: Video
  questions: Question[]
  studentId: string
  initialProgress?: number
  existingResponses?: QuestionResponse[]
  onProgressUpdate?: (seconds: number, percent: number) => void
  onQuestionAnswered?: (response: QuestionResponse) => void
}

interface QuizState {
  question: Question
  answered: boolean
  selectedAnswer: string | null
  isCorrect: boolean | null
}

export function InteractivePlayer({ video, questions, studentId, initialProgress = 0, existingResponses = [], onProgressUpdate, onQuestionAnswered }: Props) {
  const playerRef = useRef<{ seekTo: (t: number, type: string) => void; getCurrentTime: () => number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const progressBarRef = useRef<HTMLDivElement>(null)

  const [playing, setPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(initialProgress)
  const [duration, setDuration] = useState(0)
  const [muted, setMuted] = useState(false)
  const [volume, setVolume] = useState(0.8)
  const [ready, setReady] = useState(false)
  const [quiz, setQuiz] = useState<QuizState | null>(null)
  const [answeredIds] = useState<Set<string>>(new Set(existingResponses.map(r => r.question_id)))

  // Seek to initial position once ready
  useEffect(() => {
    if (ready && initialProgress > 0 && playerRef.current) {
      playerRef.current.seekTo(initialProgress, "seconds")
    }
  }, [ready, initialProgress])

  const checkQuizTrigger = useCallback((time: number) => {
    if (quiz) return
    for (const q of questions) {
      if (!answeredIds.has(q.id) && time >= q.timestamp_seconds && time < q.timestamp_seconds + 1.5) {
        setQuiz({ question: q, answered: false, selectedAnswer: null, isCorrect: null })
        setPlaying(false)
        break
      }
    }
  }, [questions, answeredIds, quiz])

  function handleProgress({ playedSeconds }: { playedSeconds: number }) {
    setCurrentTime(playedSeconds)
    checkQuizTrigger(playedSeconds)
  }

  async function saveProgress(seconds: number) {
    if (!duration) return
    const percent = Math.round((seconds / duration) * 100)
    const supabase = createClient()
    await supabase.from("video_progress").upsert({
      student_id: studentId,
      video_id: video.id,
      last_position: Math.floor(seconds),
      watch_percentage: percent,
      completed: percent >= 95,
    }, { onConflict: "student_id,video_id" })
    onProgressUpdate?.(Math.floor(seconds), percent)
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const rect = progressBarRef.current?.getBoundingClientRect()
    if (!rect || !duration) return
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const t = ratio * duration
    playerRef.current?.seekTo(t, "seconds")
    setCurrentTime(t)
  }

  async function answerQuestion(answer: string) {
    if (!quiz || quiz.answered) return
    const isCorrect = answer === quiz.question.correct_answer
    setQuiz(q => q ? { ...q, answered: true, selectedAnswer: answer, isCorrect } : null)
    answeredIds.add(quiz.question.id)

    const supabase = createClient()
    const { data } = await supabase.from("question_responses").insert({
      student_id: studentId,
      question_id: quiz.question.id,
      answer,
      is_correct: isCorrect,
    }).select().single()

    if (data) onQuestionAnswered?.(data)
  }

  function continueVideo() {
    setQuiz(null)
    setPlaying(true)
  }

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0
  const markers = questions.map(q => ({
    q,
    pct: duration > 0 ? (q.timestamp_seconds / duration) * 100 : 0,
    answered: answeredIds.has(q.id),
  }))

  return (
    <div ref={containerRef} className="relative bg-black rounded-2xl overflow-hidden">
      {/* Player */}
      <div className="aspect-video relative">
        <ReactPlayer
          ref={playerRef as React.RefObject<never>}
          url={video.video_url || undefined}
          playing={playing && !quiz}
          volume={volume}
          muted={muted}
          width="100%"
          height="100%"
          onReady={() => setReady(true)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onDuration={setDuration}
          onProgress={handleProgress}
          onSeek={setCurrentTime}
          progressInterval={500}
          config={{
            youtube: {
              playerVars: {
                modestbranding: 1,
                rel: 0,
                showinfo: 0,
              },
            },
          }}
          style={{ position: "absolute", top: 0, left: 0 }}
        />

        {/* Loading state */}
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-black">
            <div className="animate-spin w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full" />
          </div>
        )}
      </div>

      {/* Quiz Overlay */}
      {quiz && (
        <div className="absolute inset-0 quiz-overlay flex items-center justify-center p-6 z-20">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full animate-scale-in overflow-hidden">
            <div className="bg-violet-600 px-6 py-4">
              <div className="flex items-center gap-2 text-white/80 text-xs mb-1">
                <Lightbulb size={14} />
                คำถาม ณ เวลา {formatDuration(quiz.question.timestamp_seconds)}
              </div>
              <p className="text-white font-semibold text-base leading-snug">{quiz.question.question_text}</p>
            </div>
            <div className="p-5">
              {!quiz.answered ? (
                <div className="space-y-2.5">
                  {quiz.question.options.map((opt, i) => (
                    <button key={i} onClick={() => answerQuestion(opt)}
                      className="w-full text-left px-4 py-3 rounded-xl border-2 border-slate-200 text-slate-700 text-sm font-medium hover:border-violet-400 hover:bg-violet-50 transition-all">
                      <span className="text-slate-400 mr-2">{String.fromCharCode(65 + i)}.</span>{opt}
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  <div className={cn("flex items-center gap-3 p-4 rounded-xl mb-4", quiz.isCorrect ? "bg-emerald-50" : "bg-red-50")}>
                    {quiz.isCorrect
                      ? <CheckCircle size={24} className="text-emerald-500 shrink-0" />
                      : <XCircle size={24} className="text-red-500 shrink-0" />}
                    <div>
                      <p className={cn("font-semibold", quiz.isCorrect ? "text-emerald-700" : "text-red-700")}>
                        {quiz.isCorrect ? "ถูกต้อง! 🎉" : "ไม่ถูกต้อง"}
                      </p>
                      {!quiz.isCorrect && (
                        <p className="text-xs text-slate-500 mt-0.5">คำตอบที่ถูก: <span className="font-medium text-emerald-600">{quiz.question.correct_answer}</span></p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    {quiz.question.options.map((opt, i) => {
                      const isSelected = opt === quiz.selectedAnswer
                      const isCorrectOpt = opt === quiz.question.correct_answer
                      return (
                        <div key={i} className={cn("flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm",
                          isCorrectOpt ? "bg-emerald-100 text-emerald-700" :
                          isSelected ? "bg-red-100 text-red-600" : "text-slate-500")}>
                          {isCorrectOpt ? <CheckCircle size={16} /> : isSelected ? <XCircle size={16} /> : <span className="w-4" />}
                          <span className="text-slate-400 mr-1">{String.fromCharCode(65 + i)}.</span>{opt}
                        </div>
                      )
                    })}
                  </div>

                  {quiz.question.explanation && (
                    <div className="bg-blue-50 rounded-xl px-4 py-3 mb-4">
                      <p className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1"><Lightbulb size={12} /> คำอธิบาย</p>
                      <p className="text-xs text-blue-600">{quiz.question.explanation}</p>
                    </div>
                  )}

                  <button onClick={continueVideo}
                    className="w-full py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 transition-colors flex items-center justify-center gap-2">
                    <Play size={16} fill="white" /> ดูต่อ
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pt-8 pb-4">
        {/* Progress bar */}
        <div ref={progressBarRef}
          className="relative h-1.5 bg-white/30 rounded-full mb-3 cursor-pointer hover:h-2.5 transition-all group"
          onClick={seek}>
          <div className="h-full bg-violet-400 rounded-full" style={{ width: `${progressPct}%` }} />
          {markers.map(m => (
            <div key={m.q.id}
              title={m.q.question_text}
              className={cn("absolute top-1/2 w-3 h-3 rounded-full border-2 border-white shadow transition-transform group-hover:scale-125",
                m.answered ? "bg-emerald-400" : "bg-amber-400")}
              style={{ left: `${m.pct}%`, transform: "translate(-50%, -50%)" }}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setPlaying(p => !p)} className="text-white hover:text-violet-300 transition-colors">
            {playing ? <Pause size={22} fill="white" /> : <Play size={22} fill="white" />}
          </button>
          <button onClick={() => setMuted(m => !m)} className="text-white hover:text-violet-300 transition-colors">
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <span className="text-white text-xs font-mono">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>
          <div className="flex-1" />
          <div className="text-xs text-white/70">{answeredIds.size}/{questions.length} คำถาม</div>
          <button onClick={() => containerRef.current?.requestFullscreen()} className="text-white hover:text-violet-300">
            <Maximize size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
