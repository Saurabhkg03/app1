"use client"

import type React from "react"
import { useState } from "react"
import { ListChecks, Loader2, ArrowLeft } from "lucide-react"
import { doc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { appId } from "@/lib/config"
import { getGeminiApiKey, getAiGradingSchema, fetchWithExponentialBackoff, API_URL_BASE } from "@/lib/ai"
import { getAuth } from "firebase/auth"
import Latex from "react-latex-next"

export function QuizTaker({
  quiz,
  onQuizFinished,
  results,
}: {
  quiz: any
  onQuizFinished: (r: any | null) => void
  results: any | null
}) {
  const [localAnswers, setLocalAnswers] = useState<Record<number, string>>({})
  const [isSaving, setIsSaving] = useState(false)

  const isReviewMode = !!results
  const studentAnswers = isReviewMode ? results.answers : localAnswers
  const gradingFeedback = isReviewMode ? results.feedback : {}

  const getAiGrading = async (qIndex: number, question: string, studentAnswer: string, teacherAnswer: string) => {
    const userQuery = `Grade the following student response for the question: "${question}".
            The official correct answer is: "${teacherAnswer}".
            The student's submitted response is: "${studentAnswer}".
            Provide a score out of 100 and a brief rationale for the score.`

    const systemPrompt =
      "You are a short-answer grading AI. You must compare the student answer to the provided correct answer and return a JSON object strictly following the schema."

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: getAiGradingSchema() as any,
      },
    }

    const apiKey = getGeminiApiKey()
    const apiUrl = `${API_URL_BASE}${apiKey}`

    try {
      const result = await fetchWithExponentialBackoff(apiUrl, payload)
      const jsonString = result.candidates?.[0]?.content?.parts?.[0]?.text
      const cleaned = jsonString.replace(/```json\s*|```\s*/g, "").trim()
      const aiGrade = JSON.parse(cleaned)
      return {
        score: aiGrade.score,
        rationale: aiGrade.rationale,
        isAiGraded: true,
      }
    } catch (e) {
      console.error("AI Grading failed:", e)
      return {
        score: 0,
        rationale: "AI grading failed. Score set to 0. Please check console.",
        isAiGraded: false,
      }
    }
  }

  const handleChange = (qIndex: number, value: string) => {
    if (!isReviewMode) {
      setLocalAnswers((prev) => ({ ...prev, [qIndex]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    let correctCount = 0
    const totalQuestions = quiz.questions.length
    const shortAnswerAiGrading: Record<number, any> = {}

    for (let i = 0; i < totalQuestions; i++) {
      const q = quiz.questions[i]
      const studentAnswer = localAnswers[i] || ""
      let isCorrect = false

      if (q.type === "MCQ") {
        isCorrect = studentAnswer === q.correctIndex.toString()
      } else if (q.type === "TrueFalse") {
        isCorrect = studentAnswer === q.correctAnswer
      } else if (q.type === "ShortAnswer" || q.type === "FillIn") {
        const isShortAnswerDemo =
          q.type === "ShortAnswer" && i === quiz.questions.findIndex((qn: any) => qn.type === "ShortAnswer")
        if (isShortAnswerDemo) {
          const aiResult = await getAiGrading(i, q.question, studentAnswer, q.correctAnswer)
          shortAnswerAiGrading[i] = aiResult
          isCorrect = aiResult.score > 75
        } else {
          isCorrect = !!studentAnswer && q.correctAnswer.toLowerCase().includes(studentAnswer.toLowerCase())
        }
      }

      if (isCorrect) correctCount++
    }

    const finalScore = (correctCount / totalQuestions) * 100

    try {
      const authUser = getAuth().currentUser!
      const attemptRef = doc(db, "artifacts", appId, "public/data/attempts", crypto.randomUUID())
      await setDoc(attemptRef, {
        quizId: quiz.id,
        classId: quiz.classId,
        studentId: authUser.uid,
        studentName: authUser.displayName || "Anonymous",
        teacherId: quiz.teacherId,
        score: finalScore,
        totalQuestions,
        date: new Date().toISOString(),
        studentAnswers: localAnswers,
        gradingFeedback: shortAnswerAiGrading,
      })
    } catch (error) {
      console.error("Failed to save quiz attempt:", error)
    }

    setIsSaving(false)
    onQuizFinished({ score: finalScore, total: totalQuestions, feedback: shortAnswerAiGrading, answers: localAnswers })
  }

  const renderQuestion = (q: any, qIndex: number) => {
    const selectedAnswer = studentAnswers[qIndex]
    let isCorrect = false
    let gradingNote = ""

    if (isReviewMode) {
      if (q.type === "MCQ" || q.type === "TrueFalse") {
        isCorrect =
          (q.type === "MCQ" && selectedAnswer === q.correctIndex.toString()) ||
          (q.type === "TrueFalse" && selectedAnswer === q.correctAnswer)
        gradingNote = isCorrect ? "✅ Correct! (Auto-Graded)" : "❌ Incorrect (Auto-Graded)"
      } else {
        const aiResult = gradingFeedback[qIndex]
        if (aiResult && aiResult.isAiGraded) {
          isCorrect = aiResult.score > 75
          gradingNote = `🧠 AI Grade: ${aiResult.score}% | ${isCorrect ? "Partial/Full Credit" : "No Credit"}`
        } else {
          isCorrect = !!selectedAnswer && q.correctAnswer.toLowerCase().includes(selectedAnswer.toLowerCase())
          gradingNote = `⚠️ Keyword Check: ${isCorrect ? "Match" : "No Match"} (Manual review recommended)`
        }
      }
    }

    const cardClass = isReviewMode
      ? isCorrect
        ? "border-success ring-2 ring-success/50"
        : "border-error ring-2 ring-error/50"
      : "border-gray-200"

    return (
      <div key={qIndex} className={`p-4 bg-white rounded-xl shadow-md border transition-all ${cardClass}`}>
        <p className="text-lg font-semibold text-gray-800 mb-4">
          <Latex>{`${qIndex + 1}. ${q.question} (${q.type})`}</Latex>
        </p>

        <div className="space-y-3">
          {q.type === "MCQ" &&
            q.options.map((opt: string, oIndex: number) => (
              <div key={oIndex} className="flex items-center">
                <input
                  id={`q${qIndex}o${oIndex}`}
                  type="radio"
                  name={`q-${qIndex}`}
                  value={oIndex}
                  checked={studentAnswers[qIndex] === oIndex.toString()}
                  onChange={() => handleChange(qIndex, oIndex.toString())}
                  disabled={isReviewMode || isSaving}
                  className="hidden peer"
                />
                <label
                  htmlFor={`q${qIndex}o${oIndex}`}
                  className={`w-full cursor-pointer transition p-3 rounded-lg border-2 ${
                    isReviewMode && oIndex === q.correctIndex
                      ? "border-success bg-green-50"
                      : isReviewMode && studentAnswers[qIndex] === oIndex.toString() && oIndex !== q.correctIndex
                        ? "border-error bg-red-50"
                        : "border-gray-200 hover:bg-gray-50 peer-checked:bg-indigo-50 peer-checked:border-primary"
                  }`}
                >
                  <span className="font-medium mr-3 text-sm bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                    {String.fromCharCode(65 + oIndex)}
                  </span>
                  <Latex>{opt}</Latex>
                </label>
              </div>
            ))}

          {q.type === "TrueFalse" &&
            (["True", "False"] as const).map((opt) => (
              <div key={opt} className="flex items-center">
                <input
                  id={`q${qIndex}o${opt}`}
                  type="radio"
                  name={`q-${qIndex}`}
                  value={opt}
                  checked={studentAnswers[qIndex] === opt}
                  onChange={() => handleChange(qIndex, opt)}
                  disabled={isReviewMode || isSaving}
                  className="hidden peer"
                />
                <label
                  htmlFor={`q${qIndex}o${opt}`}
                  className={`w-full cursor-pointer transition p-3 rounded-lg border-2 ${
                    isReviewMode && opt === q.correctAnswer
                      ? "border-success bg-green-50"
                      : isReviewMode && studentAnswers[qIndex] === opt && opt !== q.correctAnswer
                        ? "border-error bg-red-50"
                        : "border-gray-200 hover:bg-gray-50 peer-checked:bg-indigo-50 peer-checked:border-primary"
                  }`}
                >
                  <Latex>{opt}</Latex>
                </label>
              </div>
            ))}

          {(q.type === "FillIn" || q.type === "ShortAnswer") && (
            <textarea
              rows={2}
              value={studentAnswers[qIndex] || ""}
              onChange={(e) => handleChange(qIndex, e.target.value)}
              disabled={isReviewMode || isSaving}
              placeholder={
                q.type === "FillIn" ? "Enter your missing word(s) here..." : "Write your short answer here..."
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition disabled:bg-gray-100"
            />
          )}
        </div>

        {isReviewMode && (
          <div className="mt-4 p-3 rounded-lg text-sm transition-all duration-300 bg-gray-100">
            <p className="font-semibold text-gray-800">{gradingNote}</p>
            {gradingFeedback[qIndex]?.isAiGraded && (
              <p className="text-primary mt-1">
                <span className="font-medium">AI Rationale:</span> <Latex>{gradingFeedback[qIndex].rationale}</Latex>
              </p>
            )}
            <p className="text-gray-600 mt-1">
              <span className="font-medium">Correct Answer:</span> <Latex>{q.correctAnswer}</Latex>
            </p>
            <p className="text-gray-500 text-xs mt-1">
              <span className="font-medium">Explanation:</span> <Latex>{q.explanation}</Latex>
            </p>
          </div>
        )}
      </div>
    )
  }

  if (results) {
    return (
      <div className="space-y-6">
        <div className="p-6 bg-white rounded-xl shadow-2xl text-center border-b-4 border-success">
          <h2 className="text-3xl font-extrabold text-success mb-2">Review: {quiz.title}</h2>
          <p className="text-xl font-semibold text-gray-800">
            Score: {results.score.toFixed(1)}% ({results.score} correct out of {results.total})
          </p>
          <button
            onClick={() => onQuizFinished(null)}
            className="mt-4 px-4 py-2 text-primary font-semibold hover:text-primary-dark transition text-sm flex items-center mx-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Return to Quizzes
          </button>
        </div>
        <h3 className="text-xl font-bold text-gray-800">Review Your Answers</h3>
        <div className="space-y-4">{quiz.questions.map(renderQuestion)}</div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center">
        <ListChecks className="w-6 h-6 mr-2 text-primary" /> Taking Quiz: {quiz.title}
      </h2>
      <div className="space-y-6">{quiz.questions.map(renderQuestion)}</div>
      <button
        type="submit"
        disabled={isSaving}
        className={`w-full py-3 px-4 text-white font-bold rounded-lg shadow-lg transition ${
          isSaving ? "bg-gray-400" : "bg-primary hover:bg-primary-dark"
        }`}
      >
        {isSaving ? (
          <>
            <Loader2 className="animate-spin w-5 h-5 mr-3" />
            Submitting & Grading...
          </>
        ) : (
          "Submit Quiz & Get Feedback"
        )}
      </button>
    </form>
  )
}