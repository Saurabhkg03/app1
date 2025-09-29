"use client"

import { useState, useEffect } from "react"
import { getAuth, updateProfile } from "firebase/auth"
import { doc, setDoc, collection, getDocs } from "firebase/firestore"
import { ArrowLeft, User, Loader2, Save } from "lucide-react"
import { db } from "@/lib/firebase"
import { appId } from "@/lib/config"

export function StudentSettings({ onBack }: { onBack: () => void }) {
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    const authUser = getAuth().currentUser
    if (authUser?.displayName) {
      setName(authUser.displayName)
    }
  }, [])

  const handleSave = async () => {
    setMessage(null)
    setSaving(true)
    const authUser = getAuth().currentUser
    const trimmedName = name.trim()

    if (!authUser || !trimmedName) {
      setMessage({ type: "error", text: "Name cannot be empty." })
      setSaving(false)
      return
    }

    try {
      // 1. Update Firebase Auth profile
      await updateProfile(authUser, { displayName: trimmedName })

      // 2. Update user's main profile document
      const userProfileRef = doc(db, "artifacts", appId, "users", authUser.uid, "profile", "data")
      await setDoc(userProfileRef, { name: trimmedName }, { merge: true })

      // 3. Update name in all enrolled classes
      const enrollmentsRef = collection(db, "artifacts", appId, "users", authUser.uid, "enrollments")
      const enrollmentsSnap = await getDocs(enrollmentsRef)

      const updatePromises = enrollmentsSnap.docs.map((enrollmentDoc) => {
        const classId = enrollmentDoc.id
        const studentInClassRef = doc(db, "artifacts", appId, "classes", classId, "students", authUser.uid)
        return setDoc(studentInClassRef, { name: trimmedName }, { merge: true })
      })

      await Promise.all(updatePromises)

      setMessage({ type: "success", text: "Your name has been updated successfully!" })
      setTimeout(onBack, 1500);

    } catch (error) {
      console.error("Error updating name:", error)
      setMessage({ type: "error", text: "Failed to update name. Please try again." })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <button
        onClick={onBack}
        className="flex items-center text-primary hover:text-primary-dark transition text-sm font-semibold mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-1" />
        Back to Dashboard
      </button>

      <h2 className="text-2xl font-bold text-gray-800 flex items-center">
        <User className="w-6 h-6 mr-2 text-primary" /> Student Settings
      </h2>

      <div className="p-6 bg-white rounded-xl shadow-md border border-gray-100 space-y-4">
        <div>
          <label htmlFor="student-name" className="block text-sm font-medium text-gray-700 mb-1">
            Your Display Name
          </label>
          <input
            type="text"
            id="student-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition font-semibold"
            placeholder="Enter the name your teacher will see"
          />
          <p className="text-xs text-gray-500 mt-2">
            This is the name that will appear on class rosters and quiz results.
          </p>
        </div>
        
        {message && (
          <div
            className={`p-3 rounded-lg text-sm ${
              message.type === "success"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full flex justify-center items-center py-3 px-4 rounded-lg shadow-lg text-base font-semibold text-white transition duration-300 ${
            saving ? "bg-gray-400 cursor-not-allowed" : "bg-primary hover:bg-primary-dark"
          }`}
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin w-5 h-5 mr-3" />
              Saving...
            </>
          ) : (
             <>
              <Save className="w-5 h-5 mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  )
}