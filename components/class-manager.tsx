"use client"

import { useEffect, useState } from "react"
import { collection, addDoc, onSnapshot, query, where, getDocs } from "firebase/firestore"
import { Copy, Users, PlusCircle, Loader2 } from "lucide-react"
import { db } from "@/lib/firebase"
import { appId } from "@/lib/config"
import { getAuth } from "firebase/auth"

export function ClassManager() {
  const [classes, setClasses] = useState<Array<{ id: string; name: string; code: string; createdAt: string }>>([])
  const [loading, setLoading] = useState(false)
  const [newClassName, setNewClassName] = useState("")
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({})

  const uid = getAuth().currentUser?.uid

  useEffect(() => {
    if (!uid) return
    const clsRef = collection(db, "artifacts", appId, "classes")
    const q = query(clsRef, where("ownerId", "==", uid))
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }))
      setClasses(rows)
    })
    return () => unsub()
  }, [uid])

  // Load student counts for each class
  useEffect(() => {
    if (!uid) return
    const unsubs: Array<() => void> = []
    classes.forEach((c) => {
      const studentsRef = collection(db, "artifacts", appId, "classes", c.id, "students")
      const u = onSnapshot(studentsRef, (snap) => {
        setStudentCounts((prev) => ({ ...prev, [c.id]: snap.size }))
      })
      unsubs.push(u)
    })
    return () => unsubs.forEach((u) => u())
  }, [uid, classes])

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    let str = ""
    for (let i = 0; i < 6; i++) str += chars[Math.floor(Math.random() * chars.length)]
    return str
  }

  const createClass = async () => {
    if (!uid) return
    if (!newClassName.trim()) return
    setLoading(true)
    try {
      const code = generateCode()
      const clsRef = collection(db, "artifacts", appId, "classes")
      // Simple code uniqueness attempt (best-effort)
      const q = query(clsRef, where("code", "==", code))
      const existing = await getDocs(q)
      const finalCode = existing.empty ? code : generateCode()

      await addDoc(clsRef, {
        name: newClassName.trim(),
        ownerId: uid,
        code: finalCode,
        createdAt: new Date().toISOString(),
      })
      setNewClassName("")
    } catch (e) {
      console.error("Create class failed:", e)
      alert("Failed to create class. See console for details.")
    } finally {
      setLoading(false)
    }
  }

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert("Class code copied!")
    } catch {
      // no-op
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800 flex items-center">
        <Users className="w-6 h-6 mr-2 text-primary" /> Classes
      </h2>

      <div className="p-4 bg-white rounded-xl shadow-md border border-gray-100 space-y-3">
        <label className="text-sm font-medium text-gray-700">Create a new class</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newClassName}
            onChange={(e) => setNewClassName(e.target.value)}
            placeholder="e.g., 9th Grade Biology"
            className="flex-1 border rounded-lg px-3 py-2"
          />
          <button
            onClick={createClass}
            disabled={loading || !newClassName.trim()}
            className={`px-4 py-2 rounded-lg text-white font-semibold flex items-center ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-primary hover:bg-primary/90"
            }`}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlusCircle className="w-4 h-4 mr-2" />}
            Create
          </button>
        </div>
        <p className="text-xs text-gray-500">A 6-character class code will be generated automatically.</p>
      </div>

      <div className="space-y-3">
        {classes.length === 0 ? (
          <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300 text-gray-500">
            No classes yet. Create your first class to invite students.
          </div>
        ) : (
          classes.map((c) => (
            <div
              key={c.id}
              className="p-4 bg-white rounded-xl shadow-md border border-gray-100 flex justify-between items-center"
            >
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{c.name}</h3>
                <p className="text-sm text-gray-500">Created: {new Date(c.createdAt).toLocaleDateString()}</p>
                <p className="text-xs text-gray-600 mt-1">
                  Students joined: <span className="font-semibold text-primary">{studentCounts[c.id] ?? 0}</span>
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-sm font-semibold">{c.code}</span>
                <button
                  onClick={() => copy(c.code)}
                  className="px-3 py-1 bg-secondary/10 text-secondary rounded-lg hover:bg-secondary/20 flex items-center"
                  title="Copy class code"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
