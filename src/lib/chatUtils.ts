export type AskResult = { answer: string; via: "remote" }

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.DEV ? "http://localhost:8787" : "https://book-data-analizer-api.vercel.app")

export class RemoteError extends Error {
  kind: "network" | "api"
  status?: number
  constructor(message: string, kind: "network" | "api", status?: number) {
    super(message)
    this.kind = kind
    this.status = status
  }
}

export async function pingChat(): Promise<boolean> {
  try {
    const r = await fetch(`${API_BASE}/api/ask`, { method: "GET", mode: "cors", cache: "no-store" })
    return r.ok
  } catch {
    return false
  }
}

export async function askChatGPT(question: string, dataSample: any[]): Promise<AskResult> {
  // 🔎 manda pocos campos y pocos registros
  const sample = (Array.isArray(dataSample) ? dataSample : [])
    .slice(0, 50)
    .map((r) => ({
      SociedadNombre: r.SociedadNombre,
      SociedadCodigo: r.SociedadCodigo,
      MontoEstandarizado: r.MontoEstandarizado,
      Mes: r.Mes ?? r.mes,
      LibroMayor: r.LibroMayor,
    }))

  let r: Response
  try {
    r = await fetch(`${API_BASE}/api/ask`, {
      method: "POST",
      mode: "cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, data: sample }),
    })
  } catch (e: any) {
    // Network/CORS
    throw new RemoteError(e?.message ?? "Network error", "network")
  }

  if (!r.ok) {
    const txt = await r.text().catch(() => "")
    throw new RemoteError(txt || `HTTP ${r.status}`, "api", r.status)
  }

  const j = await r.json().catch(() => ({}))
  const answer = j?.answer ?? "Sin respuesta."
  return { answer, via: "remote" }
}

export function makeLocalSummary(q: string, data: any[]): string {
  const cols = data.length ? Object.keys(data[0]) : []
  return `Resumen local:\n- Registros: ${data.length}\n- Columnas: ${cols.length}\n- Pregunta: ${q}`
}