"use client"

import { useEffect, useState, useMemo } from "react" // Import useMemo
import { onAuthStateChanged, signOut } from "firebase/auth"
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore"
import { LayoutDashboard, ListChecks, TrendingUp, User, Loader2, Zap, Settings } from "lucide-react"

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
import { StudentSettings } from "@/components/student-settings"
import { TeacherSettings } from "@/components/teacher-settings"

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

type TeacherNavKey = "generate" | "edit" | "bank" | "analytics" | "classes" | "settings"
type StudentNavKey = "dashboard" | "settings"

export default function Page() {
  const [userId, setUserId] = useState<string | null>(null)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [userRole, setUserRole] = useState<"teacher" | "student" | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  const [teacherNavigation, setTeacherNavigation] = useState<TeacherNavKey>("generate")
  const [studentNavigation, setStudentNavigation] = useState<StudentNavKey>("dashboard")

  const [generatedQuiz, setGeneratedQuiz] = useState<any[] | null>(null)
  const [generatedQuizTitle, setGeneratedQuizTitle] = useState<string>("")
  const [activeStudentQuiz, setActiveStudentQuiz] = useState<any | null>(null)
  const [studentResults, setStudentResults] = useState<any | null>(null)
  
  // Teacher states
  const [teacherViewQuizzes, setTeacherViewQuizzes] = useState<any[]>([])

  // Student states - Refactored for stability
  const [studentClasses, setStudentClasses] = useState<Array<{ id: string; name: string }>>([])
  const [allAssignedQuizzes, setAllAssignedQuizzes] = useState<any[]>([])
  const [studentAttempts, setStudentAttempts] = useState<any[]>([])


  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user && !user.isAnonymous) {
        setUserId(user.uid)
        setIsLoggedIn(true)
        try {
          const profileRef = doc(db, "artifacts", appId, "users", user.uid, "profile", "data")
          const profileSnap = await getDoc(profileRef)
          if (profileSnap.exists()) {
            const role = profileSnap.data().role as "teacher" | "student"
            setUserRole(role)
            if (role === "teacher") setTeacherNavigation("generate")
            if (role === "student") setStudentNavigation("dashboard")
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
    
    return () => unsub()
  }, [])

  // Effect for fetching TEACHER data
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
    const q = query(attemptsColRef, where("teacherId", "==", userId))
    const unsubAttempts = onSnapshot(
      q,
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
          attempts: a.attempts,
        }
      })
      setTeacherViewQuizzes(aggregated as any[])
    }

    return () => {
      unsubQuizzes()
      unsubAttempts()
    }
  }, [db, userId, isAuthReady, userRole])

  // Effect for fetching STUDENT data - Refactored
  useEffect(() => {
    if (!db || !userId || !isAuthReady || userRole !== "student") {
      setAllAssignedQuizzes([])
      setStudentAttempts([])
      setStudentClasses([])
      return
    }

    const authUid = getAuth().currentUser?.uid
    if (!authUid) return

    // 1. Listener for student's attempts
    const attemptsRef = collection(db, "artifacts", appId, "public/data/attempts")
    const attemptsQuery = query(attemptsRef, where("studentId", "==", authUid))
    const unsubAttempts = onSnapshot(attemptsQuery, (snap) => {
      const attempts = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
      setStudentAttempts(attempts)
    })

    // 2. Listener for student's enrollments (which then finds assigned quizzes)
    const enrollmentsRef = collection(db, "artifacts", appId, "users", authUid, "enrollments")
    let assignedQuizUnsubs: Array<() => void> = []
    const unsubEnrollments = onSnapshot(enrollmentsRef, (snap) => {
        
      assignedQuizUnsubs.forEach(unsub => unsub()) // Unsubscribe from old quiz listeners
      assignedQuizUnsubs = []

      const classes = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
      setStudentClasses(classes.map((c) => ({ id: c.id, name: c.name })))

      let quizzesFromAllClasses: any[] = []
      if(classes.length === 0) {
        setAllAssignedQuizzes([])
        return
      }

      classes.forEach((cls) => {
        const assignedRef = collection(db, "artifacts", appId, "classes", cls.id, "assigned")
        const u = onSnapshot(assignedRef, (asnap) => {
          const quizzesForThisClass = asnap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
            className: cls.name,
          }))

          quizzesFromAllClasses = [
            ...quizzesFromAllClasses.filter(q => q.classId !== cls.id),
            ...quizzesForThisClass
          ];
          setAllAssignedQuizzes(quizzesFromAllClasses);
        })
        assignedQuizUnsubs.push(u)
      })
    })

    return () => {
      unsubEnrollments()
      unsubAttempts()
      assignedQuizUnsubs.forEach(unsub => unsub())
    }
  }, [db, userId, isAuthReady, userRole])

  // Memoized derived state to combine quizzes and attempts for students
  const assignedQuizzesWithAttempts = useMemo(() => {
    return allAssignedQuizzes.map(quiz => ({
      ...quiz,
      attempts: studentAttempts.filter(attempt => attempt.quizId === quiz.id)
    }))
  }, [allAssignedQuizzes, studentAttempts])

  const handleLoginComplete = (uid: string, role: "teacher" | "student") => {
    setUserId(uid)
    setUserRole(role)
    setIsLoggedIn(true)
    if (role === "teacher") setTeacherNavigation("generate")
    if (role === "student") setStudentNavigation("dashboard")
  }

  const handleQuizGenerated = (quiz: any[], title: string) => {
    setGeneratedQuiz(quiz)
    setGeneratedQuizTitle(title)
    setTeacherNavigation("edit")
  }
  const handleEditQuiz = (quiz: any) => {
    setGeneratedQuiz(quiz.questions)
    setGeneratedQuizTitle(quiz.title)
    setTeacherNavigation("edit")
  }
  const handleBackToGenerator = () => {
    setGeneratedQuiz(null)
    setGeneratedQuizTitle("")
    setTeacherNavigation("generate")
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

  const currentUsername = auth.currentUser?.displayName || (userRole ? `${userRole}` : "")

  const renderContent = () => {
    if (!isAuthReady) {
      return (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="animate-spin w-8 h-8 text-primary" />
          <p className="ml-3 text-lg text-gray-600">Connecting...</p>
        </div>
      )
    }

    if (isLoggedIn && userRole) {
      if (userRole === "student") {
        if (activeStudentQuiz) {
          return <QuizTaker quiz={activeStudentQuiz} onQuizFinished={handleQuizFinished} results={studentResults} />
        }
        if (studentNavigation === "settings") {
          return <StudentSettings onBack={() => setStudentNavigation("dashboard")} />
        }
        return (
          <StudentView
            assignedQuizzes={assignedQuizzesWithAttempts}
            userId={userId!}
            onSelectQuiz={handleSelectQuiz}
            studentClasses={studentClasses}
          />
        )
      }
      
      if (userRole === "teacher") {
        if (teacherNavigation === "settings") {
          return <TeacherSettings onBack={() => setTeacherNavigation("generate")} />
        }
        if (teacherNavigation === "generate") {
          return <QuizGenerator onQuizGenerated={handleQuizGenerated} />
        }
        if (teacherNavigation === "edit" && generatedQuiz) {
          return <QuizEditor quiz={generatedQuiz} initialTitle={generatedQuizTitle} onBack={handleBackToGenerator} />
        }
        if (teacherNavigation === "bank") {
          return <QuizBank quizzes={teacherViewQuizzes} onEdit={handleEditQuiz} />
        }
        if (teacherNavigation === "analytics") {
          return <AnalyticsDashboard quizzes={teacherViewQuizzes} />
        }
        if (teacherNavigation === "classes") {
          return <ClassManager />
        }
      }
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
                  <User className="w-4 h-4 inline-block mr-1 text-primary" /> {currentUsername}
                </p>
                <button
                  onClick={() => userRole === 'teacher' ? setTeacherNavigation("settings") : setStudentNavigation("settings")}
                  title="Settings"
                  className="p-2 text-gray-600 hover:bg-gray-100 rounded-full transition"
                >
                  <Settings className="w-5 h-5" />
                </button>
                <button
                  onClick={() => signOut(auth)}
                  className="px-3 py-1 bg-red-600 text-white text-xs font-semibold rounded-full shadow-md hover:bg-red-700 transition"
                >
                  Sign Out
                </button>
              </>
            )}
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
                      onClick={() => setTeacherNavigation(item.id as TeacherNavKey)}
                      className={`w-full flex items-center px-3 py-3 rounded-lg text-base font-medium transition duration-150 ease-in-out ${
                        teacherNavigation === item.id
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