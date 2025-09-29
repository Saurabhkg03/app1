"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { Loader2, Zap, Globe, BookOpen } from "lucide-react"
import { getQuizSchema, fetchWithExponentialBackoff, API_URL_BASE } from "@/lib/ai"
import { getGeminiApiKey } from "@/lib/ai"

export function QuizGenerator({
  onQuizGenerated,
}: {
  onQuizGenerated: (quiz: any[], title: string) => void
}) {
  const [quizTitle, setQuizTitle] = useState("")
  const [topic, setTopic] = useState("")
  const [content, setContent] = useState("")
  const [difficulty, setDifficulty] = useState<"Easy" | "Medium" | "Hard">("Medium")
  const [questionTypes, setQuestionTypes] = useState<Array<"MCQ" | "TrueFalse" | "FillIn" | "ShortAnswer">>(["MCQ"])
  const [curriculumAligned, setCurriculumAligned] = useState(false)
  const [multilingual, setMultilingual] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [typeCounts, setTypeCounts] = useState<Record<string, number>>({
    MCQ: 5,
    TrueFalse: 0,
    FillIn: 0,
    ShortAnswer: 0,
  })
  const totalQuestions = Object.values(typeCounts).reduce((sum, c) => sum + (Number.parseInt(String(c)) || 0), 0)

  const availableTypes = useMemo(
    () => [
      { label: "Multiple Choice (MCQ)", value: "MCQ" },
      { label: "True/False", value: "TrueFalse" },
      { label: "Fill-in-the-Blank", value: "FillIn" },
      { label: "Short Answer", value: "ShortAnswer" },
    ],
    [],
  )

  const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = e.target
    setQuestionTypes((prev) => {
      const next = checked ? [...prev, value as any] : prev.filter((t) => t !== value)
      return next as any
    })
    setTypeCounts((prev) => ({ ...prev, [value]: checked ? 1 : 0 }))
  }

  const handleCountChange = (type: string, value: string) => {
    const newCount = Math.max(0, Number.parseInt(value) || 0)
    setTypeCounts((prev) => ({ ...prev, [type]: newCount }))
  }

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!quizTitle) {
      setError("Please enter a title for your quiz.")
      return
    }
    if (!topic && !content) {
      setError("Please enter a topic or paste notes to generate a quiz.")
      return
    }
    if (totalQuestions === 0) {
      setError("Please specify at least one question.")
      return
    }

    setError("")
    setLoading(true)

    const promptContent = content ? `From the following content: "${content}"` : `On the topic of: "${topic}"`

    const breakdownString = availableTypes
      .filter((t) => (questionTypes as any).includes(t.value) && (typeCounts as any)[t.value] > 0)
      .map((t) => `${(typeCounts as any)[t.value]} ${t.label} questions`)
      .join(", and ")

    let userQuery = `Generate a quiz with exactly ${totalQuestions} questions. The distribution must be: ${breakdownString}. ${promptContent}. Ensure the difficulty is ${difficulty}. Provide correct answers and a brief explanation for each.`
    let systemPrompt =
      "You are a professional educational quiz generator. Your goal is to create a quiz that adheres strictly to the user's requirements and the JSON schema. Use varied Bloom's taxonomy levels (knowledge, application, analysis) appropriate for a " +
      difficulty +
      " difficulty quiz."

    if (curriculumAligned) {
      systemPrompt += " Ensure questions are aligned with common 9th-grade educational standards for US curricula."
    }
    if (multilingual) {
      userQuery += " The questions, answers, and explanations must be provided in Spanish."
    }
    systemPrompt += " The response must be a valid JSON array."

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: getQuizSchema() as any,
      },
    }

    const apiKey = getGeminiApiKey()
    const apiUrl = `${API_URL_BASE}${apiKey}`

    try {
      const result = await fetchWithExponentialBackoff(apiUrl, payload)
      const jsonString = result.candidates?.[0]?.content?.parts?.[0]?.text
      if (!jsonString) throw new Error("AI returned an empty or invalid response.")

      const cleaned = jsonString.replace(/```json\s*|```\s*/g, "").trim()
      const generatedQuiz = JSON.parse(cleaned)
      if (!Array.isArray(generatedQuiz) || generatedQuiz.length === 0) {
        throw new Error("Generated quiz data is empty or invalid (not an array).")
      }
      onQuizGenerated(generatedQuiz, quizTitle)
    } catch (e: any) {
      console.error("Quiz Generation Error:", e)
      setError(e.message || "An unexpected error occurred. Could not generate quiz.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center">
        <Zap className="w-6 h-6 mr-2 text-primary" /> AI Quiz Generation
      </h2>
      <form onSubmit={handleGenerate} className="space-y-6 p-6 bg-white rounded-xl shadow-md border border-gray-100">
        <div>
          <label htmlFor="quiz-title" className="block text-sm font-medium text-gray-700 mb-1">
            Quiz Title (e.g., Class Test 1, Photosynthesis Review)
          </label>
          <input
            type="text"
            id="quiz-title"
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition font-semibold"
            placeholder="Enter the name for your quiz"
            required
          />
        </div>

        <div>
          <label htmlFor="topic" className="block text-sm font-medium text-gray-700 mb-1">
            Topic Name (Optional)
          </label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition"
            placeholder="e.g., Photosynthesis, The Cold War, Linear Algebra"
          />
        </div>

        <div>
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
            Paste Notes or Content (Optional)
          </label>
          <textarea
            id="content"
            rows={4}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition"
            placeholder="Paste lesson notes, textbook excerpts, or key concepts here..."
          />
          <div className="mt-2 p-2 bg-indigo-50 border-l-4 border-primary text-sm text-gray-700 rounded">
            *If both Topic and Notes are provided, the AI will prioritize the notes.*
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Difficulty Level</label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition"
            >
              {(["Easy", "Medium", "Hard"] as const).map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Total Questions to Generate</label>
            <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-lg font-bold text-gray-700">
              {totalQuestions}
            </div>
            <p className="text-xs text-gray-500 mt-1">Sum of counts below.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-3">Select Types & Set Distribution</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {availableTypes.map((type) => (
              <div key={type.value} className="p-3 border rounded-lg shadow-sm">
                <div className="flex items-center mb-2">
                  <input
                    id={`type-${type.value}`}
                    type="checkbox"
                    value={type.value}
                    checked={questionTypes.includes(type.value as any)}
                    onChange={handleTypeChange}
                    className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                  />
                  <label htmlFor={`type-${type.value}`} className="ml-2 text-sm font-medium text-gray-700">
                    {type.label}
                  </label>
                </div>
                <input
                  type="number"
                  min={0}
                  value={(typeCounts as any)[type.value] || 0}
                  onChange={(e) => handleCountChange(type.value, e.target.value)}
                  disabled={!questionTypes.includes(type.value as any)}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-center text-sm focus:ring-primary focus:border-primary disabled:bg-gray-50"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
          <div>
            <label htmlFor="curriculum" className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <BookOpen className="w-4 h-4 mr-2 text-secondary" /> Curriculum Alignment
            </label>
            <div className="flex items-center">
              <input
                id="curriculum"
                type="checkbox"
                checked={curriculumAligned}
                onChange={(e) => setCurriculumAligned(e.target.checked)}
                className="h-4 w-4 text-secondary border-gray-300 rounded focus:ring-secondary"
              />
              <label htmlFor="curriculum" className="ml-2 text-sm text-gray-700">
                Align to US 9th Grade Standards (Simulated)
              </label>
            </div>
          </div>

          <div>
            <label htmlFor="multilingual" className="flex items-center text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4 mr-2 text-secondary" /> Multilingual Support
            </label>
            <div className="flex items-center">
              <input
                id="multilingual"
                type="checkbox"
                checked={multilingual}
                onChange={(e) => setMultilingual(e.target.checked)}
                className="h-4 w-4 text-secondary border-gray-300 rounded focus:ring-secondary"
              />
              <label htmlFor="multilingual" className="ml-2 text-sm text-gray-700">
                Generate Quiz in Spanish
              </label>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm transition-all duration-300">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full flex justify-center items-center py-3 px-4 rounded-lg shadow-lg text-base font-semibold text-white transition duration-300 ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-primary hover:bg-primary-dark hover:shadow-xl"
          }`}
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin w-5 h-5 mr-3" />
              Generating {totalQuestions} Questions...
            </>
          ) : (
            `Generate ${totalQuestions} Questions with Gemini AI`
          )}
        </button>
      </form>
    </div>
  )
}
