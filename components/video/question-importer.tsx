"use client"
import { useState, useRef } from "react"
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import type { Question } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ImportedQuestion {
  timestamp_seconds: number
  question_text: string
  question_type: "multiple_choice" | "true_false"
  options: string[]
  correct_answer: string
  explanation?: string
}

interface Props {
  videoId: string
  onImported: (questions: Omit<Question, "id" | "video_id">[]) => void
  onClose: () => void
}

export function QuestionImporter({ videoId, onImported, onClose }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [parsed, setParsed] = useState<ImportedQuestion[]>([])
  const [step, setStep] = useState<"upload" | "preview" | "saving">("upload")
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(f: File) {
    setFile(f)
    const formData = new FormData()
    formData.append("file", f)
    setStep("preview")
    setParsed([])

    try {
      const res = await fetch("/api/parse-questions", { method: "POST", body: formData })
      if (!res.ok) { toast.error("แปลงไฟล์ไม่สำเร็จ"); setStep("upload"); return }
      const data = await res.json()
      setParsed(data.questions || [])
    } catch {
      toast.error("เกิดข้อผิดพลาดในการแปลงไฟล์")
      setStep("upload")
    }
  }

  async function handleSave() {
    if (parsed.length === 0) { toast.error("ไม่มีคำถามที่จะบันทึก"); return }
    setSaving(true)
    const res = await fetch(`/api/videos/${videoId}/questions/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questions: parsed }),
    })
    if (!res.ok) { toast.error("บันทึกคำถามไม่สำเร็จ"); setSaving(false); return }
    onImported(parsed as Omit<Question, "id" | "video_id">[])
  }

  return (
    <div>
      {step === "upload" && (
        <div>
          <p className="text-sm text-slate-500 mb-4">
            อัพโหลดไฟล์ Word (.docx) หรือ PDF ที่มีคำถาม ระบบจะแปลงให้อัตโนมัติ
          </p>
          {/* Format guide */}
          <div className="bg-violet-50 rounded-xl p-4 mb-4 text-xs text-violet-800">
            <p className="font-semibold mb-2">รูปแบบไฟล์ที่รองรับ:</p>
            <pre className="font-mono leading-relaxed text-violet-700">
{`1. คำถามที่ต้องการ
a) ตัวเลือก A
b) ตัวเลือก B
c) ตัวเลือก C
d) ตัวเลือก D
เฉลย: a

2. คำถามถัดไป
...`}
            </pre>
          </div>

          <div
            onClick={() => fileRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors",
              "border-slate-200 hover:border-violet-300 hover:bg-violet-50/50"
            )}>
            <Upload size={36} className="text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-medium text-slate-600">คลิกเพื่อเลือกไฟล์</p>
            <p className="text-xs text-slate-400 mt-1">.docx, .pdf (สูงสุด 10MB)</p>
          </div>
          <input ref={fileRef} type="file" accept=".docx,.pdf,.doc" className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>
      )}

      {step === "preview" && (
        <div>
          <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100">
            <FileText size={20} className="text-violet-600" />
            <div className="flex-1">
              <p className="font-medium text-slate-800 text-sm">{file?.name}</p>
              <p className="text-xs text-slate-400">{parsed.length > 0 ? `พบ ${parsed.length} คำถาม` : "กำลังแปลงไฟล์..."}</p>
            </div>
            <button onClick={() => { setFile(null); setStep("upload"); setParsed([]) }} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400">
              <X size={16} />
            </button>
          </div>

          {parsed.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={32} className="animate-spin text-violet-400" />
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto space-y-3 mb-4">
              {parsed.map((q, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm text-slate-700 font-medium mb-2">{q.question_text}</p>
                      {q.question_type === "multiple_choice" && (
                        <div className="space-y-1">
                          {q.options.map((opt, oi) => (
                            <div key={oi} className={cn("flex items-center gap-2 text-xs px-2 py-1 rounded-lg", opt === q.correct_answer ? "bg-emerald-100 text-emerald-700" : "text-slate-500")}>
                              {opt === q.correct_answer ? <CheckCircle size={12} /> : <span className="w-3 h-3 rounded-full border border-slate-300" />}
                              {opt}
                            </div>
                          ))}
                        </div>
                      )}
                      {q.question_type === "true_false" && (
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">เฉลย: {q.correct_answer}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => { setFile(null); setStep("upload"); setParsed([]) }} className="flex-1">
              เลือกไฟล์ใหม่
            </Button>
            <Button onClick={handleSave} loading={saving} className="flex-1" disabled={parsed.length === 0}>
              บันทึก {parsed.length} คำถาม
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
