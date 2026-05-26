import type { Metadata } from "next"
import "./globals.css"
import { ToastProvider } from "@/components/ui/toast"

export const metadata: Metadata = {
  title: "MoleMeUp — ระบบเรียนรู้ผ่านวีดีโอ",
  description: "ระบบจัดการการเรียนรู้ผ่านวีดีโอแบบ Interactive สำหรับครูและนักเรียน",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th" className="h-full">
      <body className="min-h-full bg-slate-50 antialiased">
        {children}
        <ToastProvider />
      </body>
    </html>
  )
}
