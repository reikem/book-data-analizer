export type AskResult = { answer: string; via: "remote" | "local" }

export async function pingChat(): Promise<boolean> {
  try {
    const r = await fetch("/api/health", { method: "GET" })
    return r.ok
  } catch {
    return false
  }
}
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8787"

export async function askChatGPT(question: string, data: any[], companies?: string[]) {
  const r = await fetch(`${API_URL}/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, data, companies }),
  })
  if (!r.ok) {
    const text = await r.text().catch(() => "")
    throw new Error(text || `HTTP ${r.status}`)
  }
  const json = await r.json()
  return json.answer as string
}
// --------- Resumen local muy simple (ajusta a tu gusto) ----------
function num(v: any) {
  if (typeof v === "number") return v
  const s = String(v ?? "").replace(/\./g, "").replace(",", ".")
  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

function getAmount(row: Record<string, any>) {
  const keys = ["MontoEstandarizado", "monto", "Importe en ML", "Importe ML", "Importe", "amount"]
  for (const k of keys) {
    if (k in row) return num(row[k])
  }
  return 0
}

export function makeLocalSummary(question: string, rows: any[]): string {
  if (!rows?.length) return "No hay datos para resumir."

  const companies = new Set<string>()
  let total = 0
  const byMonth = new Map<string, { total: number; count: number }>()
  const byCompany = new Map<string, number>()

  rows.slice(0, 2000).forEach((r) => {
    const name = (r.SociedadNombre ?? r.Sociedad ?? r["Soc."] ?? "").toString()
    const code = (r.SociedadCodigo ?? r.codigo ?? "").toString()
    const display = name || code || "Sin sociedad"
    companies.add(display)

    const month = (r.Mes ?? r.mes ?? "Sin mes").toString()
    const amt = getAmount(r)
    total += amt

    const m = byMonth.get(month) ?? { total: 0, count: 0 }
    m.total += amt
    m.count += 1
    byMonth.set(month, m)

    byCompany.set(display, (byCompany.get(display) ?? 0) + Math.abs(amt))
  })

  const avg = total / rows.length
  const topCompanies = [...byCompany.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, val]) => `• ${name}: $${Math.round(val).toLocaleString()}`)
    .join("\n")

  const months = [...byMonth.entries()]
    .sort((a, b) => (a[0] > b[0] ? 1 : -1))
    .slice(0, 6)
    .map(([m, d]) => `• ${m}: total $${Math.round(d.total).toLocaleString()} (${d.count} registros)`)
    .join("\n")

  return [
    "📝 *Resumen local* (sin conexión a ChatGPT):",
    `• Registros: ${rows.length.toLocaleString()}`,
    `• Sociedades: ${companies.size}`,
    `• Monto total: $${Math.round(total).toLocaleString()}`,
    `• Promedio por registro: $${Math.round(avg).toLocaleString()}`,
    "",
    "Top sociedades por monto absoluto:",
    topCompanies || "• (no disponible)",
    "",
    "Tendencia por mes (muestra):",
    months || "• (no disponible)",
    "",
    "Pregunta recibida:",
    `“${question}”`,
  ].join("\n")
}
