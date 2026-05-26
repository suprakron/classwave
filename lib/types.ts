export type UserRole = "teacher" | "student"

export interface Profile {
  id: string
  name: string
  email: string
  role: UserRole
  avatar_url?: string
  created_at: string
}

export interface Classroom {
  id: string
  teacher_id: string
  name: string
  description?: string
  class_code: string
  subject?: string
  cover_color: string
  created_at: string
  teacher?: Profile
  _count?: { enrollments: number; videos: number }
}

export interface Enrollment {
  id: string
  classroom_id: string
  student_id: string
  joined_at: string
  student?: Profile
  classroom?: Classroom
}

export type VideoType = "upload" | "youtube"

export interface Video {
  id: string
  classroom_id: string
  teacher_id: string
  title: string
  description?: string
  video_type: VideoType
  video_url?: string
  storage_path?: string
  duration?: number
  published: boolean
  thumbnail_url?: string
  created_at: string
  classroom?: Classroom
  questions?: Question[]
}

export type QuestionType = "multiple_choice" | "true_false"

export interface Question {
  id: string
  video_id: string
  timestamp_seconds: number
  question_text: string
  question_type: QuestionType
  options: string[]
  correct_answer: string
  order_index: number
  explanation?: string
}

export interface VideoProgress {
  id: string
  student_id: string
  video_id: string
  last_position: number
  watch_percentage: number
  completed: boolean
  updated_at: string
  student?: Profile
  video?: Video
}

export interface QuestionResponse {
  id: string
  student_id: string
  question_id: string
  answer: string
  is_correct: boolean
  answered_at: string
  question?: Question
}

export interface StudentVideoStats {
  student: Profile
  progress: VideoProgress | null
  responses: QuestionResponse[]
  correct_count: number
  total_questions: number
}
