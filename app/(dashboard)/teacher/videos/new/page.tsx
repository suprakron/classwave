"use client"
import { useState, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { toast } from "@/components/ui/toast"
import { ArrowLeft, Upload, Link2, Video, X, Film } from "lucide-react"
import Link from "next/link"
import { cn, getYouTubeId } from "@/lib/utils"

function NewVideoForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultClassroom = searchParams.get("classroom") || ""

  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [classroomId, setClassroomId] = useState(defaultClassroom)
  const [videoType, setVideoType] = useState<"upload" | "youtube">("youtube")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [classrooms, setClassrooms] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [loadedClassrooms, setLoadedClassrooms] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function loadClassrooms() {
    if (loadedClassrooms) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from("classrooms").select("id, name").eq("teacher_id", user.id).order("name")
    setClassrooms(data || [])
    if (data?.length && !classroomId) setClassroomId(data[0].id)
    setLoadedClassrooms(true)
  }

  useState(() => { loadClassrooms() })

  const ytId = videoType === "youtube" && youtubeUrl ? getYouTubeId(youtubeUrl) : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) { toast.error("กรุณาระบุชื่อวีดีโอ"); return }
    if (!classroomId) { toast.error("กรุณาเลือกห้องเรียน"); return }
    if (videoType === "youtube" && !ytId) { toast.error("YouTube URL ไม่ถูกต้อง"); return }
    if (videoType === "upload" && !file) { toast.error("กรุณาเลือกไฟล์วีดีโอ"); return }

    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push("/login"); return }

    let videoUrl = videoType === "youtube" ? youtubeUrl : ""
    let storagePath: string | null = null

    if (videoType === "upload" && file) {
      const ext = file.name.split(".").pop()
      const path = `videos/${user.id}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from("videos").upload(path, file, { cacheControl: "3600", upsert: false })
      if (uploadError) { toast.error("อัพโหลดวีดีโอไม่สำเร็จ: " + uploadError.message); setLoading(false); return }
      storagePath = path
      const { data: urlData } = supabase.storage.from("videos").getPublicUrl(path)
      videoUrl = urlData.publicUrl
    }

    const { data, error } = await supabase.from("videos").insert({
      teacher_id: user.id,
      classroom_id: classroomId,
      title: title.trim(),
      description: description.trim() || null,
      video_type: videoType,
      video_url: videoUrl || null,
      storage_path: storagePath,
      published: false,
    }).select().single()

    if (error) { toast.error("เกิดข้อผิดพลาด: " + error.message); setLoading(false); return }
    toast.success("เพิ่มวีดีโอสำเร็จ!")
    router.push(`/teacher/videos/${data.id}`)
  }

  return (
    <div className="p-8 max-w-2xl animate-fade-in">
      <Link href="/teacher/videos" className="flex items-center gap-2 text-sm text-slate-500 hover:text-violet-600 mb-6 transition-colors">
        <ArrowLeft size={16} /> กลับ
      </Link>

      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center">
          <Film size={24} className="text-violet-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">เพิ่มวีดีโอใหม่</h1>
          <p className="text-slate-500 text-sm">อัพโหลดวีดีโอหรือวาง YouTube link</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {loadedClassrooms && (
            <Select
              label="ห้องเรียน *"
              value={classroomId}
              onChange={e => setClassroomId(e.target.value)}
              options={classrooms.map(c => ({ value: c.id, label: c.name }))}
              required
            />
          )}

          <Input label="ชื่อวีดีโอ *" placeholder="เช่น บทที่ 1 - แนะนำพีชคณิต" value={title} onChange={e => setTitle(e.target.value)} required />
          <Textarea label="คำอธิบาย (ไม่บังคับ)" placeholder="อธิบายเนื้อหาของวีดีโอ..." value={description} onChange={e => setDescription(e.target.value)} />

          {/* Video type selector */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">แหล่งที่มาของวีดีโอ</label>
            <div className="flex gap-3">
              {[
                { value: "youtube" as const, label: "YouTube Link", icon: <Link2 size={18} /> },
                { value: "upload" as const, label: "อัพโหลดไฟล์", icon: <Upload size={18} /> },
              ].map(opt => (
                <button key={opt.value} type="button" onClick={() => setVideoType(opt.value)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all",
                    videoType === opt.value
                      ? "border-violet-500 bg-violet-50 text-violet-700"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  )}>
                  {opt.icon} {opt.label}
                </button>
              ))}
            </div>
          </div>

          {videoType === "youtube" ? (
            <div>
              <Input
                label="YouTube URL"
                placeholder="https://www.youtube.com/watch?v=..."
                value={youtubeUrl}
                onChange={e => setYoutubeUrl(e.target.value)}
                icon={<Link2 size={16} />}
              />
              {ytId && (
                <div className="mt-3 rounded-xl overflow-hidden aspect-video bg-black">
                  <iframe
                    src={`https://www.youtube.com/embed/${ytId}`}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">ไฟล์วีดีโอ</label>
              <div
                onClick={() => fileRef.current?.click()}
                className={cn(
                  "border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
                  file ? "border-violet-300 bg-violet-50" : "border-slate-200 hover:border-violet-300 hover:bg-violet-50/50"
                )}>
                {file ? (
                  <div className="flex items-center justify-center gap-3">
                    <Video size={24} className="text-violet-500" />
                    <div className="text-left">
                      <p className="font-medium text-slate-700 text-sm">{file.name}</p>
                      <p className="text-xs text-slate-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                    </div>
                    <button type="button" onClick={e => { e.stopPropagation(); setFile(null) }}
                      className="ml-2 p-1 rounded-lg hover:bg-red-100 text-slate-400 hover:text-red-500">
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload size={32} className="text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">คลิกเพื่อเลือกไฟล์วีดีโอ</p>
                    <p className="text-xs text-slate-400 mt-1">MP4, MOV, AVI (สูงสุด 500MB)</p>
                  </div>
                )}
              </div>
              <input ref={fileRef} type="file" accept="video/*" className="hidden"
                onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link href="/teacher/videos" className="flex-1 px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-sm font-medium text-center hover:bg-slate-50 transition-colors">
              ยกเลิก
            </Link>
            <Button type="submit" loading={loading} className="flex-1">
              เพิ่มวีดีโอ
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function NewVideoPage() {
  return (
    <Suspense fallback={<div className="p-8 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full" /></div>}>
      <NewVideoForm />
    </Suspense>
  )
}
