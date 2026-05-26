import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest, { params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Verify teacher owns this video
  const { data: video } = await supabase.from("videos").select("teacher_id").eq("id", videoId).single()
  if (!video || video.teacher_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { questions } = await request.json()
  if (!Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: "No questions" }, { status: 400 })
  }

  const toInsert = questions.map((q: {
    timestamp_seconds?: number
    question_text: string
    question_type: string
    options: string[]
    correct_answer: string
    explanation?: string
    order_index?: number
  }, i: number) => ({
    video_id: videoId,
    timestamp_seconds: q.timestamp_seconds ?? i * 60,
    question_text: q.question_text,
    question_type: q.question_type,
    options: q.options,
    correct_answer: q.correct_answer,
    explanation: q.explanation || null,
    order_index: i,
  }))

  const { error } = await supabase.from("questions").insert(toInsert)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, inserted: toInsert.length })
}
