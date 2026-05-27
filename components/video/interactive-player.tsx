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

      {/* Quiz Overlay — chemistry theme */}
      {quiz && (
        <div className="absolute inset-0 quiz-overlay flex items-center justify-center p-6 z-20"
          style={{ background: "rgba(15,23,42,0.85)" }}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full animate-scale-in overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4" style={{ background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)" }}>
              <div className="flex items-center gap-2 text-white/70 text-xs mb-1.5">
                <Lightbulb size={13} />
                <span>⚗️ Chemistry Question · {formatDuration(quiz.question.timestamp_seconds)}</span>
              </div>
              <p className="text-white font-bold text-base leading-snug">{quiz.question.question_text}</p>
            </div>

            <div className="p-5">
              {!quiz.answered ? (
                <div className="space-y-2.5">
                  {quiz.question.options.map((opt, i) => (
                    <button key={i} onClick={() => answerQuestion(opt)}
                      className="w-full text-left px-4 py-3 rounded-2xl border-2 text-slate-700 text-sm font-medium transition-all"
                      style={{ borderColor: "#A5D6A7" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#2E7D32"; (e.currentTarget as HTMLElement).style.background = "#F1F8E9" }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#A5D6A7"; (e.currentTarget as HTMLElement).style.background = "" }}
                    >
                      <span className="font-bold mr-2" style={{ color: "#2E7D32" }}>{String.fromCharCode(65 + i)}.</span>
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <div>
                  {/* Result banner */}
                  <div
                    className="flex items-center gap-3 p-4 rounded-2xl mb-4"
                    style={{ background: quiz.isCorrect ? "#F1F8E9" : "#FFF3F3" }}
                  >
                    {quiz.isCorrect
                      ? <CheckCircle size={26} style={{ color: "#2E7D32" }} className="shrink-0" />
                      : <XCircle size={26} style={{ color: "#C62828" }} className="shrink-0" />}
                    <div>
                      <p className="font-black text-base" style={{ color: quiz.isCorrect ? "#1B5E20" : "#B71C1C" }}>
                        {quiz.isCorrect ? "🎉 Correct! Great work!" : "❌ Not quite right"}
                      </p>
                      {!quiz.isCorrect && (
                        <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
                          Correct answer: <span className="font-bold" style={{ color: "#2E7D32" }}>{quiz.question.correct_answer}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Options review */}
                  <div className="space-y-2 mb-4">
                    {quiz.question.options.map((opt, i) => {
                      const isSelected = opt === quiz.selectedAnswer
                      const isCorrectOpt = opt === quiz.question.correct_answer
                      return (
                        <div key={i}
                          className="flex items-center gap-3 px-4 py-2.5 rounded-2xl text-sm font-medium"
                          style={{
                            background: isCorrectOpt ? "#E8F5E9" : isSelected ? "#FFEBEE" : "#F8FAFC",
                            color: isCorrectOpt ? "#1B5E20" : isSelected ? "#C62828" : "#94A3B8",
                          }}>
                          {isCorrectOpt
                            ? <CheckCircle size={15} style={{ color: "#2E7D32" }} />
                            : isSelected
                              ? <XCircle size={15} style={{ color: "#C62828" }} />
                              : <span className="w-4 h-4" />}
                          <span className="font-bold mr-1" style={{ color: isCorrectOpt ? "#2E7D32" : isSelected ? "#C62828" : "#CBD5E1" }}>
                            {String.fromCharCode(65 + i)}.
                          </span>
                          {opt}
                        </div>
                      )
                    })}
                  </div>

                  {/* Explanation */}
                  {quiz.question.explanation && (
                    <div className="rounded-2xl px-4 py-3 mb-4" style={{ background: "#E8F5E9" }}>
                      <p className="text-xs font-black mb-1 flex items-center gap-1" style={{ color: "#1B5E20" }}>
                        <Lightbulb size={12} /> 🧪 Explanation
                      </p>
                      <p className="text-xs" style={{ color: "#2E7D32" }}>{quiz.question.explanation}</p>
                    </div>
                  )}

                  <button onClick={continueVideo}
                    className="w-full py-3 text-white font-black rounded-2xl transition-opacity hover:opacity-90 flex items-center justify-center gap-2"
                    style={{ background: "linear-gradient(135deg, #1B5E20 0%, #2E7D32 100%)" }}>
                    <Play size={16} fill="white" /> Continue Watching
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
