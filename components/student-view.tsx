"use client"

import type React from "react"
import { useMemo, useState } from "react"
import { GraduationCap, Users, BookOpen, ArrowLeft } from "lucide-react"
import { JoinClass } from "@/components/join-class"
import { Button } from "@/components/ui/button"

export function StudentView({
  onSelectQuiz,
  assignedQuizzes,
  userId,
  studentClasses,
}: {
  onSelectQuiz: (quiz: any, attemptData?: any | null) => void
  assignedQuizzes: any[]
  userId: string
  studentClasses: Array<{ id: string; name: string }>
}) {
  const [selectedClass, setSelectedClass] = useState<{ id: string; name: string } | null>(null)

  const allAttempts = assignedQuizzes.flatMap((q) => q.attempts || [])

  const attemptsByDate = useMemo(() => {
    const dates = allAttempts
      .map((a) => new Date(a.date).toLocaleDateString())
      .filter((value, index, self) => self.indexOf(value) === index)
      .sort((a, b) => (new Date(b) as any) - (new Date(a) as any))

    let streak = 0
    let lastDate: Date | null = null
    const today = new Date().toLocaleDateString()

    for (const dateStr of dates) {
      const date = new Date(dateStr)
      if (!lastDate) {
        if (dateStr === today || dateStr === new Date(Date.now() - 86400000).toLocaleDateString()) {
          streak = 1
          lastDate = date
        }
      } else {
        const dayDiff = (lastDate.getTime() - date.getTime()) / 86400000
        if (Math.round(dayDiff) === 1) {
          streak++
          lastDate = date
        } else if (Math.round(dayDiff) > 1) {
          break
        }
      }
    }

    return { streak, lastScore: allAttempts[0]?.score || 0 }
  }, [assignedQuizzes])

  const studentData = {
    streak: attemptsByDate.streak,
    totalAttempts: allAttempts.length,
    lastScore: attemptsByDate.lastScore.toFixed(0),
  }

  const IconBadge = ({ icon, label, color }: { icon: React.ReactNode; label: string; color: string }) => (
    <div className={`flex flex-col items-center p-3 rounded-xl shadow-inner ${color}`}>
      {icon}
      <span className="text-xs font-semibold mt-1">{label}</span>
    </div>
  )

  const quizzesForSelectedClass = useMemo(() => {
    if (!selectedClass) return []
    return assignedQuizzes.filter((quiz) => quiz.classId === selectedClass.id)
  }, [selectedClass, assignedQuizzes])

  if (selectedClass) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => setSelectedClass(null)} className="font-semibold">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to All Classes
        </Button>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center">
          <BookOpen className="w-6 h-6 mr-2 text-primary" /> Quizzes for {selectedClass.name}
        </h2>

        {quizzesForSelectedClass.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">
            No quizzes have been assigned to this class yet.
          </div>
        ) : (
          <div className="space-y-4">
            {quizzesForSelectedClass.map((quiz) => (
              <div key={quiz.id} className="p-4 bg-white rounded-xl shadow-md border border-gray-100 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">{quiz.title}</h3>
                    <p className="text-sm text-gray-500">{quiz.questions.length} Questions</p>
                  </div>
                  <Button variant="success" onClick={() => onSelectQuiz(quiz)}>
                    Start New Quiz
                  </Button>
                </div>

                {quiz.attempts && quiz.attempts.length > 0 && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-sm font-semibold text-gray-700 mb-2">Past Attempts ({quiz.attempts.length}):</p>
                    <div className="space-y-1">
                      {quiz.attempts
                        .sort((a: any, b: any) => (new Date(b.date) as any) - (new Date(a.date) as any))
                        .map((attempt: any, idx: number) => (
                          <div
                            key={attempt.id}
                            className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <span>
                              Attempt {quiz.attempts.length - idx}:{" "}
                              <span className="font-bold text-primary">{attempt.score.toFixed(0)}%</span> on{" "}
                              {new Date(attempt.date).toLocaleDateString()}
                            </span>
                            <button
                              onClick={() => onSelectQuiz(quiz, attempt)}
                              className="text-xs text-secondary-foreground hover:text-primary font-medium transition ml-2"
                            >
                              Review Details &rarr;
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <JoinClass userId={userId} />

      <div>
        <h2 className="text-2xl font-bold text-gray-800 flex items-center mb-4">
          <GraduationCap className="w-6 h-6 mr-2 text-primary" /> Student Dashboard
        </h2>
        <div className="p-6 bg-white rounded-xl shadow-lg border border-gray-100 space-y-4">
          <h3 className="text-xl font-bold text-primary flex items-center">
            <Users className="w-5 h-5 mr-2" /> My Progress
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <IconBadge
              icon={<span className="text-3xl">🔥</span>}
              label={`${studentData.streak} Day Streak!`}
              color="bg-yellow-100 text-yellow-800"
            />
            <IconBadge
              icon={<span className="text-3xl">🎯</span>}
              label={`Total Quizzes: ${studentData.totalAttempts}`}
              color="bg-green-100 text-green-800"
            />
            <IconBadge
              icon={<span className="text-3xl">🏆</span>}
              label={`Last Score: ${studentData.lastScore}%`}
              color="bg-blue-100 text-blue-800"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xl font-bold text-gray-800 pt-4 border-t border-gray-200">My Classes</h3>
        {studentClasses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {studentClasses.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedClass(c)}
                className="p-4 bg-white rounded-xl shadow-md border border-gray-100 text-left hover:shadow-lg hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition group"
              >
                <h4 className="text-lg font-semibold text-gray-800 group-hover:text-primary transition-colors">{c.name}</h4>
                <p className="text-sm text-gray-500 mt-1">
                  {assignedQuizzes.filter((q) => q.classId === c.id).length} quizzes available
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">
            You are not enrolled in any classes yet. Join a class to see your quizzes.
          </div>
        )}
      </div>
    </div>
  )
}