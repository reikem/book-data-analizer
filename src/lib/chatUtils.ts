export type AskResult = { answer: string; via: "remote" }

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.DEV ? "http://localhost:8787" : "https://book-data-analizer-api.vercel.app")

export async function pingChat(): Promise<boolean> {
  try {
    const r = await fetch(`${API_BASE}/api/ask`, { method: "GET", mode: "cors" })
    return r.ok
  } catch {
    return false
  }
}

export async function askChatGPT(question: string, dataSample: any[]): Promise<AskResult> {
  const r = await fetch(`${API_BASE}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    mode: "cors",
    body: JSON.stringify({ question, data: dataSample.slice(0, 200) }),
  })
  if (!r.ok) throw new Error(await r.text())
  const j = await r.json()
  return { answer: j.answer ?? "Sin respuesta", via: "remote" }
}
