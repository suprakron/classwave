"use client"
import { useState } from "react"
import { Copy, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface CopyButtonProps {
  text: string
  className?: string
  variant?: "default" | "light"
}

export function CopyButton({ text, className, variant = "default" }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      title="คัดลอก"
      className={cn(
        "p-1.5 rounded-lg transition-colors",
        variant === "light"
          ? "bg-white/20 hover:bg-white/30 text-white"
          : "hover:bg-slate-100 text-slate-400 hover:text-violet-600",
        className
      )}
    >
      {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={variant === "light" ? 16 : 14} />}
    </button>
  )
}
