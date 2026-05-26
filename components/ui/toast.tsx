"use client"
import { cn } from "@/lib/utils"
import { CheckCircle, XCircle, Info, X } from "lucide-react"
import { useState, useEffect, useCallback } from "react"

type ToastType = "success" | "error" | "info"

interface ToastItem {
  id: string
  message: string
  type: ToastType
}

let addToastFn: ((msg: string, type: ToastType) => void) | null = null

export function toast(message: string, type: ToastType = "info") {
  addToastFn?.(message, type)
}
toast.success = (msg: string) => toast(msg, "success")
toast.error = (msg: string) => toast(msg, "error")

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const add = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  useEffect(() => { addToastFn = add; return () => { addToastFn = null } }, [add])

  const icons = {
    success: <CheckCircle size={18} className="text-emerald-500 shrink-0" />,
    error: <XCircle size={18} className="text-red-500 shrink-0" />,
    info: <Info size={18} className="text-blue-500 shrink-0" />,
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg border bg-white text-sm text-slate-800 max-w-sm animate-slide-up",
          t.type === "success" && "border-emerald-200",
          t.type === "error" && "border-red-200",
          t.type === "info" && "border-blue-200",
        )}>
          {icons[t.type]}
          <span className="flex-1">{t.message}</span>
          <button onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))} className="text-slate-400 hover:text-slate-600">
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  )
}
