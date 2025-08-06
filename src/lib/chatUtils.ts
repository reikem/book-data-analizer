// src/lib/chatUtils.ts
export type Via = "remote" | "local"
export type AskResult = { answer: string; via: Via }

// Preferimos tomar la URL del backend desde env (Vite) y dejamos un fallback a tu API en Vercel
const API_BASE =
  import.meta.env.VITE_API_BASE?.toString().replace(/\/+$/, "") ||
  "https://book-data-analizer-api.vercel.app"

/** Ping: verifica si el backend está arriba y accesible (CORS incluido) */
export async function pingChat(): Promise<boolean> {
  try {
    const r = await fetch(`${API_BASE}/api/ping`, {
      method: "GET",
      mode: "cors",
    })
    return r.ok
  } catch {
    return false
  }
}

/** Pregunta al backend /api/ask (remoto). Lanza error si la API falla. */
export async function askChatGPT(
  question: string,
  dataSample: any[],
  companies?: string[],
): Promise<AskResult> {
  const payload = {
    question,
    // manda una muestra limitada para no exceder tamaño
    data: Array.isArray(dataSample) ? dataSample.slice(0, 200) : [],
    companies: companies ?? [],
  }

  const res = await fetch(`${API_BASE}/api/ask`, {
    method: "POST",
    mode: "cors",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    // Propaga el error para que ChatInterface haga fallback local
    const text = await res.text().catch(() => "")
    throw new Error(text || `Remote error: ${res.status}`)
  }

  const json = await res.json().catch(() => ({}))
  const answer: string = json?.answer ?? ""
  return { answer, via: "remote" }
}

/** Resumen local de emergencia cuando el backend no está disponible */
export function makeLocalSummary(q: string, data: any[]): string {
  const rows = Array.isArray(data) ? data : []
  const cols = rows.length ? Object.keys(rows[0]) : []
  const n = rows.length

  const companies = new Set<string>()
  for (const r of rows) {
    const name = (r?.SociedadNombre ?? r?.Sociedad ?? "").toString().trim()
    if (name) companies.add(name)
    if (companies.size >= 5) break
  }

  return [
    "Resumen local:",
    `- Registros: ${n}`,
    `- Columnas: ${cols.length}`,
    `- Sociedades (ej.): ${Array.from(companies).join(", ") || "N/A"}`,
    `- Pregunta: ${q}`,
  ].join("\n")
}
