import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { WatchClient } from "./watch-client"

export default async function WatchPage({ params }: { params: Promise<{ videoId: string }> }) {
  const { videoId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: video }, { data: questions }, { data: progress }, { data: responses }] = await Promise.all([
    supabase.from("videos").select("*, classrooms(id, name, cover_color, teacher_id)").eq("id", videoId).eq("published", true).single(),
    supabase.from("questions").select("*").eq("video_id", videoId).order("timestamp_seconds"),
    supabase.from("video_progress").select("*").eq("video_id", videoId).eq("student_id", user.id).single(),
    supabase.from("question_responses").select("*").eq("student_id", user.id),
  ])

  if (!video) notFound()

  // Verify student is enrolled in this classroom
  const { data: enrollment } = await supabase
    .from("enrollments")
    .select("id")
    .eq("classroom_id", (video.classrooms as { id: string }).id)
    .eq("student_id", user.id)
    .single()

  if (!enrollment) redirect("/student")

  const classroom = video.classrooms as { id: string; name: string; cover_color: string }

  return (
    <div className="p-6 max-w-5xl animate-fade-in">
      <Link href={`/student/classrooms/${classroom.id}`}
        className="flex items-center gap-2 text-sm text-slate-500 hover:text-violet-600 mb-6 transition-colors">
        <ArrowLeft size={16} /> {classroom.name}
      </Link>
      <WatchClient
        video={video}
        questions={questions || []}
        studentId={user.id}
        initialProgress={progress?.last_position ?? 0}
        existingResponses={responses?.filter(r => questions?.some(q => q.id === r.question_id)) || []}
      />
    </div>
  )
}
