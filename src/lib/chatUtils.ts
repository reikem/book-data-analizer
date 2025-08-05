// src/lib/chatUtils.ts
export type AskResult = { answer: string; via: "remote" }

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.DEV ? "http://localhost:8787" : "https://book-data-analizer-api.vercel.app")

/** Comprueba si el backend (y por ende ChatGPT) responde */
export async function pingChat(): Promise<boolean> {
  try {
    const r = await fetch(`${API_BASE}/api/ask`, {
      method: "GET",
      mode: "cors",
      cache: "no-store",
    })
    return r.ok
  } catch {
    return false
  }
}

/** Consulta remota a tu backend /api/ask (Vercel) */
export async function askChatGPT(question: string, dataSample: any[]): Promise<AskResult> {
  const r = await fetch(`${API_BASE}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    mode: "cors",
    body: JSON.stringify({ question, data: dataSample.slice(0, 200) }),
  })
  if (!r.ok) throw new Error(await r.text())
  const j = await r.json()
  return { answer: j?.answer ?? "Sin respuesta.", via: "remote" }
}

/** Resumen local cuando no hay conexión remota */
export function makeLocalSummary(q: string, data: any[]): string {
  const cols = data.length ? Object.keys(data[0]) : []
  return `Resumen local:\n- Registros: ${data.length}\n- Columnas: ${cols.length}\n- Pregunta: ${q}`
}
