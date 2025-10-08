"use client"

import { useState } from "react"
import { ArrowLeft, CheckCircle, Edit3, Loader2 } from "lucide-react"
import { doc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { appId } from "@/lib/config"
import { Button } from "@/components/ui/button"
import Latex from "react-latex-next"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { getAuth } from "firebase/auth"

export function QuizEditor({
  quiz,
  initialTitle,
  onBack,
}: {
  quiz: any[]
  initialTitle: string
  onBack: () => void
}) {
  const [currentQuiz, setCurrentQuiz] = useState<any[]>(quiz)
  const [title, setTitle] = useState<string>(initialTitle || `New Quiz: ${new Date().toLocaleDateString()}`)
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)
  const [showPreviews, setShowPreviews] = useState(true)

  const handleQuestionEdit = (qIndex: number, field: string, value: string) => {
    const updated = [...currentQuiz]
    if (field.startsWith("option_")) {
      const idx = Number.parseInt(field.split("_")[1]!)
      const newOptions = [...(updated[qIndex].options || [])]
      newOptions[idx] = value
      updated[qIndex] = { ...updated[qIndex], options: newOptions }
    } else {
      updated[qIndex] = { ...updated[qIndex], [field]: value }
    }
    setCurrentQuiz(updated)
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveMessage(null)
    const authUser = getAuth().currentUser;
    if (!authUser) {
        setSaveMessage({ type: "error", text: "You must be logged in to save." });
        setSaving(false);
        return;
    }

    try {
      const quizRef = doc(
        db,
        "artifacts",
        appId,
        "users",
        authUser.uid,
        "quizzes",
        crypto.randomUUID(),
      )
      await setDoc(quizRef, {
        title,
        questions: currentQuiz,
        createdAt: new Date().toISOString(),
        teacherId: authUser.uid,
        status: "draft",
      })
      setSaveMessage({ type: "success", text: `Quiz "${title}" saved successfully to your Question Bank!` })
      setTimeout(onBack, 2000)
    } catch (e) {
      console.error("Error saving quiz:", e)
      setSaveMessage({ type: "error", text: "Failed to save quiz. Check console for details." })
    } finally {
      setSaving(false)
    }
  }

  const renderQuestion = (q: any, qIndex: number) => (
    <div key={qIndex} className={`p-4 border border-gray-200 rounded-lg bg-gray-50 grid grid-cols-1 ${showPreviews ? 'md:grid-cols-2' : ''} gap-6`}>
      
      {/* Column 1: Editor */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-800">
          <Latex>{`${qIndex + 1}. ${q.question} (${q.type})`}</Latex>
        </h4>

        <div className="pt-2">
          <label className="text-xs font-medium text-gray-500 mb-1 block">Edit Question Text:</label>
          <textarea
            rows={2}
            value={q.question}
            onChange={(e) => handleQuestionEdit(qIndex, "question", e.target.value)}
            className="w-full text-sm px-2 py-1 border rounded focus:ring-primary focus:border-primary"
          />
        </div>

        <div className="text-sm space-y-1">
          {q.type === "MCQ" && (
            <div className="space-y-1 pl-2 pt-2">
              <label className="text-xs font-medium text-gray-500 mb-1 block">Edit Options:</label>
              {q.options.map((opt: string, oIndex: number) => (
                <div key={oIndex} className="flex items-center space-x-2">
                  <span className="font-medium text-gray-600 w-4">{String.fromCharCode(65 + oIndex)}.</span>
                  <input
                    type="text"
                    value={opt}
                    onChange={(e) => handleQuestionEdit(qIndex, `option_${oIndex}`, e.target.value)}
                    className={`flex-grow text-sm px-2 py-1 border rounded ${
                      oIndex.toString() === q.correctIndex.toString() ? "border-green-500 ring-1 ring-green-500" : "border-gray-300"
                    }`}
                  />
                  {oIndex.toString() === q.correctIndex.toString() && <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />}
                </div>
              ))}
              <p className="text-xs text-gray-500 mt-2">
                Correct option index: **{q.correctIndex}** (A=0, B=1...). Change the `correctAnswer` text below to ensure
                student feedback is accurate.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Edit Correct Answer Text:</label>
              <input
                type="text"
                value={q.correctAnswer}
                onChange={(e) => handleQuestionEdit(qIndex, "correctAnswer", e.target.value)}
                className="w-full text-sm px-2 py-1 border rounded focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500 mb-1 block">Edit Explanation:</label>
              <textarea
                rows={1}
                value={q.explanation}
                onChange={(e) => handleQuestionEdit(qIndex, "explanation", e.target.value)}
                className="w-full text-sm px-2 py-1 border rounded focus:ring-primary focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Column 2: Preview */}
      {showPreviews && (
        <div className="p-4 border border-dashed border-gray-300 rounded-lg bg-white space-y-3">
            <h5 className="font-semibold text-gray-600 text-sm border-b pb-2 mb-2">Live Preview</h5>
            <div className="prose prose-sm max-w-none">
                <p className="font-semibold"><Latex>{`${qIndex + 1}. ${q.question} (${q.type})`}</Latex></p>
                {q.type === 'MCQ' && q.options && (
                    <ol className="list-[upper-alpha] pl-5">
                        {q.options.map((opt: string, oIndex: number) => (
                            <li key={oIndex}><Latex>{opt}</Latex></li>
                        ))}
                    </ol>
                )}
                <p><span className="font-bold">Correct Answer:</span> <Latex>{q.correctAnswer}</Latex></p>
                <p><span className="font-bold">Explanation:</span> <Latex>{q.explanation}</Latex></p>
            </div>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Generator
      </Button>
      <h2 className="text-2xl font-bold text-gray-800 flex items-center">
        <Edit3 className="w-6 h-6 mr-2 text-primary" /> Edit & Approve Quiz
      </h2>

      <div className="p-4 bg-white rounded-xl shadow-md border border-gray-100">
        <label htmlFor="quiz-title" className="block text-sm font-medium text-gray-700 mb-1">
          Quiz Title
        </label>
        <input
          type="text"
          id="quiz-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-lg font-semibold px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition"
        />
        <div className="flex items-center space-x-2 mt-4 pt-4 border-t">
            <Switch
                id="preview-toggle"
                checked={showPreviews}
                onCheckedChange={setShowPreviews}
            />
            <Label htmlFor="preview-toggle">Show Live Previews</Label>
        </div>
      </div>

      <div className="space-y-4">{currentQuiz.map(renderQuestion)}</div>

      {saveMessage && (
        <div
          className={`p-3 rounded-lg text-sm ${
            saveMessage.type === "success"
              ? "bg-green-100 text-green-700 border-green-400"
              : "bg-red-100 text-red-700 border-red-400"
          } border transition-all duration-300`}
        >
          {saveMessage.text}
        </div>
      )}
      
      <Button variant="success" onClick={handleSave} disabled={saving} className="w-full py-6 text-base font-semibold">
        {saving ? (
          <>
            <Loader2 className="animate-spin w-5 h-5 mr-3" />
            Saving to Bank...
          </>
        ) : (
          "Approve & Save to Question Bank"
        )}
      </Button>
    </div>
  )
}
