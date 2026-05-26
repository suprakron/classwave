# MoleMeUp — คู่มือ Deploy ฟรี 100%

## ขั้นตอนที่ 1: ตั้งค่า Supabase (ฐานข้อมูล + Auth + Storage)

1. ไปที่ [supabase.com](https://supabase.com) > Sign up ฟรี
2. คลิก **New Project** ตั้งชื่อ "molemeup"
3. เลือก Region ใกล้ไทย: **Southeast Asia (Singapore)**
4. ไปที่ **SQL Editor** > วาง SQL จากไฟล์ `supabase-schema.sql` > **Run**
5. ไปที่ **Storage** > **New Bucket** > ชื่อ `videos` > เปิด Public > Create
6. ไปที่ **Settings > API** > คัดลอก:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## ขั้นตอนที่ 2: Deploy บน Vercel (Host ฟรี)

1. ไปที่ [vercel.com](https://vercel.com) > Sign up ด้วย GitHub
2. Push code ขึ้น GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial MoleMeUp"
   git remote add origin https://github.com/YOUR_USERNAME/molemeup.git
   git push -u origin main
   ```
3. ใน Vercel > **New Project** > Import repository > molemeup
4. ตั้งค่า **Environment Variables**:
   ```
   NEXT_PUBLIC_SUPABASE_URL = (จากขั้นตอนที่ 1)
   NEXT_PUBLIC_SUPABASE_ANON_KEY = (จากขั้นตอนที่ 1)
   NEXT_PUBLIC_SITE_URL = https://molemeup.vercel.app
   ```
5. คลิก **Deploy** → รอ ~2 นาที ✅

## ขั้นตอนที่ 3: ตั้งค่า Supabase Auth URL

1. ไปที่ Supabase > **Authentication > URL Configuration**
2. **Site URL**: ใส่ URL จาก Vercel เช่น `https://molemeup.vercel.app`
3. **Redirect URLs**: เพิ่ม `https://molemeup.vercel.app/**`

## รัน Local สำหรับพัฒนา

```bash
cp .env.example .env.local
# แก้ไข .env.local ใส่ค่าจริง
npm run dev
```
เปิด http://localhost:3000

## Tech Stack ที่ใช้

| ส่วน | เทคโนโลยี | ราคา |
|------|-----------|------|
| Frontend + Backend | Next.js 16 (Vercel) | ฟรี |
| Database | Supabase PostgreSQL | ฟรี (500MB) |
| Authentication | Supabase Auth | ฟรี (50K MAU) |
| File Storage | Supabase Storage | ฟรี (1GB) |
| Video Hosting | YouTube Embed / Supabase Storage | ฟรี |
| **รวม** | | **฿0/เดือน** |
