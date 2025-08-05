export type AskResult = { answer: string; via: "remote" }

// Puedes configurar la URL del servidor en .env como:
// VITE_API_BASE="http://localhost:8787"
// o "https://tu-dominio" si lo despliegas
const API_BASE =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE) ||
  "http://localhost:8787"

/**
 * Llama a tu backend /ask con la pregunta y una muestra de datos.
 * Devuelve la respuesta del servidor y marca via="remote".
 */
export async function askChatGPT(question: string, dataSample: any[]): Promise<AskResult> {
  // Reducir payload por seguridad (p.ej. primeras 200 filas)
  const payload = {
    question,
    data: Array.isArray(dataSample) ? dataSample.slice(0, 200) : [],
  }

  const res = await fetch(`${API_BASE}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    mode: "cors",
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    // Propaga un error para que ChatInterface haga fallback local
    const text = await res.text().catch(() => "")
    throw new Error(text || `Error ${res.status} al consultar /ask`)
  }

  const json: unknown = await res.json().catch(() => ({}))
  const answer =
    (json as { answer?: string })?.answer?.toString() ??
    "No recibí una respuesta del servicio."

  return { answer, via: "remote" }
}

/**
 * Verifica si el servidor está disponible (usado para decidir si usar remoto o resumen local).
 */
export async function pingChat(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/`, { method: "GET", mode: "cors" })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Resumen local simple cuando el remoto no está disponible.
 */
export function makeLocalSummary(q: string, data: any[]): string {
  const count = Array.isArray(data) ? data.length : 0
  const cols = count ? Object.keys(data[0] ?? {}) : []
  // Pequeño muestreo de valores únicos de SociedadNombre
  const sociedades = new Set<string>()
  for (let i = 0; i < Math.min(200, count); i++) {
    const n = data[i]?.SociedadNombre
    if (typeof n === "string" && n.trim()) sociedades.add(n.trim())
    if (sociedades.size >= 10) break
  }

  return [
    "Resumen local (modo offline):",
    `• Pregunta: ${q}`,
    `• Registros visibles: ${count}`,
    `• Columnas detectadas: ${cols.length}${cols.length ? ` (${cols.slice(0, 8).join(", ")}${cols.length > 8 ? ", …" : ""})` : ""}`,
    `• Sociedades (muestra): ${[...sociedades].slice(0, 10).join(", ") || "—"}`,
  ].join("\n")
}