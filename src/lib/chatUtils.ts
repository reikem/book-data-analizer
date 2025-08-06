// lib/chatUtils.ts
export type Via = "remote" | "local"
export type AskResult = { answer: string; via: Via }

const API_BASE = "https://book-data-analizer-api.vercel.app"

export async function askChatGPT(question: string, dataSample: any[]): Promise<AskResult> {
  const r = await fetch(`${API_BASE}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, data: dataSample, companies: [] }),
  })

  if (!r.ok) {
    const body = await r.text()
    const err = new Error(body) as any
    err.status = r.status // 👈 adjuntamos el status
    throw err
  }

  const json = await r.json()
  const answer = json?.answer ?? "Sin respuesta."
  return { answer, via: "remote" }
}

export async function pingChat(): Promise<boolean> {
  try {
    const r = await fetch(`${API_BASE}/api/ping`, { method: "GET" })
    return r.ok
  } catch {
    return false
  }
}

export function makeLocalSummary(q: string, data: any[]): string {
  const cols = data.length ? Object.keys(data[0]) : []
  return `Resumen local:\n- Registros: ${data.length}\n- Columnas: ${cols.length}\n- Pregunta: ${q}`
}
