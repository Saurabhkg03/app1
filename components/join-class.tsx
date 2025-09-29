"use client"

import { useState } from "react"
import { collection, doc, getDocs, query, setDoc, where } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { appId } from "@/lib/config"
import { getAuth } from "firebase/auth"
import { UserPlus, Loader2 } from "lucide-react"

export function JoinClass({ userId }: { userId: string }) {
  const [code, setCode] = useState("")
  const [joining, setJoining] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const doJoin = async () => {
    setMessage(null)
    const trimmed = code.replace(/\s+/g, "").toUpperCase()
    if (!trimmed || trimmed.length < 6) {
      setMessage("Enter a valid class code.")
      return
    }
    setJoining(true)
    try {
      // Find class by code
      const clsRef = collection(db, "artifacts", appId, "classes")
      const q = query(clsRef, where("code", "==", trimmed))
      const snap = await getDocs(q)
      if (snap.empty) {
        setMessage("No class found with that code.")
        setJoining(false)
        return
      }
      const cdoc = snap.docs[0]
      const classId = cdoc.id
      const classData = cdoc.data() as any

      const authUser = getAuth().currentUser
      const profileName = authUser?.displayName || "Student"
      const profileEmail = authUser?.email || ""

      // Write to class -> students
      const studentDocRef = doc(db, "artifacts", appId, "classes", classId, "students", userId)
      await setDoc(studentDocRef, {
        studentId: userId,
        name: profileName,
        email: profileEmail,
        joinedAt: new Date().toISOString(),
      })

      // Write to user -> enrollments
      const enrollmentRef = doc(db, "artifacts", appId, "users", userId, "enrollments", classId)
      await setDoc(enrollmentRef, {
        id: classId,
        name: classData.name,
        code: classData.code,
        ownerId: classData.ownerId,
        joinedAt: new Date().toISOString(),
      })

      setMessage(`Joined ${classData.name} successfully!`)
      setCode("")
    } catch (e) {
      console.error("Join class failed:", e)
      setMessage("Failed to join. Please try again.")
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="p-4 bg-white rounded-xl shadow-md border border-gray-100 space-y-3">
      <div className="flex items-center">
        <UserPlus className="w-5 h-5 mr-2 text-primary" />
        <h3 className="text-lg font-semibold text-gray-800">Join a Class</h3>
      </div>
      <div className="flex gap-2">
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter 6-character class code"
          className="flex-1 border rounded-lg px-3 py-2"
        />
        <button
          onClick={doJoin}
          disabled={joining || !code.trim()}
          className={`px-4 py-2 rounded-lg text-white font-semibold flex items-center ${
            joining ? "bg-gray-400 cursor-not-allowed" : "bg-primary hover:bg-primary/90"
          }`}
        >
          {joining ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Join
        </button>
      </div>
      {message && <p className="text-sm text-gray-700">{message}</p>}
    </div>
  )
}
