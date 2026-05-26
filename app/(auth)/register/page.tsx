"use client"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Play, User, Mail, Lock, GraduationCap, BookOpen } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import { Suspense } from "react"

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get("role") === "student" ? "student" : "teacher"

  const [role, setRole] = useState<"teacher" | "student">(defaultRole as "teacher" | "student")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"); return }
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) {
      toast.error(error.message === "User already registered" ? "อีเมลนี้มีผู้ใช้งานแล้ว" : error.message)
      setLoading(false)
      return
    }
    if (data.user) {
      await supabase.from("profiles").insert({ id: data.user.id, name, email, role })
      toast.success("สมัครใช้งานสำเร็จ!")
      router.push(role === "teacher" ? "/teacher" : "/student")
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center shadow-md">
              <Play size={20} className="text-white ml-0.5" fill="white" />
            </div>
            <span className="text-2xl font-bold text-violet-700">MoleMeUp</span>
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">สร้างบัญชีใหม่</h1>
          <p className="text-slate-500 mt-1">เริ่มต้นใช้งานฟรี ไม่มีค่าใช้จ่าย</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8">
          {/* Role selector */}
          <div className="flex gap-3 mb-6">
            {([
              { value: "teacher", label: "ฉันเป็นครู", icon: <BookOpen size={20} />, color: "violet" },
              { value: "student", label: "ฉันเป็นนักเรียน", icon: <GraduationCap size={20} />, color: "blue" },
            ] as const).map(r => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-2 py-4 rounded-xl border-2 transition-all",
                  role === r.value
                    ? r.color === "violet"
                      ? "border-violet-500 bg-violet-50 text-violet-700"
                      : "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-200 text-slate-500 hover:border-slate-300"
                )}
              >
                {r.icon}
                <span className="text-sm font-medium">{r.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <Input
              label="ชื่อ-นามสกุล"
              type="text"
              placeholder="ชื่อ นามสกุล"
              value={name}
              onChange={e => setName(e.target.value)}
              icon={<User size={16} />}
              required
            />
            <Input
              label="อีเมล"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              icon={<Mail size={16} />}
              required
            />
            <Input
              label="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              icon={<Lock size={16} />}
              required
            />
            <Button type="submit" loading={loading} size="lg" className="mt-2">
              สมัครใช้งาน
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-slate-500 mt-6">
          มีบัญชีอยู่แล้ว?{" "}
          <Link href="/login" className="text-violet-600 font-medium hover:underline">
            เข้าสู่ระบบ
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full" /></div>}>
      <RegisterForm />
    </Suspense>
  )
}
