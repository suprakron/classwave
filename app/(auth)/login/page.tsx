"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, Search } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
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
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "linear-gradient(135deg, #FFF5E0 0%, #FFE8CC 100%)" }}
    >
      <div className="w-full max-w-4xl flex rounded-3xl overflow-hidden shadow-xl bg-white">
        {/* Left panel — form */}
        <div className="w-full md:w-[45%] p-10 flex flex-col justify-center">
          <div className="mb-6">
            <h1 className="text-3xl font-black text-slate-900">Hello!</h1>
            <p className="text-slate-500 text-sm mt-1">Wellcome to Chemistry class</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 text-base">Sign in</span>
              <div className="flex items-center gap-1.5 text-sm text-slate-500">
                <span>Sign with</span>
                <div className="w-7 h-7 rounded-full border-2 border-slate-200 flex items-center justify-center font-black text-blue-600 text-xs">
                  G
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-500 mb-1.5 block">Username or email address</label>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-xl border-2 border-blue-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-slate-500">Password</label>
                <span className="text-xs text-red-500 cursor-pointer hover:underline">Forgot Password ?</span>
              </div>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl border-2 border-blue-200 px-4 py-2.5 pr-10 text-sm focus:outline-none focus:border-blue-400 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff size={16} /> : <Search size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-white text-base transition-all disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #7DD3DA 0%, #5BC4CC 100%)" }}
            >
              {loading ? "Loading..." : "Start"}
            </button>
          </form>

          <p className="mt-6 text-xs text-slate-500">
            NO account?{" "}
            <Link href="/register" className="text-blue-500 font-semibold hover:underline">
              Sign up
            </Link>
          </p>
        </div>

        {/* Right panel — branding */}
        <div
          className="hidden md:flex w-[55%] flex-col items-center justify-center gap-4 px-8 py-10 relative overflow-hidden"
          style={{ background: "linear-gradient(160deg, #FFFBEA 0%, #FFF3C4 100%)" }}
        >
          {/* Chemistry decorations */}
          <div className="absolute top-4 left-4 text-3xl opacity-60">🧪</div>
          <div className="absolute top-8 right-8 text-2xl opacity-60">⚗️</div>
          <div className="absolute bottom-12 left-6 text-2xl opacity-60">🔬</div>
          <div className="absolute bottom-6 right-6 text-3xl opacity-60">⚗️</div>
          <div className="absolute top-20 left-10 text-xl opacity-40">🧫</div>

          <div className="text-center z-10">
            <h1
              className="font-black leading-none tracking-tight"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)", color: "#1B4A2E" }}
            >
              MOLEMEUP
            </h1>
            <div
              className="mt-3 inline-block px-6 py-1.5 rounded-2xl"
              style={{ background: "#FBBF24" }}
            >
              <span className="font-black text-2xl" style={{ color: "#1B4A2E" }}>
                CHEMISTRY
              </span>
            </div>
          </div>

          {/* Illustration placeholder */}
          <div className="flex items-end gap-2 mt-4 text-6xl z-10">
            <span>👩‍🔬</span>
            <span className="text-7xl">👨‍🔬</span>
            <span>👩‍🔬</span>
          </div>

          {/* Bottom decoration bar */}
          <div className="absolute bottom-0 left-0 right-0 h-12 flex items-center justify-around px-4 opacity-40">
            {["🧪", "⚗️", "🧫", "🔭", "⚗️", "🧪", "🔬"].map((icon, i) => (
              <span key={i} className="text-xl">{icon}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
