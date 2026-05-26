import { NextRequest, NextResponse } from "next/server"

interface ParsedQuestion {
  timestamp_seconds: number
  question_text: string
  question_type: "multiple_choice" | "true_false"
  options: string[]
  correct_answer: string
  explanation: string
}

function parseTextToQuestions(text: string): ParsedQuestion[] {
  const questions: ParsedQuestion[] = []
  // Normalize line endings and clean up
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
  const lines = normalized.split("\n").map(l => l.trim()).filter(l => l)

  let current: Partial<ParsedQuestion> | null = null
  let optionLabels = ["a", "b", "c", "d", "e", "f", "ก", "ข", "ค", "ง", "จ", "1", "2", "3", "4", "5"]

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Detect question start: number followed by . or ) or ข้อ
    const qMatch = line.match(/^(?:ข้อที่?\s*)?(\d+)[.)]\s*(.+)/)
    if (qMatch) {
      if (current?.question_text) {
        const q = finalizeQuestion(current)
        if (q) questions.push(q)
      }
      current = {
        timestamp_seconds: (questions.length) * 60,
        question_text: qMatch[2],
        question_type: "multiple_choice",
        options: [],
        correct_answer: "",
        explanation: "",
      }
      continue
    }

    if (!current) continue

    // Detect options: a) b) 1) ก) etc.
    const optMatch = line.match(/^([a-zA-ZกขคงจABCDEF1-6])[.)]\s*(.+)/i)
    if (optMatch) {
      current.options = current.options || []
      current.options.push(optMatch[2])
      continue
    }

    // Detect answer: เฉลย: a / คำตอบ: ก / Answer: A
    const answerMatch = line.match(/^(?:เฉลย|คำตอบ|answer|ans)[:\s]+([a-zA-ZกขคงจABCDEF1-6])\b/i)
    if (answerMatch) {
      const ansLabel = answerMatch[1].toLowerCase()
      const idx = optionLabels.indexOf(ansLabel)
      if (idx >= 0 && current.options && idx < current.options.length) {
        current.correct_answer = current.options[idx]
      } else {
        current.correct_answer = answerMatch[1]
      }
      continue
    }

    // Detect answer by full text
    const answerTextMatch = line.match(/^(?:เฉลย|คำตอบ|answer)[:\s]+(.+)/i)
    if (answerTextMatch) {
      current.correct_answer = answerTextMatch[1]
      continue
    }

    // True/false detection
    if (current.question_text && (line.includes("ถูก") || line.includes("ผิด") || line.toLowerCase().includes("true") || line.toLowerCase().includes("false"))) {
      if (!current.options?.length) {
        current.question_type = "true_false"
        current.options = ["ถูก", "ผิด"]
      }
    }

    // Explanation
    if (line.match(/^(?:เหตุผล|อธิบาย|explanation)[:\s]+/i)) {
      current.explanation = line.replace(/^(?:เหตุผล|อธิบาย|explanation)[:\s]+/i, "")
    }
  }

  if (current?.question_text) {
    const q = finalizeQuestion(current)
    if (q) questions.push(q)
  }

  return questions
}

function finalizeQuestion(q: Partial<ParsedQuestion>): ParsedQuestion | null {
  if (!q.question_text?.trim()) return null

  // Auto-detect true/false
  if (!q.options?.length || q.question_type === "true_false") {
    q.question_type = "true_false"
    q.options = ["ถูก", "ผิด"]
    if (!q.correct_answer) q.correct_answer = "ถูก"
  } else {
    q.question_type = "multiple_choice"
    if (!q.correct_answer && q.options.length > 0) q.correct_answer = q.options[0]
  }

  return {
    timestamp_seconds: q.timestamp_seconds ?? 0,
    question_text: q.question_text!.trim(),
    question_type: q.question_type!,
    options: q.options!,
    correct_answer: q.correct_answer!,
    explanation: q.explanation || "",
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 })

    const ext = file.name.split(".").pop()?.toLowerCase()
    let text = ""

    if (ext === "pdf") {
      // Use PDF.js for PDF parsing
      const buffer = Buffer.from(await file.arrayBuffer())
      const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs" as string)
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) })
      const pdf = await loadingTask.promise
      const pages: string[] = []
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        pages.push(content.items.map((item: { str?: string }) => item.str || "").join(" "))
      }
      text = pages.join("\n")
    } else if (ext === "docx" || ext === "doc") {
      const mammoth = await import("mammoth")
      const buffer = Buffer.from(await file.arrayBuffer())
      const result = await mammoth.extractRawText({ buffer })
      text = result.value
    } else if (ext === "txt") {
      text = await file.text()
    } else {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 })
    }

    const questions = parseTextToQuestions(text)
    return NextResponse.json({ questions, total: questions.length })
  } catch (err) {
    console.error("Parse error:", err)
    return NextResponse.json({ error: "Failed to parse file" }, { status: 500 })
  }
}
