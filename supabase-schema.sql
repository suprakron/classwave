-- ============================================
-- ClassWave - Supabase Database Schema
-- วิธีใช้: Supabase Dashboard > SQL Editor > วาง SQL นี้ > Run
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. สร้าง TABLES ทั้งหมดก่อน
-- ============================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('teacher', 'student')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.classrooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT,
  description TEXT,
  class_code TEXT UNIQUE NOT NULL,
  cover_color TEXT DEFAULT '#7c3aed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(classroom_id, student_id)
);

CREATE TABLE public.videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  classroom_id UUID NOT NULL REFERENCES public.classrooms(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_type TEXT NOT NULL CHECK (video_type IN ('upload', 'youtube')) DEFAULT 'youtube',
  video_url TEXT,
  storage_path TEXT,
  duration INTEGER,
  published BOOLEAN DEFAULT FALSE,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  timestamp_seconds INTEGER NOT NULL DEFAULT 0,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false')) DEFAULT 'multiple_choice',
  options JSONB NOT NULL DEFAULT '[]',
  correct_answer TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.video_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  last_position INTEGER DEFAULT 0,
  watch_percentage INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, video_id)
);

CREATE TABLE public.question_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  answer TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, question_id)
);

-- ============================================
-- 2. Enable RLS
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_responses ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 3. RLS Policies (หลังสร้าง tables ทั้งหมดแล้ว)
-- ============================================

-- profiles
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- classrooms
CREATE POLICY "classrooms_teacher_all" ON public.classrooms FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "classrooms_student_select" ON public.classrooms FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.enrollments WHERE classroom_id = id AND student_id = auth.uid())
);
CREATE POLICY "classrooms_code_lookup" ON public.classrooms FOR SELECT USING (true);

-- enrollments
CREATE POLICY "enrollments_student" ON public.enrollments FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "enrollments_teacher_select" ON public.enrollments FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.classrooms WHERE id = classroom_id AND teacher_id = auth.uid())
);

-- videos
CREATE POLICY "videos_teacher_all" ON public.videos FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "videos_student_select" ON public.videos FOR SELECT USING (
  published = TRUE AND
  EXISTS (
    SELECT 1 FROM public.enrollments
    WHERE classroom_id = videos.classroom_id AND student_id = auth.uid()
  )
);

-- questions
CREATE POLICY "questions_teacher_all" ON public.questions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.videos WHERE id = video_id AND teacher_id = auth.uid())
);
CREATE POLICY "questions_student_select" ON public.questions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.videos v
    JOIN public.enrollments e ON e.classroom_id = v.classroom_id
    WHERE v.id = video_id AND e.student_id = auth.uid() AND v.published = TRUE
  )
);

-- video_progress
CREATE POLICY "progress_student_all" ON public.video_progress FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "progress_teacher_select" ON public.video_progress FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.videos WHERE id = video_id AND teacher_id = auth.uid())
);

-- question_responses
CREATE POLICY "responses_student_all" ON public.question_responses FOR ALL USING (auth.uid() = student_id);
CREATE POLICY "responses_teacher_select" ON public.question_responses FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.questions q
    JOIN public.videos v ON v.id = q.video_id
    WHERE q.id = question_id AND v.teacher_id = auth.uid()
  )
);

-- ============================================
-- 4. Auto-create profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 5. Indexes
-- ============================================

CREATE INDEX idx_classrooms_teacher ON public.classrooms(teacher_id);
CREATE INDEX idx_classrooms_code ON public.classrooms(class_code);
CREATE INDEX idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_classroom ON public.enrollments(classroom_id);
CREATE INDEX idx_videos_classroom ON public.videos(classroom_id);
CREATE INDEX idx_videos_teacher ON public.videos(teacher_id);
CREATE INDEX idx_questions_video ON public.questions(video_id);
CREATE INDEX idx_progress_student ON public.video_progress(student_id);
CREATE INDEX idx_progress_video ON public.video_progress(video_id);
CREATE INDEX idx_responses_student ON public.question_responses(student_id);
CREATE INDEX idx_responses_question ON public.question_responses(question_id);
