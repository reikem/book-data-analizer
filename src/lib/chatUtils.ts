// src/lib/chatUtils.ts
export type AskResult = { answer: string; via: "remote" }

const API_BASE = import.meta.env.VITE_API_URL ?? "https://book-data-analizer-api.vercel.app";
const PING_URL = `${API_BASE}/api/ping`

/** Verifica si el backend está respondiendo. */
export async function pingChat(): Promise<boolean> {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 4000)
    const r = await fetch(PING_URL, { method: "GET", signal: ctrl.signal })
    clearTimeout(t)
    return r.ok
  } catch {
    return false
  }
}

/** Envía pregunta al backend (POST /api/ask). Lanza Error con .status cuando no es 2xx. */
export async function askChatGPT(question: string, data: any[], companies?: string[]) {
  const r = await fetch(`${API_BASE}/api/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, data, companies }),
  });
  if (!r.ok) {
    const t = await r.text();
    const err: any = new Error(t);
    err.status = r.status;
    throw err;
  }
  return (await r.json()) as { answer: string; via: "remote" };
}

/** Resumen local cuando no hay ChatGPT (conteos + estadísticas rápidas). */
export function makeLocalSummary(q: string, data: any[]): string {
  const rows = Array.isArray(data) ? data : []
  const count = rows.length
  const columns = count ? Object.keys(rows[0]) : []

  // Detecta columnas numéricas
  const numericCols = columns.filter((c) =>
    rows.some((r) => {
      const v = r?.[c]
      if (typeof v === "number") return true
      if (typeof v === "string") {
        const num = Number.parseFloat(v.replace(/[^\d.-]/g, ""))
        return !Number.isNaN(num)
      }
      return false
    }),
  )

  const stats: string[] = []
  for (const col of numericCols.slice(0, 4)) {
    let sum = 0
    let n = 0
    let min: number | null = null
    let max: number | null = null

    for (const r of rows) {
      let val: number | null = null
      const raw = r?.[col]
      if (typeof raw === "number") val = raw
      else if (typeof raw === "string") {
        const num = Number.parseFloat(raw.replace(/[^\d.-]/g, ""))
        if (!Number.isNaN(num)) val = num
      }

      if (val !== null) {
        sum += val
        n++
        min = min === null ? val : Math.min(min, val)
        max = max === null ? val : Math.max(max, val)
      }
    }

    if (n > 0) {
      const avg = sum / n
      stats.push(
        `• ${col}: n=${n}, suma=${fmt(sum)}, promedio=${fmt(avg)}, min=${fmt(min!)}, max=${fmt(max!)}`,
      )
    }
  }

  // Top de sociedades por registros, si existe campo
  let topSoc = ""
  const keyName =
    rows[0] && ("SociedadNombre" in rows[0]
      ? "SociedadNombre"
      : "Sociedad" in rows[0]
        ? "Sociedad"
        : null)

  if (keyName) {
    const map = new Map<string, number>()
    for (const r of rows) {
      const k = String(r[keyName as string] ?? "")
      if (!k) continue
      map.set(k, (map.get(k) ?? 0) + 1)
    }
    const top = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5)
    if (top.length) {
      topSoc =
        `\nTop ${top.length} sociedades por registros:\n` +
        top.map(([k, v]) => `• ${k}: ${v}`).join("\n")
    }
  }

  return [
    "Resumen local (modo sin ChatGPT):",
    `• Registros: ${count}`,
    `• Columnas: ${columns.length}${
      columns.length ? " (" + columns.slice(0, 8).join(", ") + (columns.length > 8 ? "…" : "") + ")" : ""
    }`,
    stats.length ? "\nEstadísticas rápidas:\n" + stats.join("\n") : "",
    topSoc,
    `\nPregunta: ${q}`,
  ]
    .filter(Boolean)
    .join("\n")
}

function fmt(n: number) {
  try {
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n)
  } catch {
    return String(n)
  }
}
