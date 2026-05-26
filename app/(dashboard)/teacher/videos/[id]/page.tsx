import { redirect, notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { VideoEditClient } from "./video-edit-client"

export default async function VideoDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const [{ data: video }, { data: questions }] = await Promise.all([
    supabase.from("videos").select("*, classrooms(id, name, cover_color)").eq("id", id).eq("teacher_id", user.id).single(),
    supabase.from("questions").select("*").eq("video_id", id).order("timestamp_seconds"),
  ])

  if (!video) notFound()

  return (
    <div className="p-8 max-w-5xl animate-fade-in">
      <Link href="/teacher/videos" className="flex items-center gap-2 text-sm text-slate-500 hover:text-violet-600 mb-6 transition-colors">
        <ArrowLeft size={16} /> วีดีโอทั้งหมด
      </Link>
      <VideoEditClient video={video} initialQuestions={questions || []} />
    </div>
  )
}
