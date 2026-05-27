"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

export function PublishToggle({ quizId, published }: { quizId: string; published: boolean }) {
  const [state, setState] = useState(published)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle() {
    setLoading(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createClient() as any
    await db.from("quizzes").update({ published: !state }).eq("id", quizId)
    setState(s => !s)
    setLoading(false)
    router.refresh()
  }

  return (
    <button onClick={toggle} disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all disabled:opacity-60 flex-shrink-0"
      style={state
        ? { background: "#E8F5E9", color: "#2E7D32" }
        : { background: "#FFF9C4", color: "#F57F17" }}>
      {loading ? <Loader2 size={14} className="animate-spin" /> : state ? "✅ เผยแพร่แล้ว" : "📝 ฉบับร่าง"}
    </button>
  )
}
