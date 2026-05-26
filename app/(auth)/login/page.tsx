"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Play, Mail, Lock, Eye, EyeOff } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error("อีเมลหรือรหัสผ่านไม่ถูกต้อง")
      setLoading(false)
      return
    }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()
      router.push(profile?.role === "teacher" ? "/teacher" : "/student")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-md">
              <Play size={20} className="text-white ml-0.5" fill="white" />
            </div>
            <span className="text-2xl font-bold text-violet-700">MoleMeUp</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">ยินดีต้อนรับกลับมา</h1>
          <p className="text-slate-500 mt-1">เข้าสู่ระบบเพื่อใช้งาน</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="อีเมล"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon={<Mail size={16} />}
              required
              autoComplete="email"
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-slate-700">รหัสผ่าน</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button type="submit" loading={loading} size="lg" className="mt-1">
              เข้าสู่ระบบ
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          ยังไม่มีบัญชี?{" "}
          <Link href="/register" className="text-violet-600 font-medium hover:underline">
            สมัครใช้งาน
          </Link>
        </p>
      </div>
    </div>
  )
}
