import Link from "next/link"
import { BookOpen, Play, BarChart3, FileQuestion, CheckCircle, Zap } from "lucide-react"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center">
            <Play size={18} className="text-white ml-0.5" fill="white" />
          </div>
          <span className="text-xl font-bold text-violet-700">MoleMeUp</span>
        </div>
        <div className="flex gap-3">
          <Link href="/login" className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-violet-600 transition-colors">
            เข้าสู่ระบบ
          </Link>
          <Link href="/register" className="px-4 py-2 text-sm font-medium bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors shadow-sm">
            สมัครใช้งาน
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="text-center px-6 pt-16 pb-24 max-w-4xl mx-auto">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 text-violet-700 rounded-full text-sm font-medium mb-8">
          <Zap size={14} />
          ระบบเรียนรู้ผ่านวีดีโอแบบ Interactive
        </div>
        <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-6">
          สอนสนุก เรียนรู้ได้<br />
          <span className="text-violet-600">ทุกที่ ทุกเวลา</span>
        </h1>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10">
          ครูโพสต์วีดีโอพร้อมคำถาม Interactive ระหว่างดู นักเรียนต้องตอบก่อนดูต่อ
          ครูติดตามความคืบหน้าแบบ real-time ได้ทันที
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/register?role=teacher"
            className="px-6 py-3 bg-violet-600 text-white font-semibold rounded-xl hover:bg-violet-700 shadow-md hover:shadow-lg transition-all">
            ฉันเป็นครู →
          </Link>
          <Link href="/register?role=student"
            className="px-6 py-3 bg-white text-violet-600 font-semibold rounded-xl border-2 border-violet-200 hover:border-violet-400 hover:bg-violet-50 transition-all">
            ฉันเป็นนักเรียน →
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 pb-24 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: <Play size={24} className="text-violet-600" />,
              bg: "bg-violet-100",
              title: "วีดีโอ Interactive",
              desc: "อัพโหลดวีดีโอหรือวาง YouTube link พร้อมตั้งคำถามที่ timestamp ที่ต้องการ",
            },
            {
              icon: <FileQuestion size={24} className="text-blue-600" />,
              bg: "bg-blue-100",
              title: "นำเข้าคำถามจาก Word/PDF",
              desc: "อัพโหลดไฟล์ Word หรือ PDF เพื่อนำเข้าคำถามได้เลย ไม่ต้องพิมพ์ใหม่ทีละข้อ",
            },
            {
              icon: <BarChart3 size={24} className="text-emerald-600" />,
              bg: "bg-emerald-100",
              title: "ติดตาม Progress",
              desc: "ครูเห็น real-time ว่านักเรียนแต่ละคนดูวีดีโอถึงไหน ตอบถูกกี่ข้อ",
            },
          ].map((f, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
              <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center mb-4`}>
                {f.icon}
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* How it works */}
        <div className="mt-16 bg-white rounded-3xl p-10 shadow-sm border border-slate-100">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-10">ใช้งานอย่างไร?</h2>
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-violet-600 rounded-full flex items-center justify-center text-white text-xs font-bold">ค</div>
                <h3 className="font-semibold text-slate-900">สำหรับครู</h3>
              </div>
              {[
                "สร้าง Classroom และแชร์ Class Code ให้นักเรียน",
                "อัพโหลดวีดีโอหรือวาง YouTube link",
                "ตั้งคำถาม + เลือก timestamp ที่จะแสดง",
                "ดู dashboard ติดตามนักเรียนแต่ละคน",
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-3 mb-3">
                  <CheckCircle size={18} className="text-violet-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-600">{s}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">น</div>
                <h3 className="font-semibold text-slate-900">สำหรับนักเรียน</h3>
              </div>
              {[
                "กรอก Class Code เพื่อเข้าร่วม Classroom",
                "ดูวีดีโอที่ครูมอบหมาย",
                "ตอบคำถาม pop-up ระหว่างดูวีดีโอ",
                "ดูคะแนนและ feedback ของตัวเอง",
              ].map((s, i) => (
                <div key={i} className="flex items-start gap-3 mb-3">
                  <CheckCircle size={18} className="text-blue-500 mt-0.5 shrink-0" />
                  <span className="text-sm text-slate-600">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-sm text-slate-400 border-t border-slate-100">
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className="w-5 h-5 bg-violet-600 rounded-md flex items-center justify-center">
            <Play size={10} className="text-white ml-0.5" fill="white" />
          </div>
          <span className="font-semibold text-slate-600">MoleMeUp</span>
        </div>
        ระบบจัดการการเรียนรู้ผ่านวีดีโอแบบ Interactive
      </footer>
    </div>
  )
}
