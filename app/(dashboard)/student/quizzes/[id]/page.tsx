import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { QuizClient } from "./quiz-client"

export default async function StudentQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: quiz } = await db.from("quizzes")
    .select("id, title, description, time_limit, published, classrooms(name, cover_color)")
    .eq("id", id).eq("published", true).single()
  if (!quiz) notFound()

  const { data: questions } = await db.from("quiz_questions")
    .select("id, question_text, options, correct_answer, explanation, order_index")
    .eq("quiz_id", id).order("order_index")

  const { data: submission } = await db.from("quiz_submissions")
    .select("*").eq("quiz_id", id).eq("student_id", user.id).maybeSingle()

  return (
    <QuizClient
      quiz={quiz}
      questions={questions ?? []}
      submission={submission}
      studentId={user.id}
    />
  )
}
