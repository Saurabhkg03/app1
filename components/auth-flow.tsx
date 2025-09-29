"use client"

import { useState } from "react"
import { GoogleAuthProvider, signInWithPopup, type User as FirebaseUser } from "firebase/auth"
import { doc, setDoc } from "firebase/firestore"
import { Loader2, User, GraduationCap } from "lucide-react"
import { auth, db } from "@/lib/firebase"
import { appId } from "@/lib/config"

export function AuthFlow({
  onLoginComplete,
}: {
  onLoginComplete: (uid: string, role: "teacher" | "student") => void
}) {
  const [user, setUser] = useState<FirebaseUser | { uid: string; displayName?: string; email?: string } | null>(null)
  const [selectedRole, setSelectedRole] = useState<"teacher" | "student" | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)
    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      setUser(result.user)
    } catch (e: any) {
      console.error("Google sign-in failed:", e)
      if (e.code === "auth/unauthorized-domain") {
        setError(
          "Domain not authorized for Google Sign-In. The app will continue in Anonymous Mode (data will not be linked to a Google account).",
        )
        setUser({ uid: "anonymous_" + crypto.randomUUID(), displayName: "Anonymous User", email: "anonymous@quiz.ai" })
      } else {
        setError("Sign-in failed. Please ensure pop-ups are allowed and try again.")
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRoleSelection = async () => {
    if (!selectedRole || !user) return
    setLoading(true)
    setError(null)
    try {
      const userRef = doc(db, "artifacts", appId, "users", user.uid, "profile", "data")
      await setDoc(userRef, {
        role: selectedRole,
        email: (user as any).email,
        name: (user as any).displayName,
        lastLogin: new Date().toISOString(),
      })
      onLoginComplete(user.uid, selectedRole)
    } catch (e) {
      console.error("Error saving user role:", e)
      setError("Failed to save role. Please check network.")
    } finally {
      setLoading(false)
    }
  }

  if (!user) {
    return (
      <div className="text-center p-10 bg-white rounded-xl shadow-lg border border-gray-100">
        <h2 className="text-3xl font-bold text-primary mb-6">Welcome to EduQuizAI</h2>
        <p className="text-gray-600 mb-8">Please sign in with your Google account to continue.</p>
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-3 bg-red-600 text-white font-semibold rounded-lg shadow-md hover:bg-red-700 transition flex items-center justify-center mx-auto"
        >
          {loading ? (
            <Loader2 className="animate-spin w-5 h-5 mr-3" />
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" aria-hidden="true">
                <path
                  fill="#FFC107"
                  d="M43.611 20.083H42V20h-20v8h11.942c-1.258 4.706-5.46 8-10.942 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.157 8.077 3.03l5.656-5.657C34.046 6.053 28.525 4 22 4 10.402 4 1 13.402 1 25s9.402 21 21 21c11.132 0 17.558-8.204 20-13.796V20.083z"
                />
                <path
                  fill="#FF3D00"
                  d="M11.218 25c0-1.275.25-2.483.687-3.585l-5.451-4.226C5.071 18.2 4 21.543 4 25s1.071 6.8 2.378 9.811l5.451-4.226c-.437-1.102-.687-2.31-.687-3.585z"
                />
                <path
                  fill="#4CAF50"
                  d="M22 46c5.589 0 10.536-2.071 13.68-5.71l-5.657-4.457c-1.121 1.706-3.13 2.78-5.423 2.78-5.352 0-9.873-3.84-10.87-8.949l-5.38 4.159c1.931 5.617 7.749 9.948 14.54 9.948z"
                />
                <path
                  fill="#1976D2"
                  d="M43.611 20.083L38.844 25l4.767 4.917c.571-1.096.939-2.279 1.053-3.585h-8.216c0 1.986-.799 3.844-2.118 5.228l-.754.747 4.298 3.336c2.723-3.003 4.417-6.855 4.417-11.716 0-1.859-.3-3.69-.939-5.39z"
                />
              </svg>
              Sign in with Google
            </>
          )}
        </button>
        {error && <p className="text-error mt-4">{error}</p>}
      </div>
    )
  }

  return (
    <div className="text-center p-10 bg-white rounded-xl shadow-lg border-t-4 border-primary">
      <h2 className="text-3xl font-bold text-gray-800 mb-2">Hello, {user.displayName}!</h2>
      <p className="text-gray-600 mb-8">
        It looks like this is your first sign-in. Please select your primary role to access the correct dashboard.
      </p>

      <div className="flex justify-center space-x-6 mb-8">
        {(["teacher", "student"] as const).map((roleOption) => (
          <button
            key={roleOption}
            onClick={() => setSelectedRole(roleOption)}
            className={`p-6 border-4 rounded-xl transition w-40 flex flex-col items-center ${
              selectedRole === roleOption
                ? "border-primary shadow-xl bg-indigo-50"
                : "border-gray-200 hover:border-gray-400 bg-white"
            }`}
          >
            {roleOption === "teacher" ? (
              <User className="w-8 h-8 text-primary mb-2" />
            ) : (
              <GraduationCap className="w-8 h-8 text-primary mb-2" />
            )}
            <span className="font-semibold capitalize">{roleOption}</span>
          </button>
        ))}
      </div>

      <button
        onClick={handleRoleSelection}
        disabled={!selectedRole || loading}
        className={`w-full sm:w-auto px-6 py-3 font-semibold rounded-lg shadow-md transition ${
          selectedRole && !loading
            ? "bg-success text-white hover:bg-emerald-600"
            : "bg-gray-300 text-gray-600 cursor-not-allowed"
        }`}
      >
        {loading ? <Loader2 className="animate-spin w-5 h-5 mr-3" /> : "Start Using EduQuizAI"}
      </button>
      {error && <p className="text-error mt-4">{error}</p>}
    </div>
  )
}
