"use client"

import { useEffect, useState } from "react"
import { onAuthStateChanged, signOut, signInAnonymously } from "firebase/auth"
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore"
import { LayoutDashboard, ListChecks, TrendingUp, User, Loader2, Zap } from "lucide-react"

import { auth, db } from "@/lib/firebase"
import { appId } from "@/lib/config"

import { AuthFlow } from "@/components/auth-flow"
import { QuizGenerator } from "@/components/quiz-generator"
import { QuizEditor } from "@/components/quiz-editor"
import { QuizBank } from "@/components/quiz-bank"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { StudentView } from "@/components/student-view"
import { QuizTaker } from "@/components/quiz-taker"
import { ClassManager } from "@/components/class-manager"
import { getAuth } from "firebase/auth"

type Attempt = {
  id: string
  quizId: string
  studentId: string
  teacherId: string
  score: number
  totalQuestions: number
  date: string
  studentAnswers: Record<string, string>
  gradingFeedback: Record<string, any>
}

type QuizDoc = {
  id: string
  title: string
  questions: any[]
  createdAt: string
  teacherId: string
  status: string
}

type NavKey = "generate" | "edit" | "bank" | "analytics" | "classes"

export default function Page() {
  const [userId, setUserId] = useState<string | null>(null)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [userRole, setUserRole] = useState<"teacher" | "student" | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const [navigation, setNavigation] = useState<NavKey>("generate")
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [generatedQuiz, setGeneratedQuiz] = useState<any[] | null>(null)
  const [generatedQuizTitle, setGeneratedQuizTitle] = useState<string>("")
  const [activeStudentQuiz, setActiveStudentQuiz] = useState<any | null>(null)
  const [studentResults, setStudentResults] = useState<any | null>(null)
  const [teacherViewQuizzes, setTeacherViewQuizzes] = useState<any[]>([])
  const [assignedQuizzes, setAssignedQuizzes] = useState<any[]>([])
  const [studentClasses, setStudentClasses] = useState<Array<{ id: string; name: string }>>([])

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid)
        setIsLoggedIn(true)
        try {
          const profileRef = doc(db, "artifacts", appId, "users", user.uid, "profile", "data")
          const profileSnap = await getDoc(profileRef)
          if (profileSnap.exists()) {
            const role = profileSnap.data().role as "teacher" | "student"
            setUserRole(role)
            if (role === "teacher") setNavigation("generate")
          } else {
            setUserRole(null)
          }
        } catch {
          setUserRole(null)
        }
      } else {
        setUserId(null)
        setIsLoggedIn(false)
        setUserRole(null)
        setActiveStudentQuiz(null)
      }
      setIsAuthReady(true)
    })

    if (!auth.currentUser) {
      signInAnonymously(auth).catch(() => {})
    }

    return () => unsub()
  }, [])

  useEffect(() => {
    if (!db || !userId || !isAuthReady || userRole !== "teacher") return

    let currentQuizzes: QuizDoc[] = []
    let allAttempts: Attempt[] = []

    const quizColRef = collection(db, "artifacts", appId, "users", userId, "quizzes")
    const unsubQuizzes = onSnapshot(
      quizColRef,
      (snap) => {
        currentQuizzes = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        aggregate()
      },
      (err) => console.error("Firestore Quiz listen failed:", err),
    )

    const attemptsColRef = collection(db, "artifacts", appId, "public/data/attempts")
    const unsubAttempts = onSnapshot(
      attemptsColRef,
      (snap) => {
        allAttempts = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        aggregate()
      },
      (err) => console.error("Firestore Attempt listen failed:", err),
    )

    function aggregate() {
      const attemptMap: Record<string, { totalAttempts: number; totalScore: number; attempts: Attempt[] }> = {}

      for (const at of allAttempts) {
        if (currentQuizzes.find((q) => q.id === at.quizId)) {
          if (!attemptMap[at.quizId]) {
            attemptMap[at.quizId] = { totalAttempts: 0, totalScore: 0, attempts: [] }
          }
          attemptMap[at.quizId].totalAttempts += 1
          attemptMap[at.quizId].totalScore += at.score
          attemptMap[at.quizId].attempts.push(at)
        }
      }

      const aggregated = currentQuizzes.map((q) => {
        const a = attemptMap[q.id] || { totalAttempts: 0, totalScore: 0, attempts: [] }
        const avgScore = a.totalAttempts > 0 ? a.totalScore / a.totalAttempts : 0
        return {
          ...q,
          totalAttempts: a.totalAttempts,
          avgScore,
          attempts: a.attempts.filter((t) => t.studentId === userId),
        }
      })
      setTeacherViewQuizzes(aggregated as any[])
    }

    return () => {
      unsubQuizzes()
      unsubAttempts()
    }
  }, [db, userId, isAuthReady, userRole])

  useEffect(() => {
    if (!db || !userId || !isAuthReady || userRole !== "student") return

    const authUid = getAuth().currentUser?.uid
    if (!authUid) return

    const enrollmentsRef = collection(db, "artifacts", appId, "users", authUid, "enrollments")
    const assignedUnsubs: Array<() => void> = []
    const attemptsUnsubs: Array<() => void> = []
    let studentAttempts: Attempt[] = []

    const unsubEnrollments = onSnapshot(
      enrollmentsRef,
      (snap) => {
        const classes = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
        setStudentClasses(classes.map((c) => ({ id: c.id, name: c.name })))

        assignedUnsubs.forEach((u) => u())
        assignedUnsubs.length = 0

        classes.forEach((cls) => {
          const assignedRef = collection(db, "artifacts", appId, "classes", cls.id, "assigned")
          const u = onSnapshot(
            assignedRef,
            (asnap) => {
              setAssignedQuizzes((prev) => {
                const others = prev.filter((q: any) => q.classId !== cls.id)
                const add = asnap.docs.map((d) => ({
                  id: d.id,
                  ...(d.data() as any),
                  className: cls.name,
                }))
                return [...others, ...add]
              })
            },
            (err) => console.error("Assigned listen failed:", err),
          )
          assignedUnsubs.push(u)
        })
      },
      (err) => console.error("Enrollments listen failed:", err),
    )

    const attemptsRef = collection(db, "artifacts", appId, "public/data/attempts")
    const unsubAttempts = onSnapshot(
      attemptsRef,
      (snap) => {
        studentAttempts = snap.docs
          .map((d) => ({ id: d.id, ...(d.data() as any) }))
          .filter((a: any) => a.studentId === authUid)
        setAssignedQuizzes((prev) => {
          return prev.map((q: any) => ({
            ...q,
            attempts: studentAttempts.filter((a: any) => a.quizId === q.id || a.quizId === q.quizId),
          }))
        })
      },
      (err) => console.error("Student attempts listen failed:", err),
    )
    attemptsUnsubs.push(unsubAttempts)

    return () => {
      unsubEnrollments()
      assignedUnsubs.forEach((u) => u())
      attemptsUnsubs.forEach((u) => u())
    }
  }, [db, userId, isAuthReady, userRole])

  const handleLoginComplete = (uid: string, role: "teacher" | "student") => {
    setUserId(uid)
    setUserRole(role)
    setIsLoggedIn(true)
    if (role === "teacher") setNavigation("generate")
  }

  const handleQuizGenerated = (quiz: any[], title: string) => {
    setGeneratedQuiz(quiz)
    setGeneratedQuizTitle(title)
    setNavigation("edit")
  }
  const handleEditQuiz = (quiz: any) => {
    setGeneratedQuiz(quiz.questions)
    setGeneratedQuizTitle(quiz.title)
    setNavigation("edit")
  }
  const handleBackToGenerator = () => {
    setGeneratedQuiz(null)
    setGeneratedQuizTitle("")
    setNavigation("generate")
  }

  const handleSelectQuiz = (quiz: any, attemptData: any | null = null) => {
    setActiveStudentQuiz(quiz)
    if (attemptData) {
      setStudentResults({
        score: attemptData.score,
        total: attemptData.totalQuestions,
        feedback: attemptData.gradingFeedback || {},
        answers: attemptData.studentAnswers || {},
      })
    } else {
      setStudentResults(null)
    }
  }
  const handleQuizFinished = (results: any | null) => {
    if (results === null) {
      setActiveStudentQuiz(null)
      setStudentResults(null)
    } else {
      setStudentResults(results)
    }
  }

  const navItems = [
    { id: "generate", label: "AI Quiz Generator", icon: Zap },
    { id: "bank", label: `Question Bank (${teacherViewQuizzes.length})`, icon: ListChecks },
    { id: "analytics", label: "Analytics Dashboard", icon: TrendingUp },
    { id: "classes", label: "Classes", icon: LayoutDashboard },
  ] as const

  const currentUserIdDisplay = userId ? `User ID: ${userId}` : "Not Signed In"

  const renderContent = () => {
    if (!isAuthReady) {
      return (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="animate-spin w-8 h-8 text-primary" />
          <p className="ml-3 text-lg text-gray-600">Connecting to Firebase...</p>
        </div>
      )
    }

    if (isLoggedIn && userRole) {
      if (userRole === "student") {
        if (activeStudentQuiz) {
          return <QuizTaker quiz={activeStudentQuiz} onQuizFinished={handleQuizFinished} results={studentResults} />
        }
        return (
          <StudentView
            quizzes={[]}
            assignedQuizzes={assignedQuizzes}
            userId={userId!}
            onSelectQuiz={handleSelectQuiz}
          />
        )
      }

      if (navigation === "generate") {
        return <QuizGenerator onQuizGenerated={handleQuizGenerated} />
      }
      if (navigation === "edit" && generatedQuiz) {
        return <QuizEditor quiz={generatedQuiz} initialTitle={generatedQuizTitle} onBack={handleBackToGenerator} />
      }
      if (navigation === "bank") {
        return <QuizBank quizzes={teacherViewQuizzes} onEdit={handleEditQuiz} />
      }
      if (navigation === "analytics") {
        return <AnalyticsDashboard quizzes={teacherViewQuizzes} />
      }
      if (navigation === "classes") {
        return <ClassManager />
      }
      return <QuizGenerator onQuizGenerated={handleQuizGenerated} />
    }

    return <AuthFlow onLoginComplete={handleLoginComplete} />
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary flex items-center">
            <LayoutDashboard className="w-6 h-6 mr-2" /> {"EduQuizAI"}
          </h1>

          <div className="flex items-center space-x-4">
            {isLoggedIn && userRole && (
              <>
                <p className="text-sm font-semibold text-gray-700 capitalize">
                  <User className="w-4 h-4 inline-block mr-1 text-primary" /> {userRole} Dashboard
                </p>
                <button
                  onClick={() => signOut(auth)}
                  className="px-3 py-1 bg-error text-white text-xs font-semibold rounded-full shadow-md hover:bg-red-700 transition"
                >
                  Sign Out
                </button>
              </>
            )}
            <p className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full hidden sm:block">
              {currentUserIdDisplay}
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
          {isLoggedIn && userRole === "teacher" && (
            <aside className="lg:col-span-3 mb-8 lg:mb-0">
              <nav className="space-y-2 bg-white p-4 rounded-xl shadow-md border border-gray-100">
                {navItems.map((item) => {
                  return (
                    <button
                      key={item.id}
                      onClick={() => setNavigation(item.id as NavKey)}
                      className={`w-full flex items-center px-3 py-3 rounded-lg text-base font-medium transition duration-150 ease-in-out ${
                        navigation === item.id
                          ? "bg-primary text-white shadow-lg"
                          : "text-gray-700 hover:bg-gray-100 hover:text-primary"
                      }`}
                    >
                      <item.icon className="w-5 h-5 mr-3" />
                      <span>{item.label}</span>
                    </button>
                  )
                })}
              </nav>

              <div className="mt-6 p-4 text-xs text-gray-500 bg-white rounded-xl shadow-md border border-gray-100">
                <p className="font-semibold text-gray-700 mb-2">Note on AI Grading:</p>
                <p>
                  Short Answer grading uses a live Gemini API call for the first Short Answer question for
                  demonstration. This may add a slight delay upon submission.
                </p>
              </div>
            </aside>
          )}

          <main
            className={`${
              isLoggedIn && userRole === "teacher" ? "lg:col-span-9" : "lg:col-span-12"
            } bg-white p-6 md:p-8 rounded-xl shadow-2xl`}
          >
            {renderContent()}
          </main>
        </div>


      </div>
    </div>
  )
}
