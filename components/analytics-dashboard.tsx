"use client"

import type React from "react"
import { useState } from "react"
import { TrendingUp, ListChecks, ArrowLeft, User, Clock, CheckCircle, XCircle } from "lucide-react"
import Latex from "react-latex-next"

export function AnalyticsDashboard({ quizzes }: { quizzes: any[] }) {
  const [selectedQuiz, setSelectedQuiz] = useState<any | null>(null)
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(null)

  const quizzesWithAttempts = quizzes.filter((q) => q.totalAttempts > 0)

  const getGradeColor = (score: number) => {
    if (score >= 80) return "text-success"
    if (score >= 60) return "text-yellow-600"
    return "text-error"
  }

  if (selectedQuiz) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedQuiz(null)}
          className="flex items-center text-primary hover:text-primary-dark transition text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Analytics Overview
        </button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{selectedQuiz.title}</h2>
          <div className="flex space-x-4 text-sm text-gray-500 mt-1">
            <span>{selectedQuiz.totalAttempts} Attempts</span>
            <span>&bull;</span>
            <span>Average Score: {selectedQuiz.avgScore.toFixed(1)}%</span>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700">Student Results</h3>
          {selectedQuiz.attempts.length === 0 ? (
            <p className="text-gray-500">No attempts recorded for this quiz yet.</p>
          ) : (
            selectedQuiz.attempts
              .sort((a: any, b: any) => b.score - a.score)
              .map((attempt: any) => (
                <div key={attempt.id} className="p-4 bg-white rounded-xl shadow-md border border-gray-100">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-semibold text-gray-800">{attempt.studentName || "Unknown Student"}</p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          {new Date(attempt.date).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${getGradeColor(attempt.score)}`}>{attempt.score.toFixed(1)}%</p>
                      <button
                        onClick={() => setExpandedAttemptId(expandedAttemptId === attempt.id ? null : attempt.id)}
                        className="text-xs text-primary hover:underline"
                      >
                        {expandedAttemptId === attempt.id ? "Hide Responses" : "View Responses"}
                      </button>
                    </div>
                  </div>
                  {expandedAttemptId === attempt.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-4">
                      {selectedQuiz.questions.map((q: any, qIndex: number) => {
                        const studentAnswerRaw = attempt.studentAnswers[qIndex]
                        let studentAnswerDisplay = studentAnswerRaw
                        let isCorrect = false

                        if (q.type === "MCQ") {
                          studentAnswerDisplay = q.options[studentAnswerRaw] || "Not Answered"
                          isCorrect = studentAnswerRaw === q.correctIndex.toString()
                        } else if (q.type === "TrueFalse") {
                          isCorrect = studentAnswerRaw === q.correctAnswer
                        } else {
                          // Simplified check for display
                          isCorrect =
                            !!studentAnswerRaw &&
                            q.correctAnswer.toLowerCase().includes(studentAnswerRaw.toLowerCase())
                        }

                        return (
                          <div key={qIndex} className="text-sm">
                            <p className="font-semibold text-gray-700">
                              <Latex>{`${qIndex + 1}. ${q.question}`}</Latex>
                            </p>
                            <div className="flex items-center space-x-2 mt-1">
                              {isCorrect ? (
                                <CheckCircle className="w-4 h-4 text-success shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-error shrink-0" />
                              )}
                              <p className="flex-1">
                                <span className="font-medium">Student's Answer:</span>{" "}
                                <span className={isCorrect ? "text-gray-800" : "text-error"}>
                                  <Latex>{studentAnswerDisplay || "Not Answered"}</Latex>
                                </span>
                              </p>
                            </div>
                            {!isCorrect && (
                              <p className="pl-6 text-xs text-gray-500 mt-1">
                                Correct Answer: <Latex>{q.correctAnswer}</Latex>
                              </p>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center">
        <TrendingUp className="w-6 h-6 mr-2 text-primary" /> Analytics Dashboard
      </h2>
      <p className="text-sm text-gray-600">
        Here is an overview of quizzes that have been attempted by students. Click on a quiz to see detailed results.
      </p>

      {quizzesWithAttempts.length === 0 ? (
        <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">
          No student attempts have been recorded yet. Assign a quiz to a class and wait for students to complete it.
        </div>
      ) : (
        <div className="space-y-3">
          {quizzesWithAttempts.map((quiz) => (
            <div
              key={quiz.id}
              className="p-4 bg-white rounded-xl shadow-md border border-gray-100 flex justify-between items-center"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{quiz.title}</h3>
                <div className="flex space-x-4 text-sm text-gray-500 mt-1">
                  <span>{quiz.totalAttempts} Attempts</span>
                  <span>&bull;</span>
                  <span>Avg. Score: {quiz.avgScore.toFixed(1)}%</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedQuiz(quiz)}
                className="px-4 py-2 bg-primary text-white font-semibold rounded-lg shadow-md hover:bg-primary/90 transition text-sm"
              >
                View Results
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}