export const API_URL_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key="

export const getQuizSchema = () => ({
  type: "ARRAY",
  items: {
    type: "OBJECT",
    properties: {
      type: { type: "STRING", enum: ["MCQ", "TrueFalse", "FillIn", "ShortAnswer"] },
      question: { type: "STRING", description: "The text of the question." },
      options: {
        type: "ARRAY",
        items: { type: "STRING" },
        description: "Array of 4 options (MCQ only).",
      },
      correctAnswer: {
        type: "STRING",
        description:
          "The text of the correct answer (for T/F, Fill-in, Short Answer), or the text of the correct MCQ option.",
      },
      correctIndex: {
        type: "INTEGER",
        description: "0-based index of correct option (MCQ only).",
      },
      explanation: {
        type: "STRING",
        description: "A 1-2 sentence explanation for the correct answer.",
      },
    },
    required: ["type", "question", "correctAnswer", "explanation"],
    propertyOrdering: ["type", "question", "options", "correctAnswer", "correctIndex", "explanation"],
  },
})

export const getAiGradingSchema = () => ({
  type: "OBJECT",
  properties: {
    score: { type: "INTEGER", description: "Score out of 100 for the short answer." },
    rationale: {
      type: "STRING",
      description: "1-2 sentences explaining the derived score and what was missing or correct.",
    },
  },
  required: ["score", "rationale"],
})

export async function fetchWithExponentialBackoff(url: string, payload: any, retries = 0): Promise<any> {
  const MAX_RETRIES = 3
  const DELAY_MS = 1000
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      if (res.status === 429 && retries < MAX_RETRIES) {
        const delay = DELAY_MS * Math.pow(2, retries)
        await new Promise((r) => setTimeout(r, delay))
        return fetchWithExponentialBackoff(url, payload, retries + 1)
      }
      throw new Error(`API request failed with status: ${res.status}`)
    }
    return await res.json()
  } catch (err) {
    console.error("Fetch error:", err)
    throw new Error("Failed to communicate with the AI model. Please try again.")
  }
}

// Expose API key for client-side call to match original behavior (user can set it)
export const getGeminiApiKey = () => process.env.NEXT_PUBLIC_GEMINI_API_KEY || ""
